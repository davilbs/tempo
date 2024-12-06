import pandas as pd

from ativo.main import ativoClass


class embalagemClass(ativoClass):
    def __init__(self, volume, name=None):
        if name == None:
            name = self.embalagemVolume(volume)
        super().__init__(name)

    def set_values(self):
        df_embalagens = pd.read_csv(
            './orcamento_tables/smart/embalagens_FCerta_SMART_2024.csv'
        )
        embalagem = df_embalagens[df_embalagens['DESCR'] == self.name]
        self.density = embalagem['DENSIDADE'].iloc[0]
        self.dilution = embalagem['DILUICAO'].iloc[0]
        self.equivalency = embalagem['EQUIV'].iloc[0]
        self.price = embalagem['PRVEN'].iloc[0]

    def embalagemVolume(self, volume):
        df_volume = pd.read_csv('./orcamento_tables/smart/volume_embalagens.csv')
        return (
            df_volume[df_volume['volume_interno'] >= volume]
            .sort_values('volume_interno')['embalagem']
            .iloc[0]
        )

    def calc_price(self):
        self.orcamento.price = (
            self.price * self.dilution * self.equivalency * self.orcamento.quantity
        )
