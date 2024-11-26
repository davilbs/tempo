import pandas as pd

from excipients.rules import excipientRules
from ativo.main import ativoClass, ativoOrcamentoClass

class excipientClass:
    ativo: ativoClass = None
    rule = None
    
    def set_excipiente_name(self, sub_forma_farmaceutica, ativos):
        self.rule = excipientRules(sub_forma_farmaceutica)
        self.ativo = ativoClass(self.rule.get_excipiente(ativos), None)
        self.set_excipiente_values(self.ativo.name)

    def set_excipiente_values(self, name):
        df_excipientes = pd.read_csv(
            './orcamento_tables/smart/excipientes_FCerta_SMART_2024.csv'
        )
        embalagem = df_excipientes[df_excipientes['DESCR'] == name]
        self.ativo = ativoClass(name, None)
        self.ativo.density = embalagem['DENSIDADE'].iloc[0]
        self.ativo.dilution = embalagem['DILUICAO'].iloc[0]
        self.ativo.equivalency = embalagem['EQUIV'].iloc[0]
        self.ativo.price = embalagem['PRVEN'].iloc[0]
        
    def set_excipiente_orcamento(self, quantity, unity):
        self.ativo.orcamento = ativoOrcamentoClass(quantity, unity)

    def __str__(self):
        return f"name: {self.ativo.name}, quantity: {self.ativo.orcamento.quantity}, unity: {self.ativo.orcamento.unity}"
