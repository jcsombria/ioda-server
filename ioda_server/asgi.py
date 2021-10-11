import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import eda.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ioda_server.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            eda.routing.websocket_urlpatterns
        )
    ),
})