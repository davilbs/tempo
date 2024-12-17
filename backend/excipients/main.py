import pandas as pd, re

from excipients.rules import excipientRules
from ativo.main import ativoClass


class excipientClass(ativoClass):
    def __init__(
        self,
        name: str = '',
    ) -> None:
        if name == '':
            name = 'EXCIPIENTE PADRÃO CÁPSULAS'
        super().__init__(name)

    def set_values(self):
        df_excipientes = pd.read_csv(
            './orcamento_tables/smart/excipientes_FCerta_SMART_2024.csv'
        )
        excipiente = df_excipientes[df_excipientes['DESCR'].str.strip().apply(lambda x: re.sub(r'\s+', ' ', x)) == re.sub(r'\s+', ' ', self.name.strip())]
        self.density = excipiente['DENSIDADE'].iloc[0]
        self.dilution = excipiente['DILUICAO'].iloc[0]
        self.equivalency = excipiente['EQUIV'].iloc[0]
        self.price = excipiente['PRVEN'].iloc[0]

    def get_excipiente(
        self,
        sub_forma_farmaceutica: str,
        ativos: list[ativoClass],
    ):
        rule = excipientRules(sub_forma_farmaceutica)
        self.name = rule.get_excipiente(ativos)
