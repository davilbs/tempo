import pandas as pd

from ativo.main import ativoClass


class capsuleClass(ativoClass):
    type: str = ''
    color: str = ''
    internal_volume: int = 0
    external_volume: int = 0
    priority: int = 0

    def __init__(
        self,
        type,
        color,
        internal_volume,
        external_volume,
        priority,
        name,
    ) -> None:
        self.type = type
        self.color = color
        self.internal_volume = internal_volume
        self.external_volume = external_volume
        self.priority = priority
        super().__init__(name)

    def set_values(self):
        df_ativos = pd.read_csv(
            './orcamento_tables/smart/outros_ativos_joined_FCerta_SMART_2024.csv'
        )
        row = (
            df_ativos[df_ativos['DESCR'] == self.name]
            .drop('Unnamed: 0', axis=1)
            .drop_duplicates()
            .iloc[0].to_dict()
        )
        self.price = row['PRVEN']
        self.equivalency = row['EQUIV']
        self.dilution = row['DILUICAO']
        self.density = row['DENSIDADE']
        if isinstance(row['ARGUMENTO'], str):
            self.unity_conversion = row['ARGUMENTO']
            self.unity_value_conversion = float(row['PARAMETRO'])

    def __str__(self):
        return f"type: {self.type}, color: {self.color}, name: {self.name}, internal_volume: {self.internal_volume}, external_volume: {self.external_volume}, priority: {self.priority}, price: {self.orcamento.price}"
