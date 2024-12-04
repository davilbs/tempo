from pre_orcamento import preOrcamentoClass
from orcamento import orcamentoClass


if __name__ == '__main__':
    ativos = [
        {
            'nome': 'Vitamina A (50% Retinol + 50% Betacaroteno)',
            'unidade': 'UI',
            'quantidade': 5000,
        },
        {
            'nome': 'VIT D3',
            'unidade': 'UI',
            'quantidade': 5000,
        },
        {
            'nome': 'Alfatocoferol (mix)',
            'unidade': 'UI',
            'quantidade': 200,
        },
        {
            'nome': 'Vitamina K2 (Mk7)',
            'unidade': 'UI',
            'quantidade': 200,
        },
    ]
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
                'nome': 'VIT A (RETINOL)',
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
        'embalagem': {'nome': 'POTE CAPS 310ML', 'quantidade': 1},
        'excipiente': {
            'nome': 'EXCIPIENTE PADRÃO CÁPSULAS',
            'unidade': 'MG',
            'quantidade': '-',
        },
        'capsula': {'tipo': 'INCOLOR', 'unidade': 'UN', 'quantidade': 30},
    }
    orcamento = orcamentoClass(
        orcamento_body,
    )
    print(orcamento.create_orcamento())
