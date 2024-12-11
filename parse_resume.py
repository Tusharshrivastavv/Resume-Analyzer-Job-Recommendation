import sys
import warnings
import json
from pyresparser import ResumeParser

warnings.filterwarnings("ignore")

if len(sys.argv) < 2:
    print("Usage: python parse_resume.py <resume_path>")
    sys.exit(1)

resume_path = sys.argv[1]
data = ResumeParser(resume_path).get_extracted_data()

keywords_with_weights = {
    'Python': 5,
    'Java': 8,
    'JavaScript': 7,
    'C++': 6,
    'SQL': 5,
    'CSS': 5,
    'HTML': 5,
    'Networking': 4,
    'Engineering': 3
}

extracted_skills = []
if 'skills' in data and data['skills']:
    for skill in data['skills']:
        extracted_skills.append(skill.strip().lower())

ats_score = 0
matched_skills = []
missing_skills = []
penalty = 0

for skill in keywords_with_weights:
    skill_lower = skill.lower()
    found = False
    for extracted_skill in extracted_skills:
        if skill_lower == extracted_skill:
            ats_score += keywords_with_weights[skill]
            matched_skills.append(skill)
            found = True
            break
    if not found:
        missing_skills.append(skill)
        if keywords_with_weights[skill] >= 6:
            penalty += 5

ats_score = max(0, ats_score - penalty)

max_possible_score = 0
for weight in keywords_with_weights.values():
    max_possible_score += weight

if max_possible_score > 0:
    scaled_score = (ats_score / max_possible_score) * 140
else:
    scaled_score = 0

result = {
    'ats_score': scaled_score,
    'matched_skills': matched_skills,
    'missing_skills': missing_skills,
    'extracted_skills': extracted_skills
}

print(json.dumps(result))
