from channels.generic.websocket import WebsocketConsumer

from celery.execute import send_task
import base64, json

from .protocol.api import UserSession


class EditorConsumer(WebsocketConsumer):

    def connect(self):
        self.accept()
        self.session = UserSession(self)


    def disconnect(self, close_code):
        pass


    def receive(self, text_data=None):
        request = json.loads(text_data)
        response = self.session.process(request)
#         try:
#             encoded = base64.b64encode(content).decode('ascii')
#             result = send_task("tasks.echo", [encoded])
#             response = result.get(timeout=0.6)
#             self.send(text_data=response)
#         except:
#             print('error')
                                        
#     def receive(self, bytes_data):
#         print()
#         content = bytes_data
#         try:
#             encoded = base64.b64encode(content).decode('ascii')
#             result = send_task("tasks.echo", [encoded])
#             response = result.get(timeout=0.6)
#             self.send(text_data=response)
#         except:
#             print('error')
# sessions = {}
# 
# 
# def ws_message(message):
# 	socket = message.reply_channel
# 	session = sessions.get(socket)
# 	if session is None:
# 		session = UserSession(socket)
# 		sessions[socket] = session
# 	content = json.loads(message.content['text'])
# 	session.process(content)
# 
# 
