import json

with open(r'C:\HolisticFrameworkProject\Documents\result_v5_governance.json', 'r', encoding='utf-8-sig') as f:
    text = f.read().strip()
lines = [l for l in text.split('\n') if l.strip() and not l.strip().startswith('---') and l.strip() != 'ResultJson']
data = json.loads('\n'.join(lines).strip())

print("=== meta.systems_involved ===")
print(data['meta'].get('systems_involved'))

print()
print("=== data_governance.ownership_matrix ===")
for o in data['data_governance']['ownership_matrix']:
    print(f"- {o.get('object_id')}: owner={o.get('data_owner_business')!r}, steward={o.get('data_steward_operational')!r}")

print()
print("=== assessment_instrument dimensions (Data Governance) ===")
for dim in data['assessment_instrument']['dimensions']:
    if 'governance' in dim['dimension'].lower() and 'data' in dim['dimension'].lower():
        print(f"Dimension: {dim['dimension']}")
        for q in dim['questions']:
            print(f"  - {q}")

print()
print("=== ALL assessment dimension names (sanity check) ===")
for dim in data['assessment_instrument']['dimensions']:
    print(f"- {dim['dimension']} ({len(dim['questions'])} questions)")
