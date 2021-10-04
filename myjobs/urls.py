from django.conf.urls import include
from django.urls import path, re_path
from django.contrib import admin
import jobs
from jobs import views

urlpatterns = [
    path('login/', jobs.views.login_view, name='login'),
    re_path(r'^logout/', jobs.views.logout_view, name='logout'),
    re_path(r'^account/create/', jobs.views.create_account),
    path('', jobs.views.home_page, name='home'),
    path('/profile', jobs.views.home_page, name='profile'),

    path('jobs/', include('jobs.urls')),
    path('ioda/', include('eda.urls')),
    path('admin/', admin.site.urls),
]