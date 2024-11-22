import requests

r = requests.post('http://localhost:8000/extract_prescription', json={'filename': 'receitas/1.pdf'})
print(r.text)