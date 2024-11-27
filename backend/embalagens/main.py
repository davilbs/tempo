import pandas as pd

from ativo.main import ativoClass, ativoOrcamentoClass


class embalagemClass:
    ativo: ativoClass = None

    def set_embalagem_values(self, volume, name = None):
        if name == None:
            name = self.embalagemVolume(volume)
        df_embalagens = pd.read_csv(
            './orcamento_tables/smart/embalagens_FCerta_SMART_2024.csv'
        )
        embalagem = df_embalagens[df_embalagens['DESCR'] == name]
        self.ativo = ativoClass(name, None)
        self.ativo.density = embalagem['DENSIDADE'].iloc[0]
        self.ativo.dilution = embalagem['DILUICAO'].iloc[0]
        self.ativo.equivalency = embalagem['EQUIV'].iloc[0]
        self.ativo.price = embalagem['PRVEN'].iloc[0]

    def embalagemVolume(self, volume):
        df_volume = pd.read_csv('./orcamento_tables/smart/volume_embalagens.csv')
        return (
            df_volume[df_volume['volume_interno'] >= volume]
            .sort_values('volume_interno')['embalagem']
            .iloc[0]
        )

    def calc_price(self, quantity):
        self.ativo.orcamento = ativoOrcamentoClass(quantity, 'UN')
        self.ativo.orcamento.price = (
            self.ativo.price
            * self.ativo.dilution
            * self.ativo.equivalency
            * quantity
        )

    def __str__(self):
        return f"name: {self.ativo.name}, price: {self.ativo.price}"
