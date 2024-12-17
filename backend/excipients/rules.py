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
        excipiente = ''
        if self.sub_forma_farmaceutica in [
            "Slow Release",
            "Hipoalergênica",
            "Sublingual",
            "Iodo Metalóide + Iodeto de Potássio",
            "Lipofílica / Oleosa",
            "Thyroid ou Tireodei em Grão",
            "Óleo ozonizado",
        ]:
            if self.sub_forma_farmaceutica == 'Slow Release':
                excipiente = 'EXCIPIENTE SLOW RELEASE II'
            elif self.sub_forma_farmaceutica == 'Hipoalergênica':
                excipiente = 'EXCIP HIPOALERGENICO CAPS-VEG'
            elif self.sub_forma_farmaceutica == 'Sublingual':
                excipiente = 'EXCIPIENTE CAPSULA SUBLINGUAL'
            elif (
                self.sub_forma_farmaceutica == 'Iodo Metalóide + Iodeto de Potássio'
            ):
                excipiente = self.iodo(ativos)
            elif self.sub_forma_farmaceutica == "Lipofílica / Oleosa":
                excipiente = self.lipofilico_oleosa(ativos)
            elif self.sub_forma_farmaceutica == "Thyroid ou Tireodei em Grão":
                excipiente = self.thyroid(ativos)
            elif self.sub_forma_farmaceutica == "Óleo ozonizado":
                excipiente = self.oleo_ozonizado(ativos)
            elif self.sub_forma_farmaceutica == "Vaginal":
                excipiente = self.uso_vaginal(ativos)
        
        if excipiente == '' or excipiente == None:
            excipiente = 'EXCIPIENTE PADRÃO CÁPSULAS'
        
        return excipiente

    def lipofilico_oleosa(self, ativos: list[ativoClass]):
        for ativo in ativos:
            if re.match(r'lipofilic', ativo.name):
                return 'EXCIPIENTE LIPOFILICO'

        return ''

    def iodo(self, ativos: list[ativoClass]):
        match = 0

        for ativo in ativos:
            ativo_name = unidecode(ativo.name).lower()
            if re.match(r'iodo metaloide', ativo_name):
                ativo_iodo = ativo
                match += 1
            elif re.match(r'iodeto potassio', ativo_name):
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
                return 'EXCIPIENTE IODORAL'

    def thyroid(self, ativos: list[ativoClass]):
        for ativo in ativos:
            ativo_unity = unidecode(ativo.orcamento.unity).lower()
            if re.match(r'grao', ativo_unity):
                ativo.orcamento.quantity = ativo.orcamento.quantity * 65
                ativo.orcamento.unity = 'MG'
    
    def oleo_ozonizado(self,  ativos: list[ativoClass]):
        for ativo in ativos:
            ativo_name = unidecode(ativo.name).lower()
            if re.match(r'ol.+ozonizado.+p\/caps', ativo_name):
                ativo.orcamento.quantity = ativo.orcamento.quantity * 10
                ativo.orcamento.unity = 'MG'
    

    def uso_vaginal(self,  ativos: list[ativoClass]):
        for ativo in ativos:
            ativo_name = unidecode(ativo.name).lower()
            if re.match('uso vaginal', ativo_name):
                ativo.orcamento.quantity = ativo.orcamento.quantity * 10
                ativo.orcamento.unity = 'MG'