from django.urls import re_path

from eda import consumers

websocket_urlpatterns = [
    re_path(r'ws/ioda/(?P<job_name>\w+)/$', consumers.EditorConsumer.as_asgi()),
#     re_path(r'ws/ioda/(?P<job_name>\w+)/$', consumers.EditorConsumer.as_asgi()),
]