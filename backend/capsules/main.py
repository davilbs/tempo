import pandas as pd

from ativo.main import ativoClass

class capsuleClass:
    type: str = ''
    color: str = ''
    internal_volume: int = 0
    external_volume: int = 0
    priority: int = 0
    ativo: ativoClass = None

    def __init__(
        self,
        type,
        color,
        internal_volume,
        external_volume,
        priority,
        ativo: ativoClass
    ) -> None:
        self.type = type
        self.color = color
        self.internal_volume = internal_volume
        self.external_volume = external_volume
        self.priority = priority
        self.ativo = ativo
        df_ativos = pd.read_csv(
            './orcamento_tables/smart/outros_ativos_joined_FCerta_SMART_2024.csv'
        )
        row = df_ativos[df_ativos['DESCR'] == self.ativo.name].drop('Unnamed: 0', axis=1).drop_duplicates().to_dict('records')[0]
        self.set_values(row)
    
    def set_values(self, row):
        self.ativo.price = row['PRVEN']
        self.ativo.equivalency = row['EQUIV']
        self.ativo.dilution = row['DILUICAO']
        self.ativo.density = row['DENSIDADE']
        if isinstance(row['ARGUMENTO'], str):
            self.ativo.unity_conversion = row['ARGUMENTO']
            self.ativo.unity_value_conversion = float(row['PARAMETRO'])
        
    def __str__(self):
        return f"type: {self.type}, color: {self.color}, name: {self.ativo.name}, internal_volume: {self.internal_volume}, external_volume: {self.external_volume}, priority: {self.priority}"
