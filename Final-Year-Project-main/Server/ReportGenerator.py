import google.generativeai as genai
from dotenv import load_dotenv
import os
import pandas as pd
import json
import re
import requests



load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


class DrugRepurposingReporter:
    def __init__(self, csv_path: str):
        genai.configure(api_key=GEMINI_API_KEY)
        self.model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        self.csv_path = csv_path

    def get_drug_ids(self, uniprot_id: str):
        df = pd.read_csv(self.csv_path)
        row = df[df["UniProt ID"] == uniprot_id]
        if row.empty:
            return None
        return row.iloc[0]["Drug IDs"].split("; ")

    def fetch_drug_names_with_llm(self, drug_ids: list[str]) -> list[dict]:
        prompt = (
            f"For the following DrugBank IDs: {', '.join(drug_ids)}, provide:\n"
            "- Drug name\n"
            "- A short description of its function\n\n"
            "Respond in JSON format like this:\n"
            "[\n"
            "  {\n"
            "    \"drugId\": \"DB0001\",\n"
            "    \"name\": \"ExampleName\",\n"
            "    \"description\": \"Short description...\"\n"
            "  },\n"
            "  ...\n"
            "]"
        )
        response = self.model.generate_content(prompt)
        try:
            raw = response.text
            json_block = re.search(r"\[.*\]", raw, re.DOTALL)
            return json.loads(json_block.group(0)) if json_block else []
        except Exception:
            return []

    def fetch_pubchem_info(self, drug_name: str):
        try:
            url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{drug_name}/JSON"
            res = requests.get(url)
            data = res.json()
            info = data["PC_Compounds"][0]
            return {
                "synonyms": info.get("props", []),
                "cid": info.get("id", {}).get("id", {}).get("cid"),
            }
        except Exception:
            return {}

    def fetch_pubmed_articles(self, drug_name: str):
        try:
            search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
            params = {
                "db": "pubmed",
                "term": f"{drug_name} AND cancer",
                "retmode": "json",
                "retmax": 3,
            }
            res = requests.get(search_url, params=params)
            ids = res.json()["esearchresult"]["idlist"]
            links = [f"https://pubmed.ncbi.nlm.nih.gov/{id_}/" for id_ in ids]
            return links
        except Exception:
            return []

    def fetch_clinical_trials(self, drug_name: str):
        try:
            url = "https://clinicaltrials.gov/api/query/study_fields"
            params = {
                "expr": drug_name,
                "fields": "NCTId,BriefTitle",
                "min_rnk": 1,
                "max_rnk": 3,
                "fmt": "json",
            }
            res = requests.get(url, params=params)
            studies = res.json()["StudyFieldsResponse"]["StudyFields"]
            return [
                {
                    "title": study["BriefTitle"][0] if study["BriefTitle"] else "",
                    "link": f"https://clinicaltrials.gov/ct2/show/{study['NCTId'][0]}"
                } for study in studies
            ]
        except Exception:
            return []

    def generate_report(self, uniprot_id: str) -> list[dict]:
        drug_ids = self.get_drug_ids(uniprot_id)
        if not drug_ids:
            return []

        basic_info = self.fetch_drug_names_with_llm(drug_ids)
        report = []
        for item in basic_info:
            name = item.get("name", "")
            entry = {
                "drugId": item.get("drugId"),
                "name": name,
                "description": item.get("description"),
                "pubchem": self.fetch_pubchem_info(name),
                "pubmed_articles": self.fetch_pubmed_articles(name),
                "clinical_trials": self.fetch_clinical_trials(name),
            }
            report.append(entry)

        return report
