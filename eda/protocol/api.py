from django.contrib.auth import authenticate

import json
import time

from eda.models import ProjectTemplate, Project

class UserSession(object):
  
    def __init__(self, socket):
        self.socket = socket
        self.user = None
        self.commands = {
            'login': self._login,
            'logout': self._logout,
            'code': self.code,
            'run': self.run,
        }
    
    def process(self, message):
        ''' Process an incoming message.

        Parameters
        ----------
        message
            An user request (see IODA protocol spec.)
        '''
        command = message.get('key')
        method = self.commands.get(command)
        result = { 'result': 'true' }
        if command is not None:
            params = message.get('data')
            try:
                result = method(params)
            except:
                result = { 'result': 'incorrect arguments'}
        self.socket.send({
          "text": json.dumps(result),
        })
    

    def _login(self, params):
        try:
            result = self.login(**params)
        except:
            if not params.get('username'):
                result = 'no_username'
            result = 'wrong_password'
        return {
            'key': 'login_result',
            'data': result
        }

        
    def login(self, username, password):
        user = authenticate(username=username, password=password)
        if not user:
            return { 'result': 'wrong_password' }

        if self.user == user:
            return { 'result': 'already_connected'}

        self.user = user
        return {
            'result': 'ok', #Logged as user %s.' % username,
            'project_types': self._getProjectTemplates(),
            'project_list': self._getProjects(),
        }

    
    def _getProjectTemplates(self):
        templates = ProjectTemplate.objects.all()
        names = [t.name for t in templates]
        return '[%s]' % ', '.join(names)

    
    def _getProjects(self):
        try:
            projects = Project.objects.all()
            names = [p.name for p in projects]
        except Project.DoesNotExist:
            names = []
        names.append('new')
        return '[%s]' % ', '.join(names)
    
    
    def _logout(self, params):
        try:
            result = self.logout()
        except:
            result = 'logout_exception'
        return {
            'key': 'login_result',
            'data': result
        }


    def logout(self):
        if self.user is not None:
            # Acciones necesarias para el logout
            self.user = None
            #self.socket.close();
            return { 'result': 'ok' }
        return { 'result': 'not_connected' }

    
    def code(self, dummy):
        return "code ok"

    
    def run(self, dummy):
        time.sleep(10)
        return "run ok"

    
    def load(self, project):
        pass

    
    def save(self, project):
        pass