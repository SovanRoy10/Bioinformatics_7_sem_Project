from flask import Flask, request, jsonify
from dotenv import load_dotenv
from flask_cors import CORS
import os
import tempfile
from Pfeature import aac_wp, pcp_wp, ser_wp, sep_wp
import pandas as pd
import pickle
import logging
import torch
from sklearn.metrics import accuracy_score, roc_auc_score, f1_score, confusion_matrix, roc_curve, precision_recall_curve
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


load_dotenv()

cors_origin = os.getenv("FLASK_CORS_ORIGIN", "*")

app = Flask(__name__)
CORS(app, origins=[cors_origin], methods=["GET", "POST", "OPTIONS"])


from model import BinaryClassifier
from ReportGenerator import DrugRepurposingReporter

reporter = DrugRepurposingReporter(csv_path="Drugs.csv")

with open('new_dl_model.pkl', 'rb') as f:
    model, trained_columns = pickle.load(f)

with open('test_data.pkl', 'rb') as f:
    X_test, y_test = pickle.load(f)


centrality_df = pd.read_csv("Centrality_Data_03.csv")
centrality_columns = ['Betweenness', 'Betweenness(Weight)', 'Closeness', 'Closeness(Weight)',
                      'Degree', 'Degree(Weight)', 'Eigenvector', 'Eigenvector(Weight)']

@app.route('/api/detect-protein', methods=['POST'])
def detect_protein():
    logger.debug("Received request for protein detection.")
    data = request.json
    sequence = data.get('sequence')
    uniportId = data.get('uniprotId')
    # logger.debug(f"Request data: {data}")
    fasta_content = convert_to_fasta(sequence)
    fasta_file_path = save_fasta_to_file(fasta_content)
    output_aac = "output_aac.csv"
    output_pcp = "output_pcp.csv"
    output_ser = "output_ser.csv"
    output_sep = "output_sep.csv"
    aac_wp(fasta_file_path, output_aac)
    pcp_wp(fasta_file_path, output_pcp)
    ser_wp(fasta_file_path, output_ser)
    sep_wp(fasta_file_path, output_sep)
    df_aac = pd.read_csv(output_aac)
    df_pcp = pd.read_csv(output_pcp)
    df_ser = pd.read_csv(output_ser)
    df_sep = pd.read_csv(output_sep)
    merged_df = pd.concat([df_aac, df_pcp, df_ser, df_sep], axis=1)

    centrality_row = centrality_df[centrality_df['UniProt_ID'] == uniportId]
    if centrality_row.empty:
        logger.error(f"No centrality data found for UniProt ID: {uniportId}")
        return jsonify({"error": f"No centrality data found for UniProt ID: {uniportId}"}), 400
    centrality_values = centrality_row[centrality_columns].values.flatten()
    for col, val in zip(centrality_columns, centrality_values):
        merged_df[col] = val

    # merged_output = "merged_output.csv"
    # merged_df.to_csv(merged_output, index=False)

    os.remove(output_aac)
    os.remove(output_pcp)
    os.remove(output_ser)
    os.remove(output_sep)
    os.remove(fasta_file_path)

    X_merged = merged_df[trained_columns].values  # Single input row
    X_tensor = torch.tensor(X_merged, dtype=torch.float32)

    if len(X_tensor.shape) == 1:
        X_tensor = X_tensor.unsqueeze(0)

    model.eval()
    with torch.no_grad():
        y_prob = model(X_tensor)
        y_pred = int((y_prob >= 0.5).item())

    label_map = {0: 'NEGATIVE', 1: 'POSITIVE'}
    y_pred_label = label_map[y_pred]

    logger.info(y_pred_label)
    if y_pred_label == "NEGATIVE":
        return jsonify({"predictions": y_pred_label})
    try:
        report = reporter.generate_report(uniportId)

        if not report:
            return jsonify({
                "predictions": y_pred_label,
                "message": "No drug information found for this UniProt ID."
            })

        return jsonify({
            "predictions": y_pred_label,
            "drugs": report
        })

    except Exception as e:
        logger.error(f"Error in drug report generation: {str(e)}")
        return jsonify({
            "predictions": y_pred_label,
            "error": "An error occurred while generating the drug report."
        }), 500


@app.route('/api/model-metrics', methods=['GET'])
def get_model_metrics():
    # Evaluate on test set
    model.eval()
    with torch.no_grad():
        y_probs = model(X_test).numpy()
        y_preds = (y_probs >= 0.5).astype(int)

    y_true = y_test.numpy()

    acc = accuracy_score(y_true, y_preds)
    f1 = f1_score(y_true, y_preds)
    roc = roc_auc_score(y_true, y_probs)

    # Confusion Matrix
    fig_cm = plt.figure()
    sns.heatmap(confusion_matrix(y_true, y_preds), annot=True, fmt="d", cmap="Blues")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.title("Confusion Matrix")
    cm_base64 = plot_to_base64(fig_cm)
    plt.close(fig_cm)

    fpr, tpr, _ = roc_curve(y_true, y_probs)
    fig_roc = plt.figure()
    plt.plot(fpr, tpr, label=f'ROC AUC = {roc:.2f}')
    plt.plot([0, 1], [0, 1], '--', color='gray')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve')
    plt.legend()
    plt.grid(True)
    roc_base64 = plot_to_base64(fig_roc)
    plt.close(fig_roc)

    # PR Curve
    precision, recall, _ = precision_recall_curve(y_true, y_probs)
    fig_pr = plt.figure()
    plt.plot(recall, precision)
    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curve')
    plt.grid(True)
    pr_base64 = plot_to_base64(fig_pr)
    plt.close(fig_pr)

    return jsonify({
        "metrics": {
            "accuracy": acc,
            "f1_score": f1,
            "roc_auc": roc
        },
        "images": {
            "confusion_matrix": cm_base64,
            "roc_curve": roc_base64,
            "precision_recall_curve": pr_base64
        }
    })


def convert_to_fasta(sequence, identifier="Protein_1"):
    fasta_format = f">{identifier}\n{sequence}"
    return fasta_format

def save_fasta_to_file(fasta_content):
    temp_file = tempfile.NamedTemporaryFile(delete=False, mode="w", suffix=".fasta")
    temp_file.write(fasta_content)
    temp_file.close()
    return temp_file.name

def plot_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    buf.close()
    return img_base64

if __name__ == '__main__':
    app.run()
