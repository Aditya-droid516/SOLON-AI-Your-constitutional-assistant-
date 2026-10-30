from pathlib import Path
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

CHROMA_DIR = Path("rag/chroma_db")
_vectordb = None

def get_vectordb() -> Chroma:
    global _vectordb
    if _vectordb is None:
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        _vectordb = Chroma(persist_directory=str(CHROMA_DIR), embedding_function=embeddings)
    return _vectordb

def retrieve(query: str, k: int = 5) -> list[Document]:
    vdb = get_vectordb()
    return vdb.similarity_search(query, k=k)

def format_context(docs: list[Document]) -> str:
    parts = []
    for d in docs:
        m = d.metadata
        if m.get("type") == "article":
            header = f"[Article {m['article']} — {m.get('title','')}]"
        elif m.get("type") == "judgment":
            header = f"[Case: {m.get('title','')} ({m.get('year','')})]"
        elif m.get("type") == "amendment":
            header = f"[Amendment {m.get('number')} ({m.get('year','')})]"
        else:
            header = f"[{m.get('type','doc')}]"
        parts.append(f"{header}\n{d.page_content}")
    return "\n\n".join(parts)