class ativoOrcamentoClass:
    quantity: int = 0
    unity: str = ''
    price: float = 0

    def __init__(
        self,
        quantity,
        unity,
    ) -> None:
        self.quantity = quantity
        self.unity = unity


class ativoClass:
    name: str = ''
    price = 0
    equivalency = 1
    dilution = 1
    density = 1
    unity_conversion = ''
    unity_value_conversion = 1
    orcamento: ativoOrcamentoClass = None

    def __init__(
        self,
        name,
        orcamento: ativoOrcamentoClass,
    ) -> None:
        self.name = name
        self.orcamento = orcamento

    def __str__(self):
        return f"name: {self.name}, unity: {self.orcamento.unity}, quantity: {self.orcamento.quantity}, price: {self.orcamento.price}"
