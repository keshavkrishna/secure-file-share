import os
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.http import JsonResponse, FileResponse
from .models import File, FileAccess, ShareableLink
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
from datetime import timedelta
from django.utils.timezone import now
from .utils import encrypt_with_public_key, decrypt_with_private_key
import base64
from users.models import Users
import mimetypes
from users.permissions import IsAdmin, IsRegularUser
from .encrypt import aes_encryption
import tempfile



class FileUploadView(APIView):
    permission_classes = [IsAuthenticated, IsRegularUser]

    def post(self, request):
        try:
            file = request.FILES["file"]
            encrypted_key = request.data["encrypted_key"]
            iv = request.data["iv"]

            if not file or not encrypted_key or not iv:
                return JsonResponse({"error": "Missing required fields"}, status=400)

            # Server-side AES encryption of the client-encrypted file
            file_content = file.read()
            server_encrypted_content = aes_encryption.encrypt_file(file_content)
            
            # Store encrypted content temporarily
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_file.write(server_encrypted_content)
                temp_path = temp_file.name

            # Encrypt client key with server public key
            server_encrypted_key = encrypt_with_public_key(bytes.fromhex(encrypted_key))

            # Create file record
            uploaded_file = File.objects.create(
                name=file.name,
                encrypted_file=None,
                server_key=server_encrypted_key,
                iv=bytes.fromhex(iv),
                owner=request.user,
                size=file.size,
            )

            # Save encrypted file
            with open(temp_path, 'rb') as temp_file:
                uploaded_file.encrypted_file.save(
                    f"{uploaded_file.id}_{file.name}", 
                    temp_file
                )

            # Cleanup
            os.unlink(temp_path)

            return JsonResponse(
                {"message": "File uploaded successfully", "file_id": uploaded_file.id},
                status=201,
            )
        except KeyError:
            return JsonResponse({"error": "Invalid request format"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

class FileDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, file_id):
        try:
            file = File.objects.get(id=file_id)

            if file.owner != request.user and not file.accesses.filter(user=request.user, can_download=True).exists():
                return JsonResponse({"error": "Access denied"}, status=403)

            # Decrypt server key
            decrypted_key = decrypt_with_private_key(file.server_key)

            # Read and decrypt with AES
            with open(file.encrypted_file.path, "rb") as encrypted_file:
                server_encrypted_data = encrypted_file.read()
                
            # Server-side AES decryption
            client_encrypted_data = aes_encryption.decrypt_file(server_encrypted_data)

            content_type, _ = mimetypes.guess_type(file.name)
            if not content_type:
                content_type = 'application/octet-stream'

            response_data = {
                "encrypted_file": base64.b64encode(client_encrypted_data).decode("utf-8"),
                "iv": base64.b64encode(file.iv).decode("utf-8"),
                "client_key": base64.b64encode(decrypted_key).decode("utf-8"),
                "original_name": file.name,
                "media_type": content_type,
            }
            return JsonResponse(response_data, status=200)
        except File.DoesNotExist:
            return JsonResponse({"error": "File not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

class FileRenderView(FileDownloadView):
    """
    Inherits from FileDownloadView since the logic is identical
    Only the frontend handling differs
    """
    pass

# class FileUploadView(APIView):
#     permission_classes = [IsAuthenticated, IsRegularUser]

#     def post(self, request):
#         try:
#             file = request.FILES["file"]
#             encrypted_key = request.data["encrypted_key"]
#             iv = request.data["iv"]

#             # Validate inputs
#             if not file or not encrypted_key or not iv:
#                 return JsonResponse({"error": "Missing required fields"}, status=400)

#             server_encrypted_key = encrypt_with_public_key(bytes.fromhex(encrypted_key))

#             uploaded_file = File.objects.create(
#                 name=file.name,
#                 encrypted_file=file,
#                 server_key=server_encrypted_key,
#                 iv=bytes.fromhex(iv),
#                 owner=request.user,
#                 size=file.size,
#             )
#             return JsonResponse(
#                 {"message": "File uploaded successfully", "file_id": uploaded_file.id},
#                 status=201,
#             )
#         except KeyError:
#             return JsonResponse({"error": "Invalid request format"}, status=400)
#         except Exception as e:
#             return JsonResponse({"error": str(e)}, status=400)

# class FileDownloadView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request, file_id):
#         try:
#             file = File.objects.get(id=file_id)

#             if file.owner != request.user and not file.accesses.filter(user=request.user, can_download=True).exists():
#                 return JsonResponse({"error": "Access denied"}, status=403)

#             decrypted_key = decrypt_with_private_key(file.server_key)


#             content_type, _ = mimetypes.guess_type(file.name)
#             if not content_type:
#                 content_type = 'application/octet-stream'

#             with open(file.encrypted_file.path, "rb") as encrypted_file:
#                 encrypted_data = encrypted_file.read()

#             response_data = {
#                 "encrypted_file": base64.b64encode(encrypted_data).decode("utf-8"),
#                 "iv": base64.b64encode(file.iv).decode("utf-8"),
#                 "client_key": base64.b64encode(decrypted_key).decode("utf-8"),
#                 "original_name": file.name,  # Include the original file name
#                 "media_type": content_type,
#             }
#             return JsonResponse(response_data, status=200)
#         except File.DoesNotExist:
#             return JsonResponse({"error": "File not found"}, status=404)
#         except Exception as e:
#             return JsonResponse({"error": str(e)}, status=400)
        
# class FileRenderView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def get(self, request, file_id):
#         try:
#             file = File.objects.get(id=file_id)

#             # Check if the user has access
#             if file.owner != request.user and not file.accesses.filter(user=request.user, can_view=True).exists():
#                 return JsonResponse({"error": "Access denied"}, status=403)

#             # Decrypt the server key using the server's RSA private key
#             decrypted_key = decrypt_with_private_key(file.server_key)


#             content_type, _ = mimetypes.guess_type(file.name)
#             if not content_type:
#                 content_type = 'application/octet-stream'

#             # Read the encrypted file
#             with open(file.encrypted_file.path, "rb") as encrypted_file:
#                 encrypted_data = encrypted_file.read()

#             # Send metadata and encrypted file for client-side decryption
#             response_data = {
#                 "encrypted_file": base64.b64encode(encrypted_data).decode("utf-8"),
#                 "iv": base64.b64encode(file.iv).decode("utf-8"),
#                 "client_key": base64.b64encode(decrypted_key).decode("utf-8"),
#                 "original_name": file.name,  # Include the original file name
#                 "media_type": content_type,
#             }
#             return JsonResponse(response_data, status=200)
#         except File.DoesNotExist:
#             return JsonResponse({"error": "File not found"}, status=404)
#         except Exception as e:
#             return JsonResponse({"error": str(e)}, status=400)




class ListUserFilesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        owned_files = File.objects.filter(owner=request.user)

        shared_files = File.objects.filter(
            accesses__user=request.user,
            accesses__can_view=True
        ).distinct()

        owned_files_data = [
            {
                "id": file.id,
                "name": file.name,
                "size": file.size,
                "uploaded_at": file.uploaded_at,
                "shareable_link": self.get_valid_shareable_link(file),
                "expires_at": self.get_shareable_link_expiry(file),
            }
            for file in owned_files
        ]

        # Prepare data for shared files
        shared_files_data = [
            {
                "id": file.id,
                "name": file.name,
                "size": file.size,
                "uploaded_at": file.uploaded_at,
                "shareable_link": self.get_valid_shareable_link(file),
                "expires_at": self.get_shareable_link_expiry(file),
            }
            for file in shared_files 
        ]

        return Response({
            "owned_files": owned_files_data,
            "shared_files": shared_files_data
        })

    def get_valid_shareable_link(self, file):
        """Returns the valid shareable link token if it exists."""
        link = file.shared_links.filter(expires_at__gt=now()).first()
        return str(link.token) if link else None

    def get_shareable_link_expiry(self, file):
        """Returns the expiration timestamp of a valid shareable link."""
        link = file.shared_links.filter(expires_at__gt=now()).first()
        return link.expires_at if link else None

# Delete File View
class FileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, file_id):
        try:
            file = File.objects.get(id=file_id)
            
            is_owner = True if request.user.id == file.owner.id else False
            guest_user = True if request.user.role == 'Guest' else False
            can_download = True
            if not is_owner:
                access = FileAccess.objects.filter(file=file, user=request.user).values("can_download")
                can_download = access[0]['can_download']
            file_details = {
                "is_owner": is_owner,
                "name": file.name,
                "size": file.size,
                "owner": file.owner.username,
                "uploaded_at": file.uploaded_at,
                "can_download": can_download,
                "guest_user": guest_user,
            }

            # Check if the requesting user is the owner
            if file.owner == request.user and not guest_user:
                # Get shared users and permissions
                shared_with = FileAccess.objects.filter(file=file).values(
                    "id","user__username", "can_view", "can_download"
                )
                shared_with_details = [
                    {
                        "id": access["id"],
                        "username": access["user__username"],
                        "can_view": access["can_view"],
                        "can_download": access["can_download"],
                    }
                    for access in shared_with
                ]
                file_details["shared_with"] = shared_with_details

                shareable_links = ShareableLink.objects.filter(file=file)
                links_details = [
                    {
                        "token": link.token,
                        "created_at": link.created_at,
                        "expires_at": link.expires_at,
                    }
                    for link in shareable_links
                ]
                file_details["shareable_links"] = links_details

            return JsonResponse(file_details, status=200)

        except File.DoesNotExist:
            return JsonResponse({"error": "File not found or unauthorized"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    def delete(self, request, file_id):
        try:
            file = File.objects.get(id=file_id, owner=request.user)
            file_path = os.path.join(settings.MEDIA_ROOT, file.encrypted_file.name)
            if os.path.exists(file_path):
                os.remove(file_path)
            file.delete()
            return JsonResponse({"message": "File deleted successfully"}, status=200)
        except File.DoesNotExist:
            return JsonResponse({"error": "File not found or unauthorized"}, status=404)

class FileAccessView(APIView):
    permission_classes = [IsAuthenticated, IsRegularUser]

    def post(self, request, file_id):
        username = request.data.get("username")
        can_download = request.data.get("can_download", False)
        user = Users.objects.get(username=username)

        try:
            file = File.objects.get(id=file_id, owner=request.user)
            file_access = FileAccess.objects.update_or_create(
                file=file,
                user_id=user.id,
                defaults={"can_download": can_download},
            )
            return JsonResponse({
                "message": "Access updated successfully", 
                'shared_with': {
                    'id': file_access[0].user.id, 
                    'username':username, 
                    'can_download': file_access[0].can_download,
                    }}
            , status=200)
        except File.DoesNotExist:
            return JsonResponse({"error": "File not found or unauthorized"}, status=404)
        
    
    def delete(self, request, file_id):
        try:
            username = request.data.get("username")
            user = Users.objects.get(username=username)
            file = File.objects.get(id=file_id, owner=request.user)
            file_acess = FileAccess.objects.filter(user=user, file=file)
            file_acess.delete()
            return JsonResponse({"message": "Access revoked successfully"}, status=200)
        except File.DoesNotExist:
            return JsonResponse({"error": "File not found or unauthorized"}, status=404)
        except Exception as e:
            return JsonResponse({"error": "An error occured"}, status=500)

# Generate Shareable Link View
class GenerateShareableLinkView(APIView):
    permission_classes = [IsAuthenticated, IsRegularUser]

    def post(self, request, file_id):
        try:
            file = File.objects.get(id=file_id)

            # Ensure only the owner can generate shareable links
            if file.owner != request.user:
                return JsonResponse({"error": "Access denied"}, status=403)

            ShareableLink.objects.filter(file=file).delete()
            # Create a shareable link
            expiration_time = now() + timedelta(hours=1)
            link = ShareableLink.objects.create(file=file, expires_at=expiration_time)

            return JsonResponse({"token": f"{link.token}", "expires_at": link.expires_at, "created_at": link.created_at}, status=201)
        except File.DoesNotExist:
            return JsonResponse({"error": "File not found"}, status=404)
    
    def delete(self, request, file_id):
        try:
            data = request.data
            token = data.get('token')
            ShareableLink.objects.filter(token=token).delete()
            return JsonResponse({}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return JsonResponse({"error": "File not found"}, status=404)
     
# Access Shared File View
class AccessSharedFileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, token):
        try:
            link = ShareableLink.objects.get(token=token)
            if not link.is_valid():
                return JsonResponse({"error": "Link expired or invalid"}, status=403)

            # Retrieve the file owned by the requesting user
            file = link.file
            
            is_owner = True if request.user.id == file.owner.id else False
            guest_user = True if request.user.role == 'Guest' else False
            can_download = True

            file_details = {
                "is_owner": is_owner,
                "name": file.name,
                "size": file.size,
                "owner": file.owner.username,
                "uploaded_at": file.uploaded_at,
                "can_download": can_download,
                "guest_user": guest_user,
                "file_id": file.id,
            }

            # Check if the requesting user is the owner
            if file.owner == request.user and not guest_user:
                # Get shared users and permissions
                shared_with = FileAccess.objects.filter(file=file).values(
                    "id","user__username", "can_view", "can_download"
                )
                shared_with_details = [
                    {
                        "id": access["id"],
                        "username": access["user__username"],
                        "can_view": access["can_view"],
                        "can_download": access["can_download"],
                    }
                    for access in shared_with
                ]
                file_details["shared_with"] = shared_with_details

                # Get shareable link details
                shareable_links = ShareableLink.objects.filter(file=file)
                links_details = [
                    {
                        "token": link.token,
                        "created_at": link.created_at,
                        "expires_at": link.expires_at,
                    }
                    for link in shareable_links
                ]
                file_details["shareable_links"] = links_details

            return JsonResponse(file_details, status=200)

        except File.DoesNotExist:
            return JsonResponse({"error": "File not found or unauthorized"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
