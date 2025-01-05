from django.apps import AppConfig
from .utils import generate_rsa_keys
from django.conf import settings

class FilesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'files'


    def ready(self):
        generate_rsa_keys(settings.PRIVATE_KEY_PATH, settings.PUBLIC_KEY_PATH)

