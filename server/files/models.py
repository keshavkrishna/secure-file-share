from django.db import models
from django.conf import settings
import uuid
from datetime import timedelta
from django.utils.timezone import now

class File(models.Model):
    name = models.CharField(max_length=255)
    encrypted_file = models.FileField(upload_to="encrypted_files/")  # FileField to store the encrypted file
    server_key = models.BinaryField()  # Store the server-side AES key securely
    iv = models.BinaryField()  # Initialization vector for encryption
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    size = models.PositiveBigIntegerField()  # File size in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class FileAccess(models.Model):
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name="accesses")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    can_view = models.BooleanField(default=True)  # Permission to view the file.
    can_download = models.BooleanField(default=False)  # Permission to download the file.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("file", "user")  # Each user can have only one access record per file.

    def __str__(self):
        return f"Access for {self.user.username} to {self.file.name}"


class ShareableLink(models.Model):
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name="shared_links")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)  # Unique token for the link.
    expires_at = models.DateTimeField()  # Expiration timestamp for the link.
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return now() < self.expires_at  # Check if the link is still valid.

    def __str__(self):
        return f"Shareable link for {self.file.name} (Expires: {self.expires_at})"
