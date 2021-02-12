from django.contrib.auth.models import User
from django.test import TestCase
from django.models import User
from .protocol.api import UserSession

 
# Create your tests here.
class IodaProtocolTest(TestCase):

    def setUp(self):
        TestCase.setUp(self)
        
        self.username = 'test'
        self.password = 'test'
        User.objects.create(username=self.username,password=self.password)
        self.api = UserSession()
    
    
    def test_user_can_login(self):
        response = self.api.login(self.username, self.password)
        print(response)
        

    
    
    
    