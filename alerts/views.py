from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from .models import Alert, UserAlertPreference
from .serializers import AlertSerializer
from rest_framework.views import APIView
from django.contrib.auth.decorators import login_required
from django.shortcuts import render

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAdminUser]

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.archived = True
        obj.is_active = False
        obj.save()
        return Response({'archived': True}, status=status.HTTP_200_OK)

class UserAlertViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        user = request.user
        today = timezone.now().date()
        alerts = Alert.objects.filter(is_active=True, archived=False).filter(
            models.Q(visibility='ORG') | 
            models.Q(visibility='TEAM', teams__in=[user.team]) | 
            models.Q(visibility='USER', users=user)
        ).distinct()
        return Response(AlertSerializer(alerts, many=True).data)

    @action(detail=True, methods=['post'])
    def snooze(self, request, pk=None):
        user = request.user
        alert = Alert.objects.get(pk=pk)
        pref, _ = UserAlertPreference.objects.get_or_create(user=user, alert=alert)
        pref.snoozed_on = timezone.now().date()
        pref.save()
        return Response({'snoozed': True})

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, pk=None):
        user = request.user
        alert = Alert.objects.get(pk=pk)
        pref, _ = UserAlertPreference.objects.get_or_create(user=user, alert=alert)
        pref.read = not pref.read
        pref.save()
        return Response({'read': pref.read})


class AnalyticsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        # Return analytics summary
        return Response({
            # metrics here
        })
@login_required
def user_dashboard(request):
    user = request.user
    today = timezone.now().date()

    # Fetch active alerts visible to this user (org/team/user)
    alerts = Alert.objects.filter(
        is_active=True,
        archived=False,
        expiry_time__gt=timezone.now()
    ).filter(
        models.Q(visibility='ORG') |
        models.Q(visibility='TEAM', teams__in=[user.profile.team]) |
        models.Q(visibility='USER', users=user)
    ).distinct()

    # Get prefs for alerts shown to mark snooze/read
    prefs = UserAlertPreference.objects.filter(user=user, alert__in=alerts)
    prefs_map = {p.alert_id: p for p in prefs}

    alerts_with_status = []
    for alert in alerts:
        pref = prefs_map.get(alert.id)
        alerts_with_status.append({
            'alert': alert,
            'snoozed': pref.snoozed_on == today if pref else False,
            'read': pref.read if pref else False,
        })

    return render(request, 'alerts/user_dashboard.html', {
        'alerts_with_status': alerts_with_status,
    })