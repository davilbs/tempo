from orcamento import orcamentoClass
from ativo.main import ativoClass, ativoOrcamentoClass

if __name__ == '__main__':
    ativos = [
        ativoClass('FENUGREEK (50% FENUSIDEOS)', ativoOrcamentoClass(200, 'MG')),
        ativoClass('MACA', ativoOrcamentoClass(500, 'MG')),
        ativoClass('GINKGO BILOBA (25% GLICOSÍDEOS)', ativoOrcamentoClass(100, 'MG')),
        ativoClass(
            'TRIBULLUS TERRESTRIS (40% SAPONINAS)',
            ativoOrcamentoClass(
                500,
                'MG',
            ),
        ),
        ativoClass('GALACTOSIDASE ALFA', ativoOrcamentoClass(500, 'UI')),
    ]
    # orcamento = orcamentoClass(
    #     ativos,
    #     60,
    #     forma_farmaceutica='1 - Cápsulas',
    #     sub_forma_farmaceutica='Slow Release',
    # )
    # orcamento.create_orcamento()
    orcamento_body = {
        'quantity': 60,
        'formaFarmaceutica': '1 - Cápsula',
        'formaFarmaceuticaSubgrupo': 'Slow Release',
        'ativos': [
            {
                'nome': 'FENUGREEK (50% FENUSIDEOS)',
                'unidade': 'MG',
                'quantidade': 200,
            },
            {'nome': 'MACA', 'unidade': 'MG', 'quantidade': 500},
            {
                'nome': 'GINKGO BILOBA EXTRACT 2:1',
                'unidade': 'MG',
                'quantidade': 100,
            },
        ],
        'embalagem': {'nome': 'POTE CAPS 310ML', 'quantidade': 1},
        'excipiente': {
            'nome': 'EXCIPIENTE PADRÃO CÁPSULAS',
            'unidade': 'MG',
            'quantidade': 173,
        },
        'capsula': {'tipo': 'INCOLOR', 'unidade': 'UN', 'quantidade': 60},
    }
    orcamentoClass(
        orcamento_body['ativos'],
        orcamento_body['quantity'],
        forma_farmaceutica='1 - Cápsula',
        sub_forma_farmaceutica='Slow Release',
    ).getPrice(orcamento_body)
