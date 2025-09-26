from django.contrib import admin
from django.urls import include, path
from django.shortcuts import redirect
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
import os
from alerts.views import user_dashboard, admin_dashboard

urlpatterns = [
    path('admin/', admin.site.urls),
    path('alerts/', include('alerts.urls')),
    path('', lambda request: redirect('/frontend/index.html')),
    path('user_dashboard/', user_dashboard),
    path('admin_dashboard/', admin_dashboard),

]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += [
         path('frontend/<path:path>', serve, {'document_root': os.path.join(settings.BASE_DIR, 'frontend')}),
    ]
