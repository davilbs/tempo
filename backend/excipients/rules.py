import re
from ativo.main import ativoClass, ativoOrcamentoClass
from unidecode import unidecode


class excipientRules:
    sub_forma_farmaceutica = ''

    def __init__(self, sub_forma_farmaceutica):
        self.sub_forma_farmaceutica = sub_forma_farmaceutica
        
    def get_excipiente(self, ativos: list[ativoClass]):
        return self.check_sub_forma_farmaceutica(ativos)

    def check_sub_forma_farmaceutica(self, ativos):
        if self.sub_forma_farmaceutica in [
            "Slow Release",
            "Hipoalergênica",
            "Sublingual",
        ]:
            if self.sub_forma_farmaceutica == 'Slow Release':
                return 'EXCIPIENTE SLOW RELEASE II'
            elif self.sub_forma_farmaceutica == 'Hipoalergênica':
                return 'EXCIP HIPOALERGENICO CAPS-VEG'
            elif self.sub_forma_farmaceutica == 'Sublingual':
                return 'EXCIPIENTE CAPSULA SUBLINGUAL'
            elif (
                self.sub_forma_farmaceutica == 'Iodo Metalóide + Iodeto de Potássio'
            ):
                return self.iodo(ativos)
            elif self.sub_forma_farmaceutica == "Lipofílica / Oleosa":
                return self.lipofilico_oleosa(ativos)
        return 'EXCIPIENTE PADRÃO CÁPSULAS'

    def lipofilico_oleosa(self, ativos: list[ativoClass]):
        for ativo in ativos:
            if re.match('lipofilic', ativo.name):
                return 'EXCIPIENTE LIPOFILICO'

        return ''

    def iodo(self, ativos: list[ativoClass]):
        match = 0

        for ativo in ativos:
            ativo_name = unidecode(ativo.name).lower()
            if re.match('iodo metaloide', ativo_name):
                ativo_iodo = ativo
                match += 1
            elif re.match('iodeto potassio', ativo_name):
                ativo_iodeto = ativo
                match += 1
            if match == 2:
                ativo_iodo = ativoClass(
                    'IODORAL',
                    ativoOrcamentoClass(
                        ativo_iodo.quantity + ativo_iodeto.quantity,
                        'MG',
                    ),
                )
                ativo_iodeto = ativoClass('', None)
                return 'EXCIPIENTE LIPOFILICO'

        return ''
