from pre_orcamento import preOrcamentoClass
from orcamento import orcamentoClass
import re

if __name__ == '__main__':
    ativos = [
        {'nome': 'ÔMEGA 3 - TG (com selo IFOS)', 'dosagem': 'qsp', 'unidade': 'g'},
    ]
    ativos_processed = []
    for ingrediente in ativos:
        matches = re.search(r'(\d+)', ingrediente['dosagem'].replace(',', '.'))
        if matches == None:
            a = 1
        ativo = {
            'nome': ingrediente['nome'],
            'unidade': ingrediente['unidade'].upper(),
            'quantidade': matches.group(1) if matches != None else ingrediente['dosagem'],
        }
        ativos_processed.append(ativo)
    orcamento = preOrcamentoClass(
        ativos,
        30,
        forma_farmaceutica='1 - Cápsulas',
        sub_forma_farmaceutica='',
        nome_medico='',
        nome_cliente='Marcos Andrei Schwinden',
    )
    print(orcamento.create_pre_orcamento())
    orcamento_body = {
        'nome_cliente': 'Maria',
        'nome_medico': 'João',
        'dosagem': 30,
        'forma_farmaceutica': '1 - Cápsula',
        'sub_forma_farmaceutica': 'Slow Release',
        'ativos': [
            {
                'nome': 'ALGINATO',
                'unidade': 'UI',
                'quantidade': 5000,
            },
            {
                'nome': 'VIT D3 5000UI-CAPS',
                'unidade': 'UN',
                'quantidade': 1,
            },
            {
                'nome': 'ALFA TOCOFEROL',
                'unidade': 'UI',
                'quantidade': 200,
            },
            {
                'nome': 'MK7 VIT K2',
                'unidade': 'MCG',
                'quantidade': 200,
            },
        ],
        'nome_formula': 'TESTE',
        'embalagem': {'nome': 'POTE CAPS 310ML', 'quantidade': 1},
        'excipiente': {
            'nome': 'EXCIPIENTE PADRÃO CÁPSULAS',
            'unidade': 'MG',
            'quantidade': '-',
        },
        'capsula': {'tipo': 'INCOLOR', 'unidade': 'UN', 'quantidade': 30},
    }
    # orcamento = orcamentoClass(
    #     orcamento_body,
    # )
    # print(orcamento.create_orcamento())
