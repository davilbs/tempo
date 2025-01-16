import pandas as pd, re
import utils
from pydantic import BaseModel
from typing import Sequence

from ativo.main import ativoClass, ativoOrcamentoClass
from excipients.main import excipientClass
from capsules.main import capsuleClass
from embalagens.main import embalagemClass


class orcamentoClass(BaseModel):
    compression_factor: float = 0.8
    ativos: Sequence[ativoClass] = []
    dosagem: int = 0
    number_of_capsule: int = 1
    nome_cliente: str = ''
    nome_medico: str = ''
    forma_farmaceutica: str = ''
    sub_forma_farmaceutica: str = ''
    capsulas: Sequence[capsuleClass] = []
    excipiente: excipientClass = None
    embalagem: embalagemClass = None
    nome_formula: str = ''

    def __init__(self, orcamento_values) -> None:
        super().__init__()
        self.ativos = []
        for ativoRaw in orcamento_values['ativos']:
            ativo = ativoClass(
                ativoRaw['nome'],
            )
            ativo.set_orcamento_values(
                ativoRaw['quantidade'],
                ativoRaw['unidade'],
                name=ativoRaw['original'] if 'original' in ativoRaw else '',
            )
            self.ativos.append(ativo)
        self.dosagem = orcamento_values['dosagem']
        self.forma_farmaceutica = orcamento_values['forma_farmaceutica']
        self.sub_forma_farmaceutica = orcamento_values['sub_forma_farmaceutica']
        self.nome_cliente = orcamento_values['nome_cliente']
        self.nome_medico = orcamento_values['nome_medico']
        self.nome_formula = orcamento_values['nome_formula']

        self.calc_price_ativos()
        self.choose_capsule(
            orcamento_values['capsula']['tipo'] if 'tipo' in orcamento_values['capsula'] else ''
        )
        self.choose_excipiente(orcamento_values)
        self.choose_embalagem(orcamento_values)

    def create_orcamento(self):
        total_price = 0
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
            'capsulas': {},
            'custoFixo': self.get_custo_fixo(),
            'nomeFormula': self.nome_formula,
        }
        for ativo in self.ativos:
            orcamento['ativos'].append(
                {
                    'original': ativo.orcamento.name,
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
            total_price += ativo.orcamento.price

        total_price += (
            orcamento['custoFixo']
            + orcamento['embalagem']['preco']
            + orcamento['excipiente']['preco']
        )
        min_price = self.get_custo_minimo()
        price_per_capsule = []
        opcoes_capsula = []
        for capsula in self.capsulas:
            opcoes_capsula.append(
                {
                    'nome': capsula.name,
                    'preco': capsula.orcamento.price,
                }
            )
            orcamento['capsulas'] = {
                'tipo': capsula.type,
                'quantidade': self.dosagem,
                'contem': self.number_of_capsule,
            }
            total_price_per_capsule = total_price + capsula.orcamento.price
            if total_price_per_capsule < min_price:
                price_per_capsule.append(min_price)
            else:
                price_per_capsule.append(total_price_per_capsule)
        orcamento['capsulas']['opcoes'] = opcoes_capsula

        if len(price_per_capsule) > 0:
            orcamento['precoTotal'] = price_per_capsule
        else:
            if total_price < min_price:
                orcamento['precoTotal'] = [min_price]
            else:
                orcamento['precoTotal'] = [total_price]
        
        return orcamento

    def calc_price_ativos(self):
        for ativo in self.ativos:
            utils.calc_price(ativo, self.forma_farmaceutica, self.dosagem)

    def calc_volume_ativos(self):
        ativos_volume = 0
        for ativo in self.ativos:
            ativos_volume += (
                1000
                * utils.unityCalcConversion(ativo.orcamento.unity)
                * (ativo.orcamento.quantity * ativo.dilution)
                / (ativo.unity_value_conversion * ativo.density)
            )

        return ativos_volume * self.compression_factor

    def choose_capsule(self, capsule_type):
        if capsule_type == '':
            capsule = capsuleClass(
                '',
                '',
                '0',
                '0',
                '0',
                '',
                {
                    'PRVEN': 0,
                    'EQUIV': 0,
                    'DILUICAO': 0,
                    'DENSIDADE': 0,
                    'ARGUMENTO': 0,
                },
            )
            capsule.set_orcamento_values(
                0,
                'UN',
            )
            utils.calc_price(capsule, self.forma_farmaceutica, self.dosagem)
            self.capsulas.append(capsule)
            return
        df_capsule = pd.read_csv(
            '../orcamento_tables/smart/capsulas_FCerta_SMART_2024.csv'
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
                        capsule_type,
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

    def get_excipiente_qnt_price(self):
        self.excipiente.orcamento = ativoOrcamentoClass(
            quantity=self.calc_quantity_excipiente(),
            unity='MG',
        )
        if self.forma_farmaceutica not in ['1 - Cápsulas']:
            return
        utils.calc_price(self.excipiente, self.forma_farmaceutica, self.dosagem)

    def calc_quantity_excipiente(self):
        if len(self.capsulas) == 0:
            return
        ativos_volume = self.calc_volume_ativos()
        return (
            self.number_of_capsule * self.capsulas[0].internal_volume
        ) - ativos_volume

    # def calc_volume_capsule(self):
    #     return self.capsules[0].external_volume * self.dosagem

    def choose_embalagem(self, orcamento_values):
        self.embalagem = embalagemClass(None, orcamento_values['embalagem']['nome'])
        self.embalagem.set_orcamento_values(
            orcamento_values['embalagem']['quantidade'], 'UN'
        )
        self.embalagem.calc_price()

    def choose_excipiente(self, orcamento_values):
        self.excipiente = excipientClass(
            orcamento_values['excipiente']['nome'] if 'nome' in orcamento_values['excipiente'] else '',
        )
        self.excipiente.get_excipiente(
            orcamento_values['sub_forma_farmaceutica'],
            self.ativos,
        )
        self.get_excipiente_qnt_price()

    def get_custo_fixo(self):
        df_custos = pd.read_csv(
            '../orcamento_tables/smart/custo_fixo_FCerta_SMART_2024.csv'
        )
        forma_farmaceutica_id = re.split(r'(\d+)', self.forma_farmaceutica)[1]
        return float(
            df_custos[df_custos['forma_farmaceutica'] == forma_farmaceutica_id][
                'custo_fixo'
            ].iloc[0]
        )

    def get_custo_minimo(self):
        df_custos = pd.read_csv(
            '../orcamento_tables/smart/custo_minimo_FCerta_SMART_2024.csv'
        )
        forma_farmaceutica_id = int(re.split(r'(\d+)', self.forma_farmaceutica)[1])
        return float(
            df_custos[df_custos['forma_farmaceutica'] == forma_farmaceutica_id][
                'custo_minimo'
            ].iloc[0]
        )
