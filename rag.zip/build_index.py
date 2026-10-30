import json
from pathlib import Path
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

CORPUS = Path("data/corpus.jsonl")
CHROMA_DIR = Path("rag/chroma_db")

def load_docs() -> list[Document]:
    docs = []
    with CORPUS.open(encoding="utf-8") as f:
        for line in f:
            obj = json.loads(line)
            meta = {"type": obj["type"], "id": obj["id"]}
            if obj["type"] == "article":
                meta["article"] = obj["article"]
                meta["title"] = obj["title"]
            elif obj["type"] == "judgment":
                meta["title"] = obj["title"]
                meta["year"] = obj["year"]
            elif obj["type"] == "amendment":
                meta["number"] = obj["number"]
                meta["year"] = obj["year"]
            docs.append(Document(page_content=obj["text"], metadata=meta))
    return docs

def main():
    print(f"Loading corpus from {CORPUS}...")
    docs = load_docs()
    print(f"  → {len(docs)} documents")

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    chunks = splitter.split_documents(docs)
    print(f"  → {len(chunks)} chunks after splitting")

    print("Embedding with all-MiniLM-L6-v2...")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

    print(f"Writing to {CHROMA_DIR}...")
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    vectordb = Chroma.from_documents(chunks, embeddings, persist_directory=str(CHROMA_DIR))
    vectordb.persist()
    print(f"✓ Index built: {len(chunks)} chunks → {CHROMA_DIR}")

if __name__ == "__main__":
    main()