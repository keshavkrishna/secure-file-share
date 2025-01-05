from django.urls import path
from . import views

urlpatterns = [
    # File Management
    path('upload/', views.FileUploadView.as_view(), name='file-upload'),  # File Upload
    path('', views.ListUserFilesView.as_view(), name='list-user-files'),  # List User Files
    path('<int:file_id>/download/', views.FileDownloadView.as_view(), name='file-download'),  # File Download
    path('<int:file_id>/render/', views.FileRenderView.as_view(), name='file-render'),
    path('<int:file_id>/', views.FileView.as_view(), name='file'),  

    # File Access Control
    path('<int:file_id>/access/', views.FileAccessView.as_view(), name='file-access'),  # Grant/Revoke Access

    # Secure File Sharing
    path('<int:file_id>/shareable-link/', views.GenerateShareableLinkView.as_view(), name='generate-shareable-link'),  # Generate Shareable Link
    path('shared/<uuid:token>/', views.AccessSharedFileView.as_view(), name='access-shared-file'),  # Access Shared File
]
