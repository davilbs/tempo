import sqlite3
import os
import json
import sys
import re

# UFC   -> Unidades Formadoras de Colonia
# UI    -> Unidades Internacionais
# conversao de UI para gramas e arbitrario, cada medicamento tem sua conversao
# VO    -> Via Oral
# CP    -> Capsula

def lookup(cur, medicamento, response_json, total_cost, total_qtd):
    nome = medicamento["nome"].upper()
    cur.execute("SELECT dosage, value FROM medicines WHERE name=?", (nome,))
    rows = cur.fetchall()
    posology = re.search(r'\d+', str(medicamento["posologia"]))[0]
    duration = re.search(r'\d+', str(medicamento["duracao"]))[0]
    quantidade = int(posology) * int(duration)
    if len(rows) > 0:
        row = rows[0]
        # quantidade_real = float(re.split(r'\D+', medicamento["dosagem"])[0]) / float(row[0].split(' ')[0])
        total_cost += (row[1] * quantidade)
        total_qtd += quantidade
        valor = row[1] * quantidade
    else:
        valor = "Indisponível"
        quantidade = "-"
    response_json["items"].append({"nome": nome, "quantidade": quantidade, "valor": valor})
    return total_cost, total_qtd

def main():
    rootpath = os.path.dirname(os.getcwd())
    document = rootpath + "/backend/processed/" + sys.argv[1]

    con = sqlite3.connect(rootpath + "/backend/scripts/pharmacy.db")
    cur = con.cursor()

    total_cost = 0
    total_qtd = 0
    response_json = {"items": []}
    with open(document, "r") as answer:
        parsed_answer = json.loads(answer.read())
        for medicamento in parsed_answer["medicamentos"]:
            if ("ingredientes" in medicamento.keys()) and (len(medicamento["ingredientes"]) > 1):
                for ingrediente in medicamento["ingredientes"]:
                    if len(ingrediente["quantidade"]) >= 1:
                        ingrediente["posologia"] = ingrediente["quantidade"]
                    else:
                        ingrediente["posologia"] = medicamento["posologia"]
                    ingrediente["duracao"] = medicamento["duracao"]
                    ingrediente["dosagem"] = medicamento["dosagem"]
                    total_cost, total_qtd = lookup(cur, ingrediente, response_json, total_cost, total_qtd)
            else:
                total_cost, total_qtd = lookup(cur, medicamento, response_json, total_cost, total_qtd)
        response_json["items"].append({"nome": "TOTAL", "quantidade": total_qtd, "valor": total_cost})
        answer.close()
    return response_json


if __name__ == "__main__":
    response_json = main()
    print(json.dumps(response_json))
    sys.stdout.flush()