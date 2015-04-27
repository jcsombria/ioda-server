from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'ciemat_web.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    url(r'^login/', 'jobs.views.login_view', name='login'),
    url(r'^logout/', 'jobs.views.logout_view', name='logout'),
    url(r'^account/create/', 'jobs.views.create_account', name='create_account'),
    url(r'^jobs/available', 'jobs.views.available_jobs', name='available_jobs'),
    url(r'^jobs/running', 'jobs.views.running_jobs', name='running_jobs'),
    url(r'^jobs/submit', 'jobs.views.submit_job', name='submit_job'),
    url(r'^jobs/cancel', 'jobs.views.cancel_job', name='cancel_job'),
    url(r'^jobs/get', 'jobs.views.get_job_results', name='get_job_results'),
    url(r'^$', 'jobs.views.home_page', name='home'),
    url(r'^admin/', include(admin.site.urls)),
)
