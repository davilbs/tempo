import pandas as pd, re
import utils

from ativo.main import ativoClass, ativoOrcamentoClass
from excipients.main import excipientClass
from capsules.main import capsuleClass
from embalagens.main import embalagemClass


class orcamentoClass:
    compression_factor: float = 0.8
    ativos: list[ativoClass] = []
    dosagem: int = 0
    number_of_capsule: int = 1
    nome_cliente: str = ''
    nome_medico: str = ''
    forma_farmaceutica: str = ''
    sub_forma_farmaceutica: str = ''
    capsulas: list[capsuleClass] = []
    excipiente: excipientClass = None
    embalagem: embalagemClass = None

    def __init__(self, orcamento_values) -> None:
        self.ativos = []
        for ativoRaw in orcamento_values['ativos']:
            ativo = ativoClass(
                ativoRaw['nome'],
            )
            ativo.set_orcamento_values(ativoRaw['quantidade'], ativoRaw['unidade'])
            self.ativos.append(ativo)
        self.dosagem = orcamento_values['dosagem']
        self.forma_farmaceutica = orcamento_values['forma_farmaceutica']
        self.sub_forma_farmaceutica = orcamento_values['sub_forma_farmaceutica']
        self.nome_cliente = orcamento_values['nome_cliente']
        self.nome_medico = orcamento_values['nome_medico']

        self.calc_price_ativos()
        self.choose_capsule(orcamento_values['capsula']['tipo'])
        self.choose_excipiente(orcamento_values)
        self.choose_embalagem(orcamento_values)
        
    def create_orcamento(self):
        orcamento = {
            'nomeCliente': self.nome_cliente,
            'dosagem': self.dosagem,
            'nomeMedico': self.nome_medico,
            'formaFarmaceutica': self.forma_farmaceutica,
            'formaFarmaceuticaSubgrupo': self.sub_forma_farmaceutica,
            'ativos': [],
            'embalagem': {
                'nome': self.embalagem.name,
                'unidade': self.embalagem.orcamento.unity,
                'quantidade': self.embalagem.orcamento.quantity,
                'preco': self.embalagem.orcamento.price,
            },
            'excipiente': {
                'nome': self.excipiente.name,
                'unidade': self.excipiente.orcamento.unity,
                'quantidade': self.excipiente.orcamento.quantity,
                'preco': self.excipiente.orcamento.price,
            },
            'capsulas': [],
            'custoFixo': 7.80,
        }
        for ativo in self.ativos:
            orcamento['ativos'].append(
                {
                    'unidade': ativo.orcamento.unity,
                    'quantidade': ativo.orcamento.quantity,
                    'opcoes': [
                        {
                            'nome': ativo.name,
                            'preco': ativo.orcamento.price,
                        }
                    ],
                }
            )
        for capsula in self.capsulas:
            orcamento['capsulas'].append(
                {
                    'tipo': capsula.type,
                    'nome': capsula.name,
                    'quantidade': self.dosagem,
                    'contem': self.number_of_capsule,
                    'preco': capsula.orcamento.price,
                }
            )
        print(orcamento)
        return orcamento

    def parse_ativo_fields(self, ativo: ativoClass):
        ativo.set_values()
        ativo.set_orcamento_values(ativo.orcamento.quantity, ativo.orcamento.unity)

    def calc_price_ativos(self):
        for ativo in self.ativos:
            self.parse_ativo_fields(ativo)
            utils.calc_price(ativo, self.forma_farmaceutica, self.dosagem)

    def calc_volume_ativos(self):
        ativos_volume = 0
        for ativo in self.ativos:
            ativos_volume += (ativo.orcamento.quantity * ativo.dilution) / (
                ativo.unity_value_conversion * ativo.density
            )

        return ativos_volume * self.compression_factor

    def choose_capsule(self, capsule_type):
        df_capsule = pd.read_csv(
            './orcamento_tables/smart/capsulas_FCerta_SMART_2024.csv'
        )
        capsules = df_capsule[df_capsule['DESCRICAO'] == capsule_type].sort_values(
            by='VOLINTERNO'
        )
        number_of_capsule = 0
        ativo_volume = self.calc_volume_ativos()
        while len(self.capsulas) == 0:
            number_of_capsule += 1
            for row in capsules.iterrows():
                row = row[1].to_dict()
                if ativo_volume <= (row['VOLINTERNO'] * number_of_capsule):
                    capsule = capsuleClass(
                        row['DESCRICAO'],
                        row['DESC_COR'],
                        row['VOLINTERNO'],
                        row['VOLEXTERNO'],
                        row['PRIORIDADE'],
                        row['DESCR'],
                    )
                    capsule.set_orcamento_values(
                        number_of_capsule,
                        'UN',
                    )
                    self.number_of_capsule = number_of_capsule
                    utils.calc_price(capsule, self.forma_farmaceutica, self.dosagem)
                    self.capsulas.append(capsule)
                    break

    def get_excipiente_qnt_price(self):
        self.excipiente.orcamento = ativoOrcamentoClass(
            quantity=self.calc_quantity_excipiente(),
            unity='MG',
        )
        utils.calc_price(self.excipiente, self.forma_farmaceutica, self.dosagem)

    def calc_quantity_excipiente(self):
        ativos_volume = self.calc_volume_ativos()
        return (
            self.number_of_capsule * self.capsulas[0].internal_volume
        ) - ativos_volume

    # def calc_volume_capsule(self):
    #     return self.capsules[0].external_volume * self.dosagem

    def choose_embalagem(self, orcamento_values):
        self.embalagem = embalagemClass(None, orcamento_values['embalagem']['nome'])
        self.embalagem.set_orcamento_values(orcamento_values['embalagem']['quantidade'], 'UN')
        self.embalagem.calc_price()

    def choose_excipiente(self, orcamento_values):
        self.excipiente = excipientClass(
            orcamento_values['forma_farmaceutica'],
            self.ativos,
            orcamento_values['excipiente']['nome'],
        )
        self.get_excipiente_qnt_price()
