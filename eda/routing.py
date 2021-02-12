from django.urls import re_path

from eda import consumers

websocket_urlpatterns = [
    re_path(r'ws/api/(?P<job_name>\w+)/$', consumers.EditorConsumer.as_asgi()),
]