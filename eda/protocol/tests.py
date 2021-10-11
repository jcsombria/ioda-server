from django.test import TestCase
from django.contrib.auth.models import User

import json

from . import UserSession

class DummySocket():
    
    def __init__(self):
        self.response = ''
    
    def send(self, msg):
        self.response = msg

class IodaProtocolTest(TestCase):
    
    def setUp(self):
        TestCase.setUp(self)
        self.socket = DummySocket()
        self.api = UserSession(self.socket)
        self.username = 'test'
        self.password = 'test'
        User.objects.create_user(self.username, '', self.password)
    

    def test_login_correct(self):
        ''' Test login is correct. 
        
        The expected result is a JSON structure with the following fields:
           {
             'result': 'ok',
             'project_types': typesArray,
             'project_list': projectsArray
           }
        '''
        expected = { 'result': 'ok' }
        request = {
            'key': 'login', 
            'data': {
                'username': self.username,
                'password': self.password
            }
        }
        self.api.process(request)
        response = json.loads(self.socket.response['text'])
        self.assertDictContainsSubset(expected, response, '{result: "ok" not found in response.')

        
    def test_login_user_already_connected(self):
        expected = { 'result': 'already_connected' }
        request = {
            'key': 'login', 
            'data': {
                'username': self.username,
                'password': self.password
            }
        }
        self.api.process(request)
        self.api.process(request)
        response = json.loads(self.socket.response['text'])
        self.assertDictContainsSubset(expected, response, '{result: "already_connected" not found in response.')
         
  
    def test_login_no_user(self):
        expected = { 'result': 'no_username' }
        request = {
            'key': 'login', 
            'data': {
                'password': self.password
            }
        }
        self.api.process(request)
        response = json.loads(self.socket.response['text'])
        print('Response: %s' % response)
        self.assertDictContainsSubset(expected, response, '{result: "no_username" not found in response.')
  
    def test_login_wrong_password(self):
        expected = { 'result': 'wrong_password' }
        request = {
            'key': 'login', 
            'data': {
                'username': self.username,
                'password': '#' + self.password + '#'
            }
        }
        self.api.process(request)
        response = json.loads(self.socket.response['text'])
        print('Response: %s' % response)
        self.assertDictContainsSubset(expected, response, '{result: "wrong_password" not found in response.')

#     def test_logout(self):
#         self.fail('Not Implemented')
# 
#     def test_set_project(self):
#         self.fail('Not Implemented')
# 
#     def test_save_workfile(self):
#         self.fail('Not Implemented')
# 
#     def test_read_workfile(self):
#         self.fail('Not Implemented')
# 
#     def test_code_graph(self):
#         self.fail('Not Implemented')
#     
#     def test_run_graph(self):
#         self.fail('Not Implemented')
#     
#     def test_code_file(self):
#         self.fail('Not Implemented')
#     
#     def test_run_code(self):
#         self.fail('Not Implemented')
#     
#     def test_user_element(self):
#         self.fail('Not Implemented')
