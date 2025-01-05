from django.db import models
from .enums import RoleChoices, MFAMethodChoices
from .managers import UserManager
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin



class Users(AbstractBaseUser, PermissionsMixin):
    id = models.BigAutoField(primary_key=True,null=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)

    role = models.CharField(
        max_length=20,
        choices=RoleChoices.choices(),
        default=RoleChoices.GUEST.value
    )
    is_mfa_enabled = models.BooleanField(default=False)
    mfa_method = models.CharField(
        max_length=10,
        choices=MFAMethodChoices.choices(),
        null=True,
        blank=True
    )
    mfa_secret = models.CharField(max_length=255, null=True, blank=True)  # For TOTP

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'Users'

    def __str__(self):
        return self.username