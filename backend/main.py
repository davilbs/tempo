from fastapi import FastAPI
from pydantic import BaseModel
from analyze import extract_prescription
from orcamento import orcamentoClass, ativoClass, ativoOrcamentoClass

app = FastAPI()

class File(BaseModel):
    filename: str

@app.get("/")
def root():
    return "API is running"

@app.post("/extract_prescription")
def extract_prescription_route(file: File):
    print("Extracting prescription from ", file.filename)
    result = extract_prescription(file.filename)
    if result:
        for medicamento in result['medicamentos']:
            ativos = []
            forma_farmaceutica = medicamento['excipiente']
            qtd = medicamento['quantidade']
            for ingrediente in medicamento['ingredientes']:
                ativo = ativoClass(ingrediente['nome'], ativoOrcamentoClass(int(ingrediente['dosagem']), ingrediente['unidade']))
                ativos.append(ativo)
            
            orcamento = orcamentoClass(
                ativos,
                qtd,
                forma_farmaceutica=forma_farmaceutica,
                sub_forma_farmaceutica='',
            )
            # orcamento.create_orcamento()
            break

        print(orcamento)
        return {"status": "success", "result": result}
    return {"status": "error", "result": "No prescription found"}