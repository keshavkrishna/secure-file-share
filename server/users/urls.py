from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    TOTPSetupView,
    MFAValidationView,
    ValidateTokenView, 
    AdminUserViews
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('<int:user_id>/mfa/setup/', TOTPSetupView.as_view(), name='mfa_setup'),
    path('<int:user_id>/mfa/validate/', MFAValidationView.as_view(), name='mfa_validate'),
    path("validate-token/", ValidateTokenView.as_view(), name="validate-token"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path('admin/', AdminUserViews.as_view(), name='admin'),
    path('admin/<int:user_id>', AdminUserViews.as_view(), name='admin-user'),
]
