import sys
import os
import json
from openai import OpenAI
from dotenv import load_dotenv


def main():
    load_dotenv()
    rootpath = os.path.dirname(os.getcwd())
    document = rootpath + "/backend/scans/" + sys.argv[1]

    input_text = ""
    with open(document, "r") as prescript:
        input_text = prescript.read()

    client = OpenAI(
        api_key=os.getenv("OPENAI_KEY"))
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": 'Você é um atendente de farmácia capaz de extrair informações de receitas médicas e transformá-las em JSON. O formato do JSON é {medicamentos: [{nome, dosagem, posologia, duracao, ingredientes: [{nome, quantidade}]\}]}. O campo nome deve conter o nome do medicamento ou suplemento. O campo dosagem deve conter a dosagem e a unidade de medida. O campo posologia deve conter a quantidade a ser utilizada por dia (somente um número inteiro). O campo duração deve conter a duração em dias do tratamento ou 1 caso não seja possível calcular. O texto contém prescrições médicas não estruturadas em português obtidas por OCR. Observe que \'qsp\' significa \'quantidade suficiente para\', manipular X significa que X é a quantidade a ser fabricada do medicamento/suplemento.'
                   },
                  {"role": "user", "content": f"{input_text}"}],
        temperature=0.1
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
