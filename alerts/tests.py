from django.test import TestCase
from django.utils import timezone
from django.contrib.auth.models import User
from datetime import timedelta
from .models import Alert, Team, UserProfile

# Create your tests here.

class AlertModelTest(TestCase):
    def setUp(self):
        self.team = Team.objects.create(name="Test Team")
        self.user = User.objects.create_user(username='testuser', email='test@example.com')
        self.user_profile = UserProfile.objects.create(user=self.user, team=self.team)

    def test_alert_creation(self):
        alert = Alert.objects.create(
            title="Test",
            message="Test message",
            severity="INFO",
            start_time=timezone.now(),
            expiry_time=timezone.now() + timedelta(days=1),
            visibility="ORG"
        )
        self.assertTrue(isinstance(alert, Alert))
        
    def test_get_user_alerts(self):
        """Test getting user-specific alerts"""
        alert = Alert.objects.create(
            title="User Alert",
            message="Test message",
            severity="INFO",
            start_time=timezone.now(),
            expiry_time=timezone.now() + timedelta(hours=1),
            visibility="USER",
        )
        alert.users.add(self.regular_user)
        
        self.client.login(username='regular', password='regularpass')
