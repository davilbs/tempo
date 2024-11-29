from fastapi import FastAPI
from pydantic import BaseModel
from analyze import extract_prescription
from pre_orcamento import preOrcamentoClass
import json
import os
if not os.path.exists("processed"):
    os.makedirs("processed")

app = FastAPI()

class File(BaseModel):
    filename: str

@app.get("/")
def root():
    return "API is running"

@app.post("/extract_prescription")
def extract_prescription_route(file: File):
    print("Received prescription file", file.filename)

    # Extrair o JSON da receita
    result = extract_prescription(file.filename)

    if result:
        # Formatar orçamento para o front-end
        ativos = []
        forma_farmaceutica = None
        sub_forma_farmaceutica = None
        for medicamento in result['medicamentos']:
            if forma_farmaceutica is None:
                forma_farmaceutica = medicamento['excipiente']
            if sub_forma_farmaceutica is None:
                sub_forma_farmaceutica = medicamento['sub_excipiente']
            qtd = medicamento['quantidade']
            for ingrediente in medicamento['ingredientes']:
                ativo = {
                    'nome': ingrediente['nome'],
                    'unidade': ingrediente['unidade'],
                    'quantidade': int(ingrediente['dosagem'].replace('.', '')),
                }
                ativos.append(ativo)

        orcamento = preOrcamentoClass(
            ativos,
            qtd,
            forma_farmaceutica=forma_farmaceutica,
            sub_forma_farmaceutica='',
            nome_medico=result['medico'],
            nome_cliente=result['paciente'],
        )
        # Create pre_orcamento
        orcamento_result = orcamento.create_pre_orcamento()

        filename = file.filename.split("/")[-1].split(".")[0]
        rootpath = "/".join(file.filename.split("/")[:-2])
        print("Saving prescription to ", f"{rootpath}/processed/{filename}.json")
        with open(f"{rootpath}/processed/{filename}.json", "w") as f:
            json.dump(orcamento_result, f, indent=4)
            print(orcamento_result)
        # Enviar orçamento para o front-end
        return {"status": "success", "result": orcamento_result}
    return {"status": "error", "result": "No prescription found"}