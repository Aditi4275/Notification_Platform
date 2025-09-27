from django.urls import path, include
from rest_framework import routers
from rest_framework.routers import DefaultRouter
from .views import AlertViewSet, UserAlertViewSet, AnalyticsView, register_user, user_profile, admin_dashboard_analytics, admin_dashboard_teams

router = DefaultRouter()
router.register(r'admin', AlertViewSet, basename='alert-admin')
router.register(r'user', UserAlertViewSet, basename='alert-user')

urlpatterns = [
    path('admin/analytics/', admin_dashboard_analytics, name='admin-dashboard-analytics'),
    path('admin/teams/', admin_dashboard_teams, name='admin-dashboard-teams'),
    path('analytics/', AnalyticsView.as_view(), name='alert-analytics'),
    path('register/', register_user, name='register'),
    path('user/profile/', user_profile, name='user-profile'),
    path('', include(router.urls)),
    path('accounts/', include('django.contrib.auth.urls')),
]
