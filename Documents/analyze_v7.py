import json

with open(r'C:\HolisticFrameworkProject\Documents\result_v7_governance.json', 'r', encoding='utf-8-sig') as f:
    text = f.read().strip()
lines = [l for l in text.split('\n') if l.strip() and not l.strip().startswith('---') and l.strip() != 'ResultJson']
data = json.loads('\n'.join(lines).strip())

print("=== Top-level section counts ===")
print("process.steps:", len(data.get('process', {}).get('steps', [])))
print("ontology.objects:", len(data.get('ontology', {}).get('objects', [])))
print("roles:", len(data.get('roles', [])))
print("business_rules:", len(data.get('business_rules', [])))
print("handoffs:", len(data.get('handoffs', [])))
print("exceptions:", len(data.get('exceptions', [])))

ai = data.get('assessment_instrument', {})
print("assessment dimensions:", len(ai.get('dimensions', [])))
for dim in ai.get('dimensions', []):
    print(f"  - {dim['dimension']} ({len(dim['questions'])} questions)")

ge = data.get('gap_engine', {})
print("gap_engine.gaps:", len(ge.get('gaps', [])) if isinstance(ge, dict) else ge)
print("pre_gaps_recognized:", len(data.get('pre_gaps_recognized', [])))
print("workshops:", len(data.get('workshops', [])))

print()
print("=== meta.systems_involved ===")
print(data['meta'].get('systems_involved'))

print()
print("=== data_governance.ownership_matrix ===")
missing = []
for o in data['data_governance']['ownership_matrix']:
    owner = o.get('data_owner_business')
    steward = o.get('data_steward_operational')
    print(f"- {o.get('object_id')}: owner={owner!r}, steward={steward!r}")
    if not owner or not steward:
        missing.append(o.get('object_id'))

print()
print(f"Objects missing owner/steward: {missing} (count={len(missing)})")

print()
print("=== Data Governance dimension questions ===")
for dim in ai.get('dimensions', []):
    if dim['dimension'] == 'Data Governance':
        for q in dim['questions']:
            print(f"  - [{q.get('type')}] {q.get('question')}")
