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
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.http import require_GET
from django.http import JsonResponse
from rest_framework.parsers import JSONParser

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
        
        # Get query parameters
        severity = request.query_params.get('severity', None)
        
        # Base query for alerts
        alerts_queryset = Alert.objects.filter(is_active=True, archived=False).filter(
            models.Q(visibility='ORG') | 
            models.Q(visibility='TEAM', teams__in=[user.profile.team]) | 
            models.Q(visibility='USER', users=user)
        ).distinct()
        
        # Apply severity filter if provided
        if severity:
            alerts_queryset = alerts_queryset.filter(severity=severity)
        
        # Get user preferences for these alerts
        alert_ids = alerts_queryset.values_list('id', flat=True)
        prefs = UserAlertPreference.objects.filter(user=user, alert_id__in=alert_ids)
        prefs_dict = {pref.alert_id: pref for pref in prefs}
        
        # Serialize alerts with read status
        serialized_alerts = []
        for alert in alerts_queryset:
            pref = prefs_dict.get(alert.id)
            serialized_alerts.append({
                'id': alert.id,
                'title': alert.title,
                'message': alert.message,
                'severity': alert.severity,
                'start_time': alert.start_time,
                'expiry_time': alert.expiry_time,
                'read': pref.read if pref and pref.read else False,
                'snoozed': pref.snoozed_on == timezone.now().date() if pref and pref.snoozed_on else False
            })
        
        return Response(serialized_alerts)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def snooze(self, request, pk=None):
        user = request.user
        try:
            alert = Alert.objects.get(pk=pk)
            pref, _ = UserAlertPreference.objects.get_or_create(user=user, alert=alert)
            pref.snoozed_on = timezone.now().date()
            pref.save()
            return Response({'snoozed': True})
        except Alert.DoesNotExist:
            return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def mark_read(self, request, pk=None):
        user = request.user
        try:
            alert = Alert.objects.get(pk=pk)
            pref, _ = UserAlertPreference.objects.get_or_create(user=user, alert=alert)
            pref.read = not pref.read
            pref.save()
            return Response({'read': pref.read})
        except Alert.DoesNotExist:
            return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)


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

    alerts = Alert.objects.filter(
        is_active=True,
        archived=False,
        expiry_time__gt=timezone.now()
    ).filter(
        models.Q(visibility='ORG') |
        models.Q(visibility='TEAM', teams__in=[user.profile.team]) |
        models.Q(visibility='USER', users=user)
    ).distinct()

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


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    
    if request.method == 'GET':
        try:
            profile_data = {
                'name': user.get_full_name() or user.username,
                'email': user.email,
                'username': user.username,
                'team': getattr(user.profile, 'team', None) and user.profile.team.name or ''
            }
            return Response(profile_data)
        except Exception as e:
            return Response({'error': 'Failed to fetch profile'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'PATCH':
        # Update user profile information
        try:
            if 'name' in request.data:
                name_parts = request.data['name'].split(' ', 1)
                user.first_name = name_parts[0]
                user.last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            if 'email' in request.data:
                user.email = request.data['email']
            
            user.save()
            
            if 'team' in request.data and hasattr(user, 'profile'):
                # For simplicity, we'll just return success without actually changing team
                # In a real implementation, you might want to handle team changes differently
                pass
            
            return Response({'message': 'Profile updated successfully'})
        except Exception as e:
            return Response({'error': 'Failed to update profile'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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