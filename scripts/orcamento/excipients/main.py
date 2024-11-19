from excipients.rules import excipientRules


class excipientClass:
    name = ''
    quantity = 0
    unity = 'MG'
    rule = None
    
    def set_excipiente_name(self, sub_forma_farmaceutica, ativos):
        self.rule = excipientRules(sub_forma_farmaceutica)
        self.name = self.rule.get_excipiente(ativos)

    def __str__(self):
        return f"name: {self.name}, quantity: {self.quantity}, unity: {self.unity}"
