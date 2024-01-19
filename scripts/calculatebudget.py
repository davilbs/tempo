import sqlite3
import os
import json
import sys
import re
from random import uniform, randint
from unidecode import unidecode

# UFC   -> Unidades Formadoras de Colonia
# UI    -> Unidades Internacionais
# conversao de UI para gramas e arbitrario, cada medicamento tem sua conversao
# VO    -> Via Oral
# CP    -> Capsula

def lookup(cur, medicamento, response_json, total_cost, total_qtd):
    nome = unidecode(medicamento["nome"].upper())
    cur.execute("SELECT dosage, value FROM medicines WHERE name=?", (nome,))
    rows = cur.fetchall()
    posology = re.search(r'\d+', str(medicamento["posologia"]))[0]
    duration = re.search(r'\d+', str(medicamento["duracao"]))[0]
    quantidade = int(posology) * int(duration)
    total_qtd += quantidade
    if len(rows) > 0:
        row = rows[0]
        # quantidade_real = float(re.split(r'\D+', medicamento["dosagem"])[0]) / float(row[0].split(' ')[0])
        valor = round(float((row[1] / row[0]) * quantidade), 2)
    else:
        price = round(uniform(1, 2), 2)
        amount = randint(1, 5)
        # cur.execute(f"INSERT INTO medicines VALUES ('{nome}', {amount}, {price});")
        # cur.execute('COMMIT')
        valor = round((price/amount) * quantidade, 2)
    total_cost += valor
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
                    if len(ingrediente["dosagem"]) >= 1:
                        ingrediente["posologia"] = ingrediente["dosagem"]
                    else:
                        ingrediente["posologia"] = medicamento["posologia"]
                    ingrediente["duracao"] = medicamento["duracao"]
                    total_cost, total_qtd = lookup(cur, ingrediente, response_json, total_cost, total_qtd)
            else:
                total_cost, total_qtd = lookup(cur, medicamento, response_json, total_cost, total_qtd)
        response_json["items"].append({"nome": "TOTAL", "quantidade": total_qtd, "valor": round(total_cost, 2)})
        answer.close()
    return response_json


if __name__ == "__main__":
    response_json = main()
    print(json.dumps(response_json))
    sys.stdout.flush()