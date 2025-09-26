from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models
from django.contrib.auth.models import User
from .models import Alert, NotificationDelivery, UserAlertPreference, Team, UserProfile
from .serializers import AlertSerializer
from rest_framework.views import APIView
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.http import require_GET
from django.http import JsonResponse

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
            models.Q(visibility='TEAM', teams__in=[user.profile.team]) | 
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
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not username or not email or not password:
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({'username': ['Username already exists']}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({'email': ['Email already exists']}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.create_user(username=username, email=email, password=password)
        return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

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

@staff_member_required
def admin_dashboard(request):
    return render(request, 'alerts/admin_dashboard.html')

@staff_member_required
@require_GET
def admin_dashboard_analytics(request):
    total_alerts = Alert.objects.count()
    delivered = NotificationDelivery.objects.count()
    read = UserAlertPreference.objects.filter(read=True).count()
    snoozed = UserAlertPreference.objects.exclude(snoozed_on=None).count()

    return JsonResponse({
        "total_alerts": total_alerts,
        "delivered": delivered,
        "read": read,
        "snoozed": snoozed,
    })

@staff_member_required
@require_GET
def admin_dashboard_alerts(request):
    alerts = Alert.objects.all().values(
        'id', 'title', 'severity', 'visibility', 'is_active', 'archived'
    )
    return JsonResponse(list(alerts), safe=False)

@staff_member_required
@require_GET
def admin_dashboard_teams(request):
    teams = []
    for team in Team.objects.all():
        users_in_team = UserProfile.objects.filter(team=team).select_related('user')
        members = [u.user.username for u in users_in_team]
        teams.append({
            "id": team.id,
            "name": team.name,
            "members": members,
        })
    return JsonResponse(teams, safe=False)