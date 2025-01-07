from fastapi import FastAPI
from pydantic import BaseModel
from analyze import extract_prescription
from pre_orcamento import preOrcamentoClass
from orcamento import orcamentoClass
from fastapi.middleware.cors import CORSMiddleware

import json, os, re, platform

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
    nome_formula: str


@app.get("/")
def root():
    return "API is running"


@app.post("/extract_prescription")
def extract_prescription_route(file: File):
    print("Received prescription file", file.filename)

    # Extrair o JSON da receita
    result = extract_prescription(file.filename)
    print("Extracted prescription", result)
    if result:
        # Formatar orçamento para o front-end
        orcamentos = []
        for medicamento in result['medicamentos']:
            forma_farmaceutica = None
            sub_forma_farmaceutica = None
            ativos = []
            try:
            # if True:
                if forma_farmaceutica is None:
                    forma_farmaceutica = medicamento['excipiente']
                if sub_forma_farmaceutica is None:
                    sub_forma_farmaceutica = medicamento['sub_excipiente']
                qtd = medicamento['quantidade']
                for ingrediente in medicamento['ingredientes']:
                    matches = re.search(r'([\d,\.]+)', ingrediente['dosagem'])
                    ativo = {
                        'nome': ingrediente['nome'],
                        'unidade': ingrediente['unidade'].upper(),
                        'quantidade': matches.group(1) if matches != None else ingrediente['dosagem'],
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
                orcamento_result['nomeFormula'] = medicamento['nome']
                orcamentos.append(orcamento_result)
            except:
                print("Error parsing orcamento from prescription extracted")
                return {"status": "error", "result": "Error when identifying the prescription"}
        system = platform.system()
        if system == 'Windows':
            bar = "\\"
        else:
            bar = "/"
        filename = file.filename.split(bar)[-1].split(".")[0]
        rootpath = bar.join(file.filename.split(bar)[:-2])
        print("Saving prescription to ", f"{rootpath}/processed/{filename}.json")
        with open(f"{rootpath}/processed/{filename}.json", "w") as f:
            json.dump(orcamentos, f, indent=4)
        # Enviar orçamento para o front-end
        return {"status": "success", "result": orcamentos}
    return {"status": "error", "result": "No prescription found"}


@app.post("/adjust_orcamento")
def extract_prescription_route(orcamentos: list[Orcamento]):
    results = []
    for orcamento in orcamentos:
        try:
        # if True:
            orcamento_result = preOrcamentoClass(
                orcamento.ativos,
                orcamento.dosagem,
                forma_farmaceutica=orcamento.forma_farmaceutica,
                sub_forma_farmaceutica=orcamento.sub_forma_farmaceutica,
                nome_medico=orcamento.nome_medico,
                nome_cliente=orcamento.nome_cliente,
            )
            # Create pre_orcamento
            result = orcamento_result.create_pre_orcamento()
            for i in range(len(result['ativos'])):
                if 'original' in orcamento.ativos[i] and orcamento.ativos[i]['original'] != '':
                    ativo = orcamento.ativos[i]['nome']
                    result['ativos'][i]['opcoes'].insert(0, 
                        {
                            'nome': ativo,
                            'preco': 0.0
                        }
                    )
                    result['ativos'][i]['pre_processed'] = True
                else:
                    result['ativos'][i]['pre_processed'] = False
                result['ativos'][i]['opcoes'] = list({v['nome']:v for v in result['ativos'][i]['opcoes']}.values())
            result['nomeFormula'] = orcamento.nome_formula
            result['embalagem'] = {
                'nome': orcamento.embalagem['nome'],
                'unidade': '-',
                'quantidade': orcamento.embalagem['quantidade'],
                'preco': 0.0,
            }
            result['excipiente']['nome'] = orcamento.excipiente['nome']
            result['capsula']['tipo'] = orcamento.capsula['tipo']
            results.append(result)
        except:
            print("Error parsing orcamento from orcamento adjusted")
            return {"status": "error", "result": "Error when adjusting the prescription"}

    # Enviar orçamento para o front-end
    return {"status": "success", "result": results}


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
        'nome_formula': orcamento.nome_formula,
    }


@app.post("/update_orcamento")
def update_orcamento_route(orcamentos: list[Orcamento]):
    results = []
    for orcamento in orcamentos:
        body = parse_orcamento(orcamento)
        result = orcamentoClass(body).create_orcamento()
        results.append(result)
    return {"status": "success", "result": results}
