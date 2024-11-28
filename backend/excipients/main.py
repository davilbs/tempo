import pandas as pd

from excipients.rules import excipientRules
from ativo.main import ativoClass

class excipientClass(ativoClass):

    def __init__(self, sub_forma_farmaceutica, ativos, name = '') -> None:
        if name == '':
            name = "EXCIPIENTE CAPSULA SUBLINGUAL"
            # rule = excipientRules(sub_forma_farmaceutica)
            # name = rule.get_excipiente(ativos)
        print(name)
        super().__init__(name)

    def set_values(self):
        df_excipientes = pd.read_csv(
            './orcamento_tables/smart/excipientes_FCerta_SMART_2024.csv'
        )
        excipiente = df_excipientes[df_excipientes['DESCR'] == self.name]
        self.density = excipiente['DENSIDADE'].iloc[0]
        self.dilution = excipiente['DILUICAO'].iloc[0]
        self.equivalency = excipiente['EQUIV'].iloc[0]
        self.price = excipiente['PRVEN'].iloc[0]
