from fastapi import FastAPI
from pydantic import BaseModel
from analyze import extract_prescription
from pre_orcamento import preOrcamentoClass

app = FastAPI()

class File(BaseModel):
    filename: str

@app.get("/")
def root():
    return "API is running"

@app.post("/extract_prescription")
def extract_prescription_route(file: File):
    print("Extracting prescription from ", file.filename)
    # Extrair o JSON da receita
    result = extract_prescription(file.filename)
    if result:
        # Formatar orçamento para o front-end
        for medicamento in result['medicamentos']:
            ativos = []
            forma_farmaceutica = medicamento['excipiente']
            qtd = medicamento['quantidade']
            for ingrediente in medicamento['ingredientes']:
                ativo = {
                    'nome': ingrediente['nome'],
                    'unidade': ingrediente['unidade'],
                    'quantidade': int(ingrediente['dosagem']),
                }
                ativos.append(ativo)

            orcamento = preOrcamentoClass(
                ativos,
                qtd,
                forma_farmaceutica=forma_farmaceutica,
                sub_forma_farmaceutica='',
                nome_medico='João',
                nome_cliente='Maria',
            )
            orcamento_result = orcamento.create_pre_orcamento()
            break

        print(orcamento_result)
        # Enviar orçamento para o front-end
        return {"status": "success", "result": orcamento_result}
    return {"status": "error", "result": "No prescription found"}