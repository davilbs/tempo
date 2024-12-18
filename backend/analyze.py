import sys
import os
import json 
from pydantic import BaseModel, Field
from typing import Optional, Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from pdfminer.high_level import extract_text

import dotenv
dotenv.load_dotenv()


class Ingredient(BaseModel):
    nome: str = Field(...,description="Nome do ingrediente")
    dosagem: str = Field(...,description="Quantidade do ingrediente. Se for QSP escreva QSP.")
    unidade: str = Field(...,description="Unidade de medida do ingrediente")

class Product(BaseModel):
    nome: str = Field(...,description="Nome do medicamento, suplemento ou fórmula")
    quantidade: Optional[int] = Field(...,description="Quantidade do medicamento/fórmula. Doses")
    excipiente: Optional[Literal['1 - Cápsula',    '2 - Cremes',    '3 - Loções',    '4 - Shampoo',    '5 - Outros',    '6 - Envase / Produtos Heel / Fisioquantic / Oli Vera Cha Verde / Repelente / Teloactive / Comprimido']] = Field(...,description="Excipiente do medicamento.")
    sub_excipiente: Optional[Literal['Slow Release', 'Sublingual', 'Combo', 'Lipofílica/Oleosa', 'Complexo B','Envase', 'Produtos Heel', 'Fisioquantic', 'Repelente']] = Field(...,description="Subespecificação do excipiente do medicamento, se houver.")
    posologia: Optional[int] = Field(...,description="Quantidade a ser utilizada por dia")
    ingredientes: Optional[list[Ingredient]] = Field(...,description="Lista de ingredientes do medicamento com seus respectivos nomes, quantidades e unidade de medida.")

class PrescriptionInfo(BaseModel):
    medico: Optional[str] = Field(...,description="Nome do médico que prescreveu a fórmula")
    paciente: Optional[str] = Field(...,description="Nome do paciente que irá utilizar a fórmula")
    data: Optional[str] = Field(...,description="Data da prescrição")
    medicamentos: list[Product] = Field(...,description="Lista de medicamentos ou suplementos prescritos")

def extract_prescription(input_file):
    llm_structured = ChatOpenAI(model="gpt-4o-mini", temperature=0).with_structured_output(PrescriptionInfo)
    rootpath = os.path.dirname(os.getcwd())

    system_prompt = """
    Você é um atendente de farmácia com habilidades para extrair informações de receitas médicas e convertê-las em um formato JSON específico.
    Caso o nome do medicamento/suplemento não esteja antecedido por 'Fórmula', considere que é um produto da Essential Nutrition e não o considere na
    lista de produtos prescritos.
    Remova os marcadores de milhar ('.')
    Analise o texto abaixo da receita e extraia as fórmulas descritas.\n\n 
    """
    prompt = ChatPromptTemplate([
        ("system", system_prompt),
        ("human", "{input}")
    ])

    chain = prompt | llm_structured

    print("Extracting prescription from ", input_file)
    text = extract_text(input_file)

    if len(text) == 0:
        print("Empty text extracted from file")
        return None
    
    print("Analyzing text (LLM)...")
    response = chain.invoke({"input": text})
    
    return response.dict()


if __name__ == "__main__":
    filename = extract_prescription("receitas/1.pdf")
