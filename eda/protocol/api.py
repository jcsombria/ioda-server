import json
import time

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from eda.models import ProjectTemplate, Project


class UserSession(object):
     
    # Add 'key, data' response format
    def with_key(key='default_key'):
        def w(action):
            def f(self, *args, **kwargs):
                data = action(self, *args, **kwargs)
                print('data: {0}'.format(data))
                return { 'key': key, 'data': data }
            return f
        return w

    
    def __init__(self, socket):
        self.socket = socket
        self.user = None
        self.commands = {
            'login': self.login,
            'logout': self.logout,
            'get_projects_info': self.getProjectsInfo,
#             'set_project': 
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
                print(params)
                if params:
                    result = method(params)
                else:
                    result = method()
            except:
                result = { 'result': 'incorrect arguments'}
        self.socket.send(text_data=json.dumps(result))

    @with_key('login_result')
    def login(self, params):
        username = params.get('name')
        password = params.get('password')

        if not username:
            return { 'result': 'no_username' }

        user = authenticate(username=username, password=password)
        if not user:
            if User.objects.filter(username=username).exists():
                return { 'result': 'wrong_password' }
            return { 'result': 'unknown_username' }
        elif self.user == user:
            return { 'result': 'already_connected'}

        return {
            'result': 'ok', #Logged as user %s.' % username,
            'project_types': self._getProjectTemplates(),
            'project_list': self._getProjects(),
        }
 

    @with_key(key='projects_info')
    def getProjectsInfo(self):
        return {
            'project_types': self._getProjectTemplates(),
            'project_list': self._getProjects(),
        }
    
    def _getProjectTemplates(self):
        templates = ProjectTemplate.objects.all()
        names = [t.name for t in templates]
        # Testing
        names = [{
            'type' : 'python',
            'image': 'data/images/data_analysis.png', 
            'description':'Generic Data analysis in Python'
        }, {
            'type': 'python-series',
            'image': 'data/images/time_series.png',
            'description': 'Time-Series analysis in Python',
        }]
        return names # '[%s]' % ', '.join(names)

    
    def _getProjects(self):
        try:
            projects = Project.objects.all()
            names = [p.name for p in projects]
            # Testing
            names = [{
                'name': 'MyFirstDataAnalysis', 
                'type': 'python', 
                'description': 'This is my first data analysis example' 
            }, { 
                'name': 'MySecondDataAnalysis', 
                'type': 'python',  
                'description': 'This is a second analysis example' 
            }, {
                'name': 'ATimeSeriesAnalysis',
                'type': 'python-series', 
                'description': 'A time series example' 
            }]
        except Project.DoesNotExist:
            names = []
        return names #'[%s]' % ', '.join(names)
    
    
    def _logout(self, params):
        try:
            result = self.logout()
        except:
            result = 'logout_exception'
        return {
            'key': 'login_result',
            'data': result
        }


    @with_key(key='logout_result')
    def logout(self):
        if self.user is not None:
            # Acciones necesarias para el logout
            self.user = None
            #self.socket.close();
            return { 'result': 'ok' }
        return { 'result': 'error' }
