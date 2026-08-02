import json

with open(r"C:\HolisticFrameworkProject\Documents\result_v8_trimmed.json", "r", encoding="utf-8-sig") as f:
    raw = f.read()

# sqlcmd sometimes adds trailing whitespace/newlines; strip
raw = raw.strip()
data = json.loads(raw)

def count(x):
    if isinstance(x, list):
        return len(x)
    return 0

print("=== META ===")
meta = data.get("meta", {})
print("systems_involved:", meta.get("systems_involved"))
print("process name:", meta.get("process_name") or meta.get("name"))

print()
print("=== STRUCTURAL COUNTS ===")
ontology = data.get("ontology", {})
print("ontology.objects:", count(ontology.get("objects")))
print("roles:", count(data.get("roles")))
print("business_rules:", count(data.get("business_rules")))
print("handoffs:", count(data.get("handoffs")))
print("exceptions:", count(data.get("exceptions")))

print()
print("=== ASSESSMENT INSTRUMENT ===")
ai = data.get("assessment_instrument", {})
dims = ai.get("dimensions", []) if isinstance(ai, dict) else []
print("num dimensions:", len(dims))
for d in dims:
    name = d.get("dimension") or d.get("name")
    qs = d.get("questions", [])
    print(f"  - {name}: {len(qs)} questions")

print()
print("=== DATA GOVERNANCE DIMENSION DETAIL ===")
for d in dims:
    name = (d.get("dimension") or d.get("name") or "").lower()
    if "gov" in name or "governance" in name:
        for q in d.get("questions", []):
            print(" Q:", q.get("question") or q.get("text"))
            print("   answer:", q.get("answer"))
            print("   gap:", q.get("is_gap") or q.get("gap"))

print()
print("=== DATA GOVERNANCE (raw section) ===")
dg = data.get("data_governance")
if dg:
    om = dg.get("ownership_matrix", [])
    print("ownership_matrix entries:", len(om))
    for e in om:
        print("  ", e)

print()
print("=== GAP ENGINE ===")
ge = data.get("gap_engine", {})
gaps = ge.get("gaps", []) if isinstance(ge, dict) else []
print("gaps:", len(gaps))

print()
print("=== PRE GAPS RECOGNIZED ===")
pgr = data.get("pre_gaps_recognized", [])
print("count:", count(pgr))

print()
print("=== WORKSHOPS ===")
ws = data.get("workshops", [])
print("count:", count(ws))
