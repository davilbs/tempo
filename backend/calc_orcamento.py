from orcamento import orcamentoClass
from ativo.main import ativoClass, ativoOrcamentoClass

if __name__ == '__main__':
    ativos = [
        ativoClass('FENUGREEK (50% FENUSIDEOS)', ativoOrcamentoClass(200, 'MG')),
        ativoClass('MACA', ativoOrcamentoClass(500, 'MG')),
        ativoClass('GINKGO BILOBA (25% GLICOSÍDEOS)', ativoOrcamentoClass(100, 'MG')),
        ativoClass(
            'TRIBULLUS TERRESTRIS (40% SAPONINAS)', ativoOrcamentoClass(500, 'MG',)
        ),
        ativoClass('GALACTOSIDASE ALFA', ativoOrcamentoClass(500, 'UI')),
    ]
    orcamento = orcamentoClass(
        ativos,
        60,
        forma_farmaceutica='1 - Cápsulas',
        sub_forma_farmaceutica='1 - Slow Release',
    )
    orcamento.create_orcamento()
