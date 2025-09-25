from celery import shared_task
from django.utils import timezone
from .models import Alert, UserAlertPreference

@shared_task
def send_periodic_alert_reminders():
    now = timezone.now()
    alerts = Alert.objects.filter(is_active=True, archived=False, expiry_time__gt=now)
    for alert in alerts:
        users = alert.users.all()
        for user in users:
            pref, _ = UserAlertPreference.objects.get_or_create(alert=alert, user=user)
            if pref.snoozed_on != now.date():
                # Integrate your own notification delivery here
                print(f"Remind {user.username}: {alert.title}")
