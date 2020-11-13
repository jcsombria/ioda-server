from django.urls import include, path, re_path
from django.contrib import admin
import jobs
from jobs import views

urlpatterns = [
    # Examples:
    # url(r'^$', include('ciemat_web.views.home', namespace='home')),
    path('login/', jobs.views.login_view),
    re_path(r'^logout/', views.logout_view),
    re_path(r'^account/create/', jobs.views.create_account),
    re_path(r'^jobs/available', jobs.views.available_jobs),
    re_path(r'^jobs/running', jobs.views.running_jobs),
    re_path(r'^jobs/finished', jobs.views.finished_jobs),
    re_path(r'^jobs/submit', jobs.views.submit_job),
    re_path(r'^jobs/cancel', jobs.views.cancel_job),
    re_path(r'^jobs/get', jobs.views.get_job_results),
    path('', jobs.views.home_page),
    path('admin/', admin.site.urls),
]
