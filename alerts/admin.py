from django.contrib import admin
from .models import Alert, Team, NotificationDelivery, UserAlertPreference

# Register your models here.

admin.site.register(Alert)
admin.site.register(Team)
admin.site.register(NotificationDelivery)
admin.site.register(UserAlertPreference)