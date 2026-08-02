import json

with open(r'C:\HolisticFrameworkProject\Documents\result_v5_governance.json', 'r', encoding='utf-8-sig') as f:
    text = f.read().strip()
lines = [l for l in text.split('\n') if l.strip() and not l.strip().startswith('---') and l.strip() != 'ResultJson']
data = json.loads('\n'.join(lines).strip())

print("=== Top-level keys ===")
print(list(data.keys()))

print()
print("=== process.steps count ===", len(data.get('process', {}).get('steps', [])))
print("=== ontology.objects count ===", len(data.get('ontology', {}).get('objects', [])))
print("=== roles count ===", len(data.get('roles', [])))
print("=== business_rules count ===", len(data.get('business_rules', [])))
print("=== handoffs count ===", len(data.get('handoffs', [])))
print("=== exceptions count ===", len(data.get('exceptions', [])))

print()
print("=== assessment_instrument keys ===")
ai = data.get('assessment_instrument', {})
print(list(ai.keys()))
print("dimensions count:", len(ai.get('dimensions', [])))

print()
print("=== gap_engine ===")
ge = data.get('gap_engine', {})
print(list(ge.keys()) if isinstance(ge, dict) else ge)
if isinstance(ge, dict):
    for k, v in ge.items():
        print(f"  {k}: {len(v) if isinstance(v, list) else v}")

print()
print("=== pre_gaps_recognized count ===", len(data.get('pre_gaps_recognized', [])))
print("=== workshops count ===", len(data.get('workshops', [])))
