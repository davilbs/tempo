import pandas as pd

from excipients.rules import excipientRules
from ativo.main import ativoClass

class excipientClass(ativoClass):    
    def set_excipiente_name(self, sub_forma_farmaceutica, ativos):
        rule = excipientRules(sub_forma_farmaceutica)
        self.ativo = ativoClass(rule.get_excipiente(ativos))
        self.set_values(self.ativo.name)

    def set_values(self, name):
        df_excipientes = pd.read_csv(
            './orcamento_tables/smart/excipientes_FCerta_SMART_2024.csv'
        )
        embalagem = df_excipientes[df_excipientes['DESCR'] == name]
        self.ativo = ativoClass(name)
        self.ativo.density = embalagem['DENSIDADE'].iloc[0]
        self.ativo.dilution = embalagem['DILUICAO'].iloc[0]
        self.ativo.equivalency = embalagem['EQUIV'].iloc[0]
        self.ativo.price = embalagem['PRVEN'].iloc[0]
