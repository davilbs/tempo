import sys
import os
import json 
from pydantic import BaseModel, Field
from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from openai import OpenAI
from pdfminer.high_level import extract_text

import dotenv
dotenv.load_dotenv()


class Ingredient(BaseModel):
    nome: str = Field(...,description="Nome do ingrediente")
    dosagem: str = Field(...,description="Quantidade do ingrediente. Se for QSP escreva QSP.")
    unidade: str = Field(...,description="Unidade de medida do ingrediente")

class Product(BaseModel):
    nome: str = Field(...,description="Nome do medicamento, suplemento ou fórmula")
    quantidade: str = Field(...,description="Quantidade do medicamento/fórmula. Doses")
    excipiente: Optional[str] = Field(...,description="Excipiente do medicamento")
    posologia: int = Field(...,description="Quantidade a ser utilizada por dia")
    ingredientes: Optional[list[Ingredient]] = Field(...,description="Lista de ingredientes do medicamento com seus respectivos nomes, quantidades e unidade de medida.")

class productList(BaseModel):
    medicamentos: list[Product] = Field(...,description="Lista de medicamentos ou suplementos")

class PrescriptionInfo(BaseModel):
    medico: Optional[str] = Field(...,description="Nome do médico que prescreveu a fórmula")
    paciente: Optional[str] = Field(...,description="Nome do paciente que irá utilizar a fórmula")
    data: Optional[str] = Field(...,description="Data da prescrição")
    medicamentos: productList = Field(...,description="Lista de medicamentos ou suplementos prescritos")

def extract_prescription(input_file):
    llm_structured = ChatOpenAI(model="gpt-4o-mini", temperature=0).with_structured_output(PrescriptionInfo)
    rootpath = os.path.dirname(os.getcwd())
    document = rootpath + input_file

    system_prompt = """
    Você é um atendente de farmácia com habilidades para extrair informações de receitas médicas e convertê-las em um formato JSON específico.
    Analise o texto abaixo da receita e extraia as fórmulas descritas. Caso encontre medicamentos sem ingredientes não preencha o campo de ingredientes.
    Não invente informações, caso não haja informações suficientes retorne uma resposta vazia.\n\n
    """
    prompt = ChatPromptTemplate([
        ("system", system_prompt),
        ("human", "{input}")
    ])

    chain = prompt | llm_structured

    text = extract_text(document)
    response = chain.invoke({"input": text})
    filename = document.split("/")[-1].split(".")[0]
    with open(f"{filename}.json", "w") as f:
        json.dump(response.dict(), f, indent=4)
    
    print(text)
    print(response)
    return response.dict()


if __name__ == "__main__":
    filename = extract_prescription("receitas/1.pdf")
