import sys
import os
import json
from openai import OpenAI


def main():
    rootpath = os.path.dirname(os.getcwd())
    document = rootpath + "/backend/scans/" + sys.argv[1]

    input_text = ""
    with open(document, "r") as prescript:
        input_text = prescript.read()

    client = OpenAI(
        api_key="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")
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": 'Extraia nomes de medicamentos existentes, componentes para suplementos/medicamentos personalizados e detalhes de posologia (dosagem apenas em números, frequência por dia, duração em dias) de prescrições médicas não estruturadas em formato de texto português obtidas por OCR. Observe que \'qsp\' significa \'quantidade suficiente para\', manipular X significa que X é a quantidade a ser fabricada do medicamento/suplemento. Forneça uma lista de todos os medicamentos e suplementos identificados, juntamente com sua respectiva posologia e a duração do tratamento. A saída deve ser somente um JSON, com o formato {medicamentos: [{nome, dosagem, posologia, duracao, ingredientes: [{nome, quantidade}]\}]}, a dosagem deve conter apenas o quantidade e a unidade de medida, o campo de posologia deve conter somente o número correspondente ao total que será usado do medicamento durante o tratamento por dia, a duracao deve conter a duração do tratamento em dias. o campo de ingredientes deve conter os componentes do suplemento ou medicação personalizada e sua quantidade, e mais nada além, valores não encontrados devem ser definidos como 1, não justifique suas escolhas nem escreva algo além do JSON requisitado.'},
                  {"role": "user", "content": f"{input_text}"}]
    )

    filename = sys.argv[1].split(".")[0]
    with open(rootpath + f"/backend/processed/{filename}.json", "w+") as jdump:
        cont_json = json.loads(completion.choices[0].message.content)
        json.dump(cont_json, jdump)
        jdump.close()
    return filename


if __name__ == "__main__":
    filename = main()
    print(f"{filename}.json", end='')
    sys.stdout.flush()
