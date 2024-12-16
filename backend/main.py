from fastapi import FastAPI
from pydantic import BaseModel
from analyze import extract_prescription
from pre_orcamento import preOrcamentoClass
from orcamento import orcamentoClass
from fastapi.middleware.cors import CORSMiddleware

import json, os, utils

if not os.path.exists("processed"):
    os.makedirs("processed")

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class File(BaseModel):
    filename: str

class Orcamento(BaseModel):
    nome_cliente: str
    nome_medico: str
    dosagem: int
    forma_farmaceutica: str
    sub_forma_farmaceutica: str
    ativos: list[dict]
    embalagem: dict
    excipiente: dict
    capsula: dict

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
        orcamentos = []
        for medicamento in result['medicamentos']:
            forma_farmaceutica = None
            sub_forma_farmaceutica = None
            ativos = []
            try:
                if forma_farmaceutica is None:
                    forma_farmaceutica = medicamento['excipiente']
                if sub_forma_farmaceutica is None:
                    sub_forma_farmaceutica = medicamento['sub_excipiente']
                qtd = medicamento['quantidade']
                for ingrediente in medicamento['ingredientes']:
                    ativo = {
                        'nome': ingrediente['nome'],
                        'unidade': ingrediente['unidade'],
                        'quantidade': float(ingrediente['dosagem'].replace(',', '.')),
                    }
                    ativos.append(ativo)

                orcamento = preOrcamentoClass(
                    ativos,
                    qtd,
                    forma_farmaceutica=forma_farmaceutica,
                    sub_forma_farmaceutica=sub_forma_farmaceutica,
                    nome_medico=result['medico'],
                    nome_cliente=result['paciente'],
                )
                # Create pre_orcamento
                orcamento_result = orcamento.create_pre_orcamento()
                orcamentos.append(orcamento_result)
            except:
                return {"status": "error", "result": "Error when identifying the prescription"}
        filename = file.filename.split("/")[-1].split(".")[0]
        rootpath = "/".join(file.filename.split("/")[:-2])
        print("Saving prescription to ", f"{rootpath}/processed/{filename}.json")
        with open(f"{rootpath}/processed/{filename}.json", "w") as f:
            json.dump(orcamentos, f, indent=4)
        # Enviar orçamento para o front-end
        return {"status": "success", "result": orcamentos}
    return {"status": "error", "result": "No prescription found"}

def parse_orcamento(orcamento: Orcamento):
    return {
        'nome_cliente': orcamento.nome_cliente,
        'nome_medico': orcamento.nome_medico,
        'dosagem': orcamento.dosagem,
        'forma_farmaceutica': orcamento.forma_farmaceutica,
        'sub_forma_farmaceutica': orcamento.sub_forma_farmaceutica,
        'ativos': orcamento.ativos,
        'embalagem': orcamento.embalagem,
        'excipiente': orcamento.excipiente,
        'capsula': orcamento.capsula,
    }

@app.post("/update_orcamento")
def update_orcamento_route(orcamentos: list[Orcamento]):
    results = []
    for orcamento in orcamentos:
        body = parse_orcamento(orcamento)
        results.append(orcamentoClass(body).create_orcamento())
    return {"status": "success", "result": results}
