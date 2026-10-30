import json
from pathlib import Path
from reasoning.engine import answer

TEST_CASES = [
    "A state government bans a peaceful protest against a new farm law. Which fundamental rights are affected?",
    "A private company collects biometric data of employees without consent. What constitutional protections apply?",
    "A state university reserves 70% of seats for a single caste group. Is this constitutional?",
]

def main():
    results = []
    for i, situation in enumerate(TEST_CASES, 1):
        print(f"\n{'='*70}")
        print(f"TEST {i}: {situation}")
        print(f"{'='*70}")
        r = answer(situation)
        print(f"\nANSWER:\n{r['answer']}")
        print(f"\nSOURCES: {r['sources']}")
        results.append({"situation": situation, "result": r})

    with open("reasoning/baseline_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Saved to reasoning/baseline_results.json")

if __name__ == "__main__":
    main()