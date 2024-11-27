import pandas as pd

class ativoOrcamentoClass:
    quantity: int = 0
    unity: str = ''
    price: float = 0

    def __init__(
        self,
        quantity,
        unity,
    ) -> None:
        self.quantity = quantity
        self.unity = unity


class ativoClass:
    name: str = ''
    price = 0
    equivalency = 1
    dilution = 1
    density = 1
    unity_conversion = ''
    unity_value_conversion = 1
    orcamento: ativoOrcamentoClass = None

    def __init__(
        self,
        name,
    ) -> None:
        self.name = name

    def set_values(self):
        df_ativos = pd.read_csv(
            './orcamento_tables/smart/ativos_joined_FCerta_SMART_2024.csv'
        )
        row = df_ativos[df_ativos['DESCR'] == self.name]
        self.price = row['PRVEN']
        self.equivalency = row['EQUIV']
        self.dilution = row['DILUICAO']
        self.density = row['DENSIDADE']
        if isinstance(row['ARGUMENTO'], str):
            self.unity_conversion = row['ARGUMENTO']
            self.unity_value_conversion = float(row['PARAMETRO'])
    
    def set_orcamento_values(
        self,
        quantity,
        unity,
    ):
        self.orcamento = ativoOrcamentoClass(
            quantity,
            unity,
        )

    def __str__(self):
        if self.orcamento != None:
            return f"name: {self.name}, unity: {self.orcamento.unity}, quantity: {self.orcamento.quantity}, price: {self.orcamento.price}"
        else:
            return f"name: {self.name}"
