from Crypto.PublicKey import RSA
import os
from Crypto.Cipher import PKCS1_OAEP
from Crypto.PublicKey import RSA
from django.conf import settings
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
# from cryptography.hazmat.primitives import serialization
# from cryptography.hazmat.primitives.asymmetric import rsa, padding
# from cryptography.hazmat.primitives import hashes
from django.conf import settings

def get_private_key():
    """
    Load the private key from the specified path.
    """
    with open(settings.PRIVATE_KEY_PATH, "rb") as priv_file:
        return RSA.import_key(priv_file.read())

def get_public_key():
    """
    Load the public key from the specified path.
    """
    with open(settings.PUBLIC_KEY_PATH, "rb") as pub_file:
        return RSA.import_key(pub_file.read())

def encrypt_with_public_key(data):
    """
    Encrypt data using the public key.
    """
    public_key = get_public_key()
    cipher = PKCS1_OAEP.new(public_key)
    return cipher.encrypt(data)

def decrypt_with_private_key(data):
    """
    Decrypt data using the private key.
    """
    private_key = get_private_key()
    cipher = PKCS1_OAEP.new(private_key)
    return cipher.decrypt(data)

def generate_rsa_keys(private_key_path, public_key_path):
    """
    Generate RSA public and private keys if they do not exist.
    """
    if not os.path.exists(private_key_path) or not os.path.exists(public_key_path):
        key = RSA.generate(2048)
        with open(private_key_path, "wb") as priv_file:
            priv_file.write(key.export_key())
        with open(public_key_path, "wb") as pub_file:
            pub_file.write(key.publickey().export_key())
