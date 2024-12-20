import pandas as pd, re
from pydantic import BaseModel

class ativoOrcamentoClass(BaseModel):
    quantity: int = 0
    unity: str = ''
    price: float = 0

    def __init__(
        self,
        quantity,
        unity,
    ) -> None:
        super().__init__()
        self.quantity = quantity
        self.unity = unity


class ativoClass(BaseModel):
    name: str = ''
    price: float = 0
    equivalency: int = 1
    dilution: int = 1
    density: int = 1
    unity_conversion: str = ''
    unity_value_conversion: int = 1
    orcamento: ativoOrcamentoClass = None

    def __init__(
        self,
        name,
    ) -> None:
        super().__init__()
        self.name = name
        self.set_values()

    def set_values(self):
        df_ativos = pd.read_csv(
            '../orcamento_tables/smart/ativos_joined_FCerta_SMART_2024.csv'
        )
        row = df_ativos[df_ativos['DESCR'] == self.name.strip().upper()].iloc[0].to_dict()
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
