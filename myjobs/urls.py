from django.conf.urls import include
from django.urls import path, re_path
from django.contrib import admin
import jobs
from jobs import views

urlpatterns = [
    path('login/', jobs.views.login_view),
    re_path(r'^logout/', jobs.views.logout_view),
    re_path(r'^account/create/', jobs.views.create_account),
    path('', jobs.views.home_page),

    path('jobs/', include('jobs.urls')),
    path('api/', include('eda.urls')),
    path('admin/', admin.site.urls),
]