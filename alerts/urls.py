from django.urls import path, include
from rest_framework import routers
from rest_framework.routers import DefaultRouter
from .views import AlertViewSet, UserAlertViewSet, AnalyticsView, register_user, user_profile

router = DefaultRouter()
router.register(r'admin', AlertViewSet, basename='alert-admin')
router.register(r'user', UserAlertViewSet, basename='alert-user')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/', AnalyticsView.as_view(), name='alert-analytics'),
    path('register/', register_user, name='register'),
    path('user/profile/', user_profile, name='user-profile'),
    path('accounts/', include('django.contrib.auth.urls')),
]
