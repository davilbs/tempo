import pandas as pd, utils, re

from ativo.main import ativoClass
from excipients.main import excipientClass


class preOrcamentoClass:
    ativos: list[ativoClass] = []
    possible_ativos: dict[str : list[ativoClass]] = {}
    nome_cliente = ''
    nome_medico = ''
    forma_farmaceutica = ''
    sub_forma_farmaceutica = ''
    dosagem = 0

    def __init__(
        self,
        ativos,
        dosagem,
        forma_farmaceutica='',
        sub_forma_farmaceutica='',
    ) -> None:
        self.ativos = []
        for ativoRaw in ativos:
            ativo = ativoClass(
                ativoRaw['nome'],
            )
            ativo.set_orcamento_values(ativoRaw['quantidade'], ativoRaw['unidade'])
            self.ativos.append(ativo)
        self.dosagem = int(dosagem)
        self.forma_farmaceutica = forma_farmaceutica
        self.sub_forma_farmaceutica = sub_forma_farmaceutica

    def print_orcamento(self):
        for ativo_name in self.possible_ativos.keys():
            for ativo in self.possible_ativos[ativo_name]:
                print(ativo)

    def create_pre_orcamento(self):
        self.find_ativos()
        self.choose_excipiente()
        orcamento = self.parse_to_web()
        print(orcamento)

    def parse_ativo_fields(self, row, ativoReceita: ativoClass):
        ativo = ativoClass(
            row['DESCR'],
        )
        ativo.price = row['PRVEN']
        ativo.equivalency = row['EQUIV']
        ativo.dilution = row['DILUICAO']
        ativo.density = row['DENSIDADE']
        if isinstance(row['ARGUMENTO'], str):
            ativo.unity_conversion = row['ARGUMENTO']
            ativo.unity_value_conversion = float(row['PARAMETRO'])
        ativo.set_orcamento_values(ativoReceita.orcamento.quantity, ativoReceita.orcamento.unity)
        return ativo

    def find_ativos(self):
        df_ativos = pd.read_csv(
            './orcamento_tables/smart/ativos_joined_FCerta_SMART_2024.csv'
        )
        for ativo in self.ativos:
            df_match = utils.find_closest_match_contains(df_ativos, ativo.name)
            self.possible_ativos[ativo.name] = []
            for row in df_match.iterrows():
                row = row[1].to_dict()
                possible_ativo = self.parse_ativo_fields(row, ativo)
                self.possible_ativos[ativo.name].append(possible_ativo)

    def choose_excipiente(self):
        self.excipiente = excipientClass()
        self.excipiente.set_excipiente_name(self.sub_forma_farmaceutica, self.ativos)

    def get_custo_fixo(self):
        df_custos = pd.read_csv(
            './orcamento_tables/smart/custo_fixo_FCerta_SMART_2024.csv'
        )
        forma_farmaceutica_id = re.split(r'(\d+)', self.forma_farmaceutica)[1]
        return float(df_custos[df_custos['forma_farmaceutica'] == forma_farmaceutica_id]['custo_fixo'].iloc[0])

    def calc_price(self, ativo: ativoClass):
        ativo.orcamento.price = (
            ativo.price
            * ativo.dilution
            * ativo.equivalency
            * ativo.orcamento.quantity
            * utils.unityCalcConversion(ativo.orcamento.unity)
            / ativo.unity_value_conversion
        )
        if self.forma_farmaceutica not in ['']:
            ativo.orcamento.price *= self.dosagem
        ativo.orcamento.price = round(ativo.orcamento.price, 2)

    def parse_to_web(self):
        ativos = []
        for _, ativosAll in self.possible_ativos.items():
            ativos.append(
                {
                    'unidade': ativosAll[0].orcamento.unity,
                    'quantidade': ativosAll[0].orcamento.quantity,
                    'opcoes': [
                        {
                            'nome': '',
                            'preco': '-',
                        }
                    ],
                }
            )
            for ativo in ativosAll:
                self.calc_price(ativo)
                ativos[-1]['opcoes'].append(
                    {
                        'nome': ativo.name,
                        'preco': ativo.orcamento.price,
                    }
                )
        return {
            'nomeCliente': self.nome_cliente,
            'nomeMedico': self.nome_medico,
            'dosagem': self.dosagem,
            'formaFarmaceutica': self.forma_farmaceutica,
            'formaFarmaceuticaSubgrupo': self.sub_forma_farmaceutica,
            'ativos': ativos,
            'embalagem': {
                'nome': '',
                'unidade': '-',
                'quantidade': '-',
                'preco': '-',
            },
            'excipiente': {
                'nome': 'EXCIPIENTE PADRÃO CÁPSULAS',
                'unidade': 'MG',
                'quantidade': '-',
                'preco': '-',
            },
            'capsulas': {
                'quantidade': self.dosagem,
                'unidade': 'UN',
                'tipo': 'INCOLOR',
                'nome': '-',
                'contem': '-',
                'preco': '-',
            },
            'custoFixo': self.get_custo_fixo(),
        }
