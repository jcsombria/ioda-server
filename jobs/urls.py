from django.urls import re_path, path
from . import views

urlpatterns = [
    re_path(r'^available', views.available_jobs),
    re_path(r'^running', views.running_jobs),
    re_path(r'^finished', views.finished_jobs),
    path('interactive/submit/<job_name>/', views.InteractiveTask.as_view()),
    re_path(r'^submit', views.submit_job),
    re_path(r'^cancel', views.cancel_job),
    re_path(r'^get', views.get_job_results),
# Url para notificar los resultados y finalización de tareas en nodos de computo   
#    path('notify/', views.InteractiveTask.as_view()), # pasar token, node_id + result
]