from enum import Enum

class RoleChoices(Enum):
    ADMIN = "Admin"
    REGULAR_USER = "Regular User"
    GUEST = "Guest"

    @classmethod
    def choices(cls):
        return [(choice.value, choice.value) for choice in cls]

class MFAMethodChoices(Enum):
    EMAIL = "Email"
    SMS = "SMS"
    TOTP = "TOTP"

    @classmethod
    def choices(cls):
        return [(choice.value, choice.value) for choice in cls]
