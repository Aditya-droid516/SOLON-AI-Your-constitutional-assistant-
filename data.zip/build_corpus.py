import json
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from amendments_template import AMENDMENTS

def load_articles():
    print("1. Loading COI.json...")
    with open("data/COI.json", encoding="utf-8") as f:
        coi = json.load(f)
    out = []
    for art in coi[0]:
        no = str(art.get("ArtNo", "")).strip()
        name = str(art.get("Name", "")).strip()
        desc = str(art.get("ArtDesc", "")).strip()
        
        clauses_list = art.get("Clauses", [])
        clauses = " ".join(str(c.get("ClauseDesc", "")) for c in clauses_list if isinstance(c, dict)) if isinstance(clauses_list, list) else ""
        
        text = f"Article {no}: {name}\n{desc}\n{clauses}".strip()
        
        if len(text) < 10: continue
        
        out.append({"id": f"art_{no}", "type": "article", "article": no, "title": name, "text": text})
    print(f"   -> Found {len(out)} articles.")
    return out

def load_amendments():
    print("2. Loading Amendments...")
    return [{"id": f"amend_{a['number']}", "type": "amendment", "number": a["number"], "year": a["year"], "affects": a["affects"], "text": f"Amendment {a['number']} ({a['year']}): {a['summary']}"} for a in AMENDMENTS]

def load_judgments():
    print("3. Loading judgments.jsonl...")
    out = []
    # Here is the fix: encoding="utf-8-sig" handles the hidden PowerShell BOM
    with open("data/judgments.jsonl", encoding="utf-8-sig") as f:
        for i, line in enumerate(f):
            if not line.strip(): continue
            j = json.loads(line)
            out.append({"id": f"case_{i}", "type": "judgment", "title": j["name"], "year": j["year"], "articles": j["articles"], "text": f"{j['name']} ({j['year']}): {j['summary']}"})
    print(f"   -> Found {len(out)} judgments.")
    return out

def main():
    print("=== STARTING BUILD ===")
    corpus = load_articles() + load_amendments() + load_judgments()
    
    print("4. Writing to data/corpus.jsonl...")
    with open("data/corpus.jsonl", "w", encoding="utf-8") as f:
        for doc in corpus:
            f.write(json.dumps(doc, ensure_ascii=False) + "\n")
            
    print(f"=== DONE! Wrote {len(corpus)} total documents. ===")

if __name__ == "__main__":
    main()