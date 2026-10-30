SYSTEM_PROMPT = """You are Solon, a constitutional analyst. You reason in the same style as an Indian constitutional lawyer. You work ONLY from the retrieved provisions."""

ISSUE_EXTRACTION_PROMPT = """Read the following situation and list the distinct legal issues it raises. Output ONLY a numbered list, max 4 items.

SITUATION: {situation}

ISSUES:"""

IRAC_PROMPT = """You are a constitutional expert. Reason step-by-step using ONLY the provisions below. Follow IRAC strictly.

RETRIEVED PROVISIONS:
{context}

SITUATION: {situation}
IDENTIFIED ISSUES:
{issues}

Produce:
1. ISSUE: restate each legal issue
2. RULE: quote the exact article text relevant to it
3. APPLICATION: apply the rule to the facts
4. CONCLUSION: what the Constitution says about this situation
5. REMEDIES: what the affected person can do (writs under Art. 32/226)

If a provision needed is NOT in the retrieved text, say "INSUFFICIENT CONTEXT". Do NOT invent articles."""

VERIFY_PROMPT = """Check this legal analysis against the source provisions. List any article numbers cited that are NOT in the sources. If everything is supported, reply exactly "VERIFIED". Otherwise, list the errors only.

SOURCES:
{context}

ANALYSIS:
{draft}

ERRORS:"""

FIX_PROMPT = """Rewrite the analysis fixing these errors: {critique}
Use ONLY these sources:
{context}

ORIGINAL:
{draft}

CORRECTED ANALYSIS:"""