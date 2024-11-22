class capsuleClass:
    type: str = ''
    color: str = ''
    name: str = ''
    internal_volume: int = 0
    external_volume: int = 0

    def __init__(self, type, color, name, internal_volume, external_volume) -> None:
        self.type = type
        self.color = color
        self.name = name
        self.internal_volume = internal_volume
        self.external_volume = external_volume

    def __str__(self):
        return f"type: {self.type}, color: {self.color}, name: {self.name}, internal_volume: {self.internal_volume}, external_volume: {self.external_volume}"
