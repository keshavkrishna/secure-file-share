from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
from django.conf import settings
import os
import base64
import struct

class AESFileEncryption:
    def __init__(self):
        self.key = self._get_or_create_key()
        self.backend = default_backend()
        self.BLOCK_SIZE = 16  # AES block size in bytes
        
    def _get_or_create_key(self):
        key_path = os.path.join(settings.BASE_DIR, 'server_aes.key')
        if os.path.exists(key_path):
            with open(key_path, 'rb') as key_file:
                return key_file.read()
        else:
            key = os.urandom(32)  # 256 bits
            with open(key_path, 'wb') as key_file:
                key_file.write(key)
            return key

    def _pad(self, data):
        """Add PKCS#7 padding"""
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(data) + padder.finalize()
        return padded_data

    def _unpad(self, padded_data):
        """Remove PKCS#7 padding"""
        unpadder = padding.PKCS7(128).unpadder()
        data = unpadder.update(padded_data) + unpadder.finalize()
        return data

    def encrypt_file(self, file_content):
        """
        Encrypt file content using AES-256 CBC
        Returns: iv + encrypted_data + data_size
        """
        try:
            # Generate IV
            iv = os.urandom(self.BLOCK_SIZE)
            
            # Pad the data
            padded_data = self._pad(file_content)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(self.key),
                modes.CBC(iv),
                backend=self.backend
            )
            
            # Encrypt
            encryptor = cipher.encryptor()
            encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
            
            # Store original data size
            original_size = len(file_content)
            size_bytes = struct.pack('<Q', original_size)
            
            # Combine IV + encrypted data + original size
            return iv + encrypted_data + size_bytes
            
        except Exception as e:
            raise Exception(f"Encryption failed: {str(e)}")

    def decrypt_file(self, encrypted_content):
        """
        Decrypt file content using AES-256 CBC
        Input format: iv + encrypted_data + data_size
        """
        try:
            # Extract IV (first 16 bytes) and size (last 8 bytes)
            iv = encrypted_content[:self.BLOCK_SIZE]
            size_bytes = encrypted_content[-8:]
            encrypted_data = encrypted_content[self.BLOCK_SIZE:-8]
            
            # Get original file size
            original_size = struct.unpack('<Q', size_bytes)[0]
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(self.key),
                modes.CBC(iv),
                backend=self.backend
            )
            
            # Decrypt
            decryptor = cipher.decryptor()
            padded_data = decryptor.update(encrypted_data) + decryptor.finalize()
            
            # Remove padding
            decrypted_data = self._unpad(padded_data)
            
            # Verify and return original size
            return decrypted_data[:original_size]
            
        except Exception as e:
            raise Exception(f"Decryption failed: {str(e)}")

# Create global encryption instance
aes_encryption = AESFileEncryption()