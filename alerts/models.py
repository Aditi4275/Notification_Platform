from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class Team(models.Model):
    name = models.CharField(max_length=100)

class Alert(models.Model):
    SEVERITY_CHOICES = [
        ('INFO', 'info'),
        ('WARNING', 'warning'),
        ('CRITICAL', 'critical'),
    ]
    VISIBILITY_CHOICES = [
        ('ORG', 'Organization'),
        ('TEAM', 'Team'),
        ('USER', 'User'),
    ]
    title = models.CharField(max_length=200)
    message = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    start_time = models.DateTimeField()
    expiry_time = models.DateTimeField()
    reminder_frequency = models.IntegerField(default=2)
    delivery_type = models.CharField(max_length=10, default='INAPP')
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES)
    teams = models.ManyToManyField(Team, blank=True)
    users = models.ManyToManyField(User, blank=True)
    is_active = models.BooleanField(default=True)
    archived = models.BooleanField(default=False)

class NotificationDelivery(models.Model):
    alert = models.ForeignKey(Alert, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    delivered_at = models.DateTimeField(auto_now_add=True)

class UserAlertPreference(models.Model):
    alert = models.ForeignKey(Alert, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    snoozed_on = models.DateTimeField(null=True, blank=True)
    read = models.BooleanField(default=False)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.user.username