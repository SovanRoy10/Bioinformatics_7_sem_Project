# Identification of Essential Proteins of Cancer Using Deep Learning

## Overview

This project focuses on the identification of **essential proteins related to cancer** using deep learning techniques. The approach combines sequence-based features, entropy metrics, and protein-protein interaction network analysis to classify whether a given protein plays a crucial role in cancer development.

---
## 🎥 Project Demo Video

To see a walkthrough of the system and its capabilities in action, watch the project demo video on YouTube:

[![Watch the video](https://img.youtube.com/vi/VN7mKmYBY60/0.jpg)](https://youtu.be/VN7mKmYBY60?si=o4joYoo7_ltJ6Bwf)

🔗 **[Click here to watch the video](https://youtu.be/VN7mKmYBY60?si=o4joYoo7_ltJ6Bwf)**
---
## Workflow Summary

1. **Input**: UniProt ID of a human protein
2. **Feature Extraction**:
   - Sequence-based and physicochemical features using **Pfeature**
   - Shannon entropy and residue-wise entropy
   - Centrality features from interaction networks
3. **Modeling**: Deep learning classification using **TensorFlow/Keras**
4. **Prediction Output**:
   - Label: Essential (1) or Non-essential (0)
   - If essential, retrieves related drugs and supporting web links

---

## 🔄 System Architecture Diagram
This diagram shows the entire pipeline—from the user input, through feature extraction, model inference, and external API integration (UniProt, PubChem, etc.), to the final result presentation.

![System Architecture Diagram](Diagrams/system_architecture_diagram.svg)

## 🧑‍💼 Use Case Diagram

This illustrates all user interactions, including protein prediction, drug retrieval, and literature or trial lookup.

![Use Case Diagram](Diagrams/use_case_diagram.png)

## 🧭 Activity Diagram

This shows the step-by-step flow from data submission to final prediction and output visualization, including key branching decisions.

![Activity Diagram](Diagrams/activity_diagram.png)

## 🧬 Entity Relationship Diagram (ERD)

The ERD models key datasets—Proteins, Drugs, Clinical Trials, Prediction Results, and their relationships. It's useful for understanding the underlying database structure.

![Entity Relationship Diagram](Diagrams/ER_Diagram.png)

## Screen Design Layout Constraint

![Screen Design Layout Constraint](Diagrams/Screen.png)

## Feature Extraction

- **Tool Used**: [Pfeature](https://webs.iiitd.edu.in/raghava/pfeature/)
- **Features Extracted**:
  - Amino Acid Composition
  - Physicochemical Properties
  - Shannon Entropy
  - Shannon Entropy by Residue
  - Network Centrality Measures:
    - Degree Centrality
    - Betweenness Centrality
    - Closeness Centrality
    - Eigenvector Centrality

---

## Network Analysis Tools

Instead of NetworkX, we used Cytoscape-based tools:

- **Cytoscape**: Visualization and network management
- **CytoNCA**: For centrality calculations
- **StringApp**: To import interaction data from the STRING database

---

## Model Architecture

- Framework: TensorFlow/PyTorch
- Optimizer: **Adam**
- Loss Function: Binary Crossentropy
- Metrics: Accuracy, AUC-ROC

---

## Evaluation Metrics

- **Confusion Matrix**:
  - TP (True Positives)
  - FP (False Positives)
  - TN (True Negatives)
  - FN (False Negatives)
- **ROC Curve**: Receiver Operating Characteristic
- **AUC**: Area Under Curve
- **False Positive Rate**
- **Precision**, **Recall**, **F1 Score**

---
## 📊 Model Visualizations

### 1. ROC Curve
![ROC Curve](images/roc_curve.png)

### 2. Precision-Recall Curve
![Precision-Recall Curve](images/precision_recall_curve.png)

### 3. Confusion Matrix
![Confusion Matrix](images/confusion_matrix.png)

### 4. Loss vs Epochs
![Loss vs Epochs](images/loss_vs_epochs.png)

---
## Why These Features?

These features were chosen based on biological significance and computational relevance:

- **Sequence-based features** capture amino acid patterns
- **Shannon entropy** reflects sequence complexity
- **Centrality metrics** represent the protein’s role in interaction networks
- These factors are critical in determining protein essentiality in cancer pathways

---

## How Shannon Entropy Helps

Shannon entropy measures the randomness in a protein sequence. Proteins with high entropy may have diverse functional regions, suggesting essential biological roles. Residue-wise entropy helps to pinpoint variability at specific positions in the sequence.

---

## Tools and Libraries Used

- Python
- TensorFlow / Keras
- Pfeature
- Cytoscape + CytoNCA + StringApp
- Pandas, NumPy, Scikit-learn
- Matplotlib / Seaborn (for visualization)

---

## Future Directions

- Expand dataset with more diverse cancer types
- Integrate 3D structural and expression data
- Add interpretability tools to explain model predictions
- Link predictions with clinical drug response data

---

