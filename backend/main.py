from fastapi import FastAPI
from pydantic import BaseModel
from analyze import extract_prescription
from orcamento import orcamentoClass

app = FastAPI()

class File(BaseModel):
    filename: str

@app.get("/")
def root():
    return "API is running"

@app.post("/extract_prescription")
def extract_prescription_route(file: File):
    result = extract_prescription(file.filename)
    if result:
        return {"status": "success", "result": result}
    return {"status": "error", "result": "No prescription found"}