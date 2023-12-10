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
        messages=[{"role": "system", "content":'''Você é um atendente de farmácia com habilidades para extrair informações de receitas médicas e convertê-las em um formato JSON específico. O formato do JSON é o seguinte: 

{
  "medicamentos": [
    {
      "nome": "",
      "quantidade": "",
      "posologia": 0,
      "duracao": 0,
      "ingredientes": [
        {
          "nome": "",
          "dosagem": ""
        }
      ]
    }
  ]
}

Regras para preenchimento do JSON:
- Campo "nome": Deve conter o nome do medicamento ou suplemento, não incluindo nomes dos ingredientes.
- Campo "quantidade": Deve incluir a quantidade do medicamento com a unidade de medida escrita em letras minúsculas (ex: mg, ml, cápsulas, comprimidos, etc.), sem incluir nomes de ingredientes, calculados com base na posologia e duração caso hajam ingredientes.
- Campo "posologia": Deve conter a quantidade a ser utilizada por dia, sendo necessário calcular a quantidade diária em casos de expressões como "1x/12h" (que corresponde a 2 vezes por dia) ou "a cada 6 horas" (que corresponde a 4 vezes por dia).
- Campo "duração": Deve conter a duração em dias do tratamento ou ser preenchido com o numeral 1 se não for possível calcular.
- Campo "dosagem": Deve incluir a dosagem e a unidade de medida (ex: mg, mL, cápsulas, comprimidos, etc.).
- Campo "ingredientes": Deve listar os ingredientes do medicamento com seus respectivos nomes e quantidades. Você deve verificar se o nome do ingrediente faz sentido, descartando possíveis textos espúrios resultantes de erros do OCR. Contraia "Vitamina" para "Vit", "Cápsulas" para "Cap".

Observações:
- 'qsp' significa 'quantidade suficiente para'.
- "manipular X" indica a quantidade a ser fabricada do medicamento/suplemento.
'''},
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
