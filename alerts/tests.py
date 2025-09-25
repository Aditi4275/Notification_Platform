from django.test import TestCase
from .models import Alert
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
            start_time="2024-01-01T00:00:00Z",
            expiry_time="2024-01-02T00:00:00Z",
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
        # Test would continue with API call to get user alerts