from pathlib import Path
from llama_cpp import Llama
from rag.retrieve import retrieve, format_context
from reasoning.prompts import (SYSTEM_PROMPT, ISSUE_EXTRACTION_PROMPT, 
                               IRAC_PROMPT, VERIFY_PROMPT, FIX_PROMPT)

MODEL_DIR = Path("models")
_LLM = None

def get_llm() -> Llama:
    global _LLM
    if _LLM is None:
        candidates = list(MODEL_DIR.glob("*.gguf"))
        if not candidates:
            raise FileNotFoundError("No .gguf model in models/.")
        model_path = str(candidates[0])
        print(f"Loading model: {model_path} (This takes a minute...)")
        _LLM = Llama(model_path=model_path, n_ctx=4096, n_threads=8, n_gpu_layers=-1, verbose=False)
    return _LLM

def llm_call(prompt, system=SYSTEM_PROMPT, max_tokens=800, temp=0.2):
    llm = get_llm()
    out = llm.create_chat_completion(
        messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
        temperature=temp, max_tokens=max_tokens,
    )
    return out["choices"][0]["message"]["content"].strip()

def answer(situation: str, k: int = 4) -> dict:
    print("  [1/5] Extracting legal issues...")
    issues = llm_call(ISSUE_EXTRACTION_PROMPT.format(situation=situation), max_tokens=200)
    print(f"        Found issues:\n{issues}\n")

    print("  [2/5] Retrieving targeted provisions...")
    all_docs = []
    for issue in issues.split("\n"):
        if not issue.strip(): continue
        docs = retrieve(issue, k=k)
        all_docs.extend(docs)
    
    # Deduplicate
    seen, unique_docs = set(), []
    for d in all_docs:
        key = d.metadata.get("id")
        if key not in seen:
            seen.add(key)
            unique_docs.append(d)
    
    context = format_context(unique_docs)

    print("  [3/5] Generating IRAC legal analysis...")
    draft = llm_call(IRAC_PROMPT.format(context=context, situation=situation, issues=issues), max_tokens=1024, temp=0.1)

    print("  [4/5] Verifying citations against sources...")
    critique = llm_call(VERIFY_PROMPT.format(context=context, draft=draft), max_tokens=200, temp=0.0)

    verified = "VERIFIED" in critique.upper()
    
    if not verified:
        print("  [5/5] Errors found. Self-correcting...")
        draft = llm_call(FIX_PROMPT.format(critique=critique, context=context, draft=draft), max_tokens=1024, temp=0.1)
    else:
        print("  [5/5] Analysis verified. No hallucinations detected.")

    sources = []
    for d in unique_docs:
        m = d.metadata
        if m.get("type") == "article":
            sources.append({"article": m["article"], "title": m.get("title", "")})
        elif m.get("type") == "judgment":
            sources.append({"case": m.get("title", ""), "year": m.get("year", "")})

    return {"answer": draft, "sources": sources, "verified": verified}