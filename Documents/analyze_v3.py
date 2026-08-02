import json

with open(r'C:\HolisticFrameworkProject\Documents\result_v3.json', 'r', encoding='utf-8-sig') as f:
    lines = f.readlines()
text = ''.join(lines).strip()
parts = text.split('\n')
json_lines = [l for l in parts if l.strip() and not l.strip().startswith('---') and l.strip() != 'ResultJson']
json_text = '\n'.join(json_lines).strip()
data = json.loads(json_text)


def safe_len(x):
    return len(x) if x else 0


process = data.get('process', {})
steps = process.get('steps', [])
print('=== PROCESS ===')
print('systems_involved:', process.get('systems_involved'))
print('num steps:', safe_len(steps))
role_refs = set()
data_objects = set()
for s in steps:
    r = s.get('role_responsible')
    if r:
        role_refs.add(r)
    do = s.get('data_object') or s.get('data_objects')
    if isinstance(do, list):
        data_objects.update(do)
    elif do:
        data_objects.add(do)
print('distinct role_responsible refs in steps:', role_refs)
print('distinct data_object refs in steps:', data_objects)

print()
print('=== ROLES ===', safe_len(data.get('roles')))
role_names = set()
for r in data.get('roles', []):
    role_names.add(r.get('role') or r.get('name') or r.get('role_name'))
print('role names defined:', role_names)
print('orphan role refs (used in steps, not defined):', role_refs - role_names)

print()
print('=== HANDOFFS ===', safe_len(data.get('handoffs')))
for h in data.get('handoffs', []):
    print(' -', h)

print()
ontology = data.get('ontology', {})
onto_list = ontology.get('objects', []) if isinstance(ontology, dict) else ontology
print('=== ONTOLOGY OBJECTS ===', safe_len(onto_list))
onto_names = set()
for o in onto_list:
    onto_names.add(o.get('name'))
print('ontology object names:', onto_names)
print('ontology principles:', safe_len(ontology.get('principles')) if isinstance(ontology, dict) else 'n/a')

print()
print('=== BUSINESS RULES ===', safe_len(data.get('business_rules')))
rule_ids = set()
for br in data.get('business_rules', []):
    rule_ids.add(br.get('id'))
print('rule ids defined:', rule_ids)

print()
print('=== EXCEPTIONS ===', safe_len(data.get('exceptions')))
for e in data.get('exceptions', []):
    print(' -', e)

print()
print('=== DATA GOVERNANCE ===', data.get('data_governance'))
print()
print('=== AI GOVERNANCE ===', data.get('ai_governance'))
print()
print('=== AGENT DESIGN ===', data.get('agent_design'))
print()
print('=== INTEGRATION ===', data.get('integration'))
print()
ai = data.get('assessment_instrument', {})
dims = ai.get('dimensions', [])
print('=== ASSESSMENT DIMENSIONS ===', safe_len(dims))
for d in dims:
    print(' -', d.get('dimension') or d.get('name'), '| questions:', safe_len(d.get('questions')))
print()
ge = data.get('gap_engine', {})
print('=== GAP ENGINE gaps count ===', safe_len(ge.get('gaps')))
for g in ge.get('gaps', []):
    print(' -', g)
print()
print('=== SCORING ===', data.get('scoring'))
print()
print('=== PRE_GAPS_RECOGNIZED ===', data.get('pre_gaps_recognized'))
print()
print('=== WORKSHOPS ===', data.get('workshops'))
