import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'notification_platform.settings')

app = Celery('notification_platform')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()

# Broker URL from environment variable or default to Redis
app.conf.broker_url = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
app.conf.result_backend = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

app.conf.task_always_eager = os.getenv('CELERY_ALWAYS_EAGER', 'False').lower() == 'true'