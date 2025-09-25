from django.urls import path, include
from rest_framework import routers
from rest_framework.routers import DefaultRouter
from .views import AlertViewSet, UserAlertViewSet, AnalyticsView

router = DefaultRouter()
router.register(r'admin', AlertViewSet, basename='alert-admin')
router.register(r'user', UserAlertViewSet, basename='alert-user')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/', AnalyticsView.as_view(), name='alert-analytics'),
    path('accounts/', include('django.contrib.auth.urls')),
]
