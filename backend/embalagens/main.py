import pandas as pd, re

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
        embalagem = df_embalagens[df_embalagens['DESCR'].str.strip().apply(lambda x: re.sub(r'\s+', ' ', x) if isinstance(x, str) else x) == re.sub(r'\s+', ' ', self.name.strip())]
        self.density = embalagem['DENSIDADE'].iloc[0] if len (embalagem['DENSIDADE']) > 0 else 1
        self.dilution = embalagem['DILUICAO'].iloc[0] if len (embalagem['DILUICAO']) > 0 else 1
        self.equivalency = embalagem['EQUIV'].iloc[0] if len (embalagem['EQUIV']) > 0 else 1
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
