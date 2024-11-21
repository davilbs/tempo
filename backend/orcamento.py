import pandas as pd, re

from ativo.main import ativoClass, ativoOrcamentoClass
from excipients.main import excipientClass
from capsules.main import capsuleClass
from embalagens.main import embalagemClass

class orcamentoClass:
    ativos: list[ativoClass] = []
    quantity: int = 0
    forma_farmaceutica: str = ''
    sub_forma_farmaceutica: str = ''
    price_range = {'min': 0, 'max': 0}
    possible_ativos: dict[str : list[ativoClass]] = {}
    number_of_capsule: int = 1
    compression_factor: float = 0.8
    capsule: list[capsuleClass] = []
    excipiente = None
    embalagem = None

    def __init__(
        self,
        ativos,
        quantity,
        forma_farmaceutica='',
        sub_forma_farmaceutica='',
    ) -> None:
        self.ativos = ativos
        self.quantity = quantity
        self.forma_farmaceutica = forma_farmaceutica
        self.sub_forma_farmaceutica = sub_forma_farmaceutica

    def print_orcamento(self):
        for ativo_name in self.possible_ativos.keys():
            for ativo in self.possible_ativos[ativo_name]:
                print(ativo)
        print(self.price_range)
        for capsule in self.capsule:
            print(capsule)
        print(self.excipiente)
        print(self.embalagem)

    def create_orcamento(self):
        self.calc_price_ativos()
        self.calc_price_range()
        self.choose_capsule('INCOLOR')
        self.choose_excipiente()
        self.choose_embalagem()
        self.print_orcamento()

    # TODO: implement this method to update the price without
    # choose anything, only using what it receives
    def getPrice(self, orcamento_values):
        return

    def do_descr_match(self, target, df):
        if df['DESCR'].str.contains(target, case=False, na=False).any():
            return df[df['DESCR'].str.contains(target, case=False, na=False)]
        return []

    def find_closest_match_contains(self, df, target):
        # Step 1: Full match
        matchs = self.do_descr_match(target, df)
        if len(matchs) > 0:
            return matchs

        # Step 2: Remove words progressively
        words = target.split()
        for i in range(len(words) - 1, 0, -1):
            shortened_name = re.escape(" ".join(words[:i]))
            matchs = self.do_descr_match(shortened_name, df)
            if len(matchs) > 0:
                return matchs

        # Step 3: Remove letters progressively
        for i in range(len(target) - 1, 0, -1):
            shortened_name = re.escape(target[:i])
            matchs = self.do_descr_match(shortened_name, df)
            if len(matchs) > 0:
                return matchs

        return None  # No match found

    def parse_ativo_fields(self, row_ativo, ativoOrcado: ativoClass):
        ativo = ativoClass(
            row_ativo['DESCR'],
            ativoOrcamentoClass(
                ativoOrcado.orcamento.quantity,
                ativoOrcado.orcamento.unity,
            ),
        )
        ativo.price = row_ativo['PRVEN']
        ativo.equivalency = row_ativo['EQUIV']
        ativo.dilution = row_ativo['DILUICAO']
        ativo.density = row_ativo['DENSIDADE']
        if isinstance(row_ativo['ARGUMENTO'], str):
            ativo.unity_conversion = row_ativo['ARGUMENTO']
            ativo.unity_value_conversion = float(row_ativo['PARAMETRO'])
        
        return ativo

    def unityCalcConversion(self, unity: str):
        unity = unity.upper()
        if unity == '%':
            return 0.01
        elif unity == 'MG':
            return 0.001
        elif unity == 'MCG':
            return 0.000001
        elif unity == 'KG':
            return 1000
        elif unity == 'L':
            return 1000
        else:
            return 1

    def calc_price(self, ativo: ativoClass):
        ativo.orcamento.price = (
            ativo.price
            * ativo.dilution
            * ativo.equivalency
            * ativo.orcamento.quantity
            * self.unityCalcConversion(ativo.orcamento.unity)
            / ativo.unity_value_conversion
        )
        if self.forma_farmaceutica not in ['']:
            ativo.orcamento.price *= self.quantity

    def calc_price_ativos(self):
        df_ativos = pd.read_csv(
            './orcamento_tables/smart/ativos_joined_FCerta_SMART_2024.csv'
        )
        
        for ativoOrcado in self.ativos:
            df_match = self.find_closest_match_contains(df_ativos, ativoOrcado.name)
            self.possible_ativos[ativoOrcado.name] = []
            for row in df_match.iterrows():
                row = row[1].to_dict()
                ativo = self.parse_ativo_fields(row, ativoOrcado)
                self.calc_price(ativo)
                self.possible_ativos[ativoOrcado.name].append(ativo)
    
    def calc_price_range(self):
        for ativo_name in self.possible_ativos:
            prices = []
            for ativo in self.possible_ativos[ativo_name]:
                prices.append(ativo.orcamento.price)
            prices.sort()
            self.price_range['min'] += prices[0]
            self.price_range['max'] += prices[-1]

    def calc_volume_ativos(self):
        ativos_volume = 0
        for ativo in self.ativos:
            ativos_volume += ativo.orcamento.quantity / (
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
        while len(self.capsule) == 0:
            number_of_capsule += 1
            for row in capsules.iterrows():
                row = row[1].to_dict()
                if ativo_volume <= (row['VOLINTERNO'] * number_of_capsule):
                    self.capsule.append(
                        capsuleClass(
                            row['DESCRICAO'],
                            row['DESC_COR'],
                            row['DESCR'],
                            row['VOLINTERNO'],
                            row['VOLEXTERNO'],
                        )
                    )
                    self.number_of_capsule = number_of_capsule

    def choose_excipiente(self):
        self.excipiente = excipientClass()
        self.excipiente.quantity = self.calc_quantity_excipiente()
        self.excipiente.set_excipiente_name(self.sub_forma_farmaceutica, self.ativos)

    def calc_quantity_excipiente(self):
        ativos_volume = self.calc_volume_ativos()
        return ativos_volume - self.capsule[0].internal_volume
    
    def calc_volume_capsule(self):
        return self.capsule[0].external_volume * self.quantity
        
    def choose_embalagem(self):
        self.embalagem = embalagemClass()
        volume_capsule = self.calc_volume_capsule()
        self.embalagem.getEmbalagem(self.quantity)