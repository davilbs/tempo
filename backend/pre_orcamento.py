import pandas as pd, utils, re
from pydantic import BaseModel
from typing import List, Dict
from typing_extensions import TypedDict

from ativo.main import ativoClass
from excipients.main import excipientClass


class preOrcamentoClass(BaseModel):
    ativos: List[Dict] = []
    possible_ativos: Dict[str, List[ativoClass]] = {}
    nome_cliente: str = ''
    nome_medico: str = ''
    forma_farmaceutica: str = ''
    sub_forma_farmaceutica: str = ''
    dosagem: int = 0
    excipiente: str = ''

    def __init__(
        self,
        ativos,
        dosagem,
        forma_farmaceutica='',
        sub_forma_farmaceutica='',
        nome_cliente='',
        nome_medico='',
    ) -> None:
        super().__init__()
        self.ativos = []
        for ativoRaw in ativos:
            ativo = {
                'nome': ativoRaw['nome'],
                'quantidade': ativoRaw['quantidade'],
                'unidade': ativoRaw['unidade'],
            }
            self.ativos.append(ativo)
        self.dosagem = int(dosagem)
        self.forma_farmaceutica = forma_farmaceutica
        self.sub_forma_farmaceutica = sub_forma_farmaceutica
        self.nome_cliente = nome_cliente
        self.nome_medico = nome_medico

    def print_orcamento(self):
        for ativo_name in self.possible_ativos.keys():
            for ativo in self.possible_ativos[ativo_name]:
                print(ativo)

    def create_pre_orcamento(self):
        self.find_ativos()
        self.choose_excipiente()
        orcamento = self.parse_to_web()
        return orcamento

    def parse_ativo_fields(self, row, ativo):
        possible_ativo = ativoClass(row['DESCR'])
        possible_ativo.set_values()
        possible_ativo.set_orcamento_values(
            ativo['quantidade'], ativo['unidade']
        )
        return possible_ativo

    def find_ativos(self):
        df_ativos = pd.read_csv(
            './orcamento_tables/smart/ativos_joined_FCerta_SMART_2024.csv'
        )
        for ativo in self.ativos:
            df_match = utils.find_closest_match_contains(df_ativos, ativo['nome'])
            self.possible_ativos[ativo['nome']] = []
            for row in df_match.iterrows():
                row = row[1].to_dict()
                possible_ativo = self.parse_ativo_fields(row, ativo)
                self.possible_ativos[ativo['nome']].append(possible_ativo)

    def choose_excipiente(self):
        self.excipiente = excipientClass(self.sub_forma_farmaceutica, self.ativos)

    def get_custo_fixo(self):
        df_custos = pd.read_csv(
            './orcamento_tables/smart/custo_fixo_FCerta_SMART_2024.csv'
        )
        forma_farmaceutica_id = re.split(r'(\d+)', self.forma_farmaceutica)[1]
        return float(
            df_custos[df_custos['forma_farmaceutica'] == forma_farmaceutica_id][
                'custo_fixo'
            ].iloc[0]
        )

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
                            'preco': 0.0,
                        }
                    ],
                }
            )
            for ativo in ativosAll:
                utils.calc_price(ativo, self.forma_farmaceutica, self.dosagem)
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
                'nome': '-',
                'unidade': '-',
                'quantidade': '-',
                'preco': 0.0,
            },
            'excipiente': {
                'nome': self.excipiente.name,
                'unidade': 'MG',
                'quantidade': '-',
                'preco': 0.0,
            },
            'capsulas': [{
                'quantidade': self.dosagem,
                'unidade': 'UN',
                'tipo': 'INCOLOR',
                'nome': '-',
                'contem': '-',
                'preco': 0.0,
            }],
            'custoFixo': self.get_custo_fixo(),
        }
