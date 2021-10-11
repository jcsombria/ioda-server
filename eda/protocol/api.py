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
            'set_project': self.setProject,            
            'run_graph': self.runGraph, 
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

        return { 'result': 'ok' }
 

    @with_key(key='projects_info')
    def getProjectsInfo(self):
        return {
            'project_types': self._getProjectTemplates(),
            'project_list': self._getProjects(),
        }
    
    def _getProjectTemplates(self):
        templates = ProjectTemplate.objects.all()
        names = [{'type':t.name, 'image': t.image.name, 'description': t.description} for t in templates]
        return names # '[%s]' % ', '.join(names)

    
    def _getProjects(self):
        try:
            projects = Project.objects.all()
            names = [{'name': p.name, 'type':p.type.name, 'description': p.description} for p in projects]
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

    @with_key(key='project')
    def setProject(self, params):
        name = params.get('name')
        type = params.get('type')
        description = params.get('description')
        project = Project.objects.filter(name=name).first()
        if not project:
            Project.objects.create(name=name, type=type, description=description)
        return {
            'name': name,
            'elements': self._getElements(),
            'workfile': '',
        }

    # ONLY FOR TESTING!! The elements should be read from the database.
    def _getElements(self):
        return {
            "Path" : "PythonElements",
            # NOTA: Esto hay que verlo, la implementación del editor no coincide con el documento
            "groups" : [
                {"name": "Data", "image": "PythonElements/Data/icon.png"},
                {"name": "Visualization", "image": "PythonElements/Visualization/icon.png"},
                {"name": "Model", "image": "PythonElements/Model/icon.png"},
                {"name": "Evaluation", "image": "PythonElements/Evaluation/icon.png"}
            ],
            "Data" : [
                "Data.FileLoader",
                "Data.DataBaseLoader",
                "Data.CloudLoader",
                "Data.DataCleaner",
                "Data.FeatureSelector",
                "Data.DataMerger",
                "Data.DataSaver"
            ],
            "Visualization" :[
                "Visualization.DataTable",
                "Visualization.PairPlot",
                "Visualization.ScatterPlot",
                "Visualization.BoxPlot"
            ],
            "Model" : [           
            ],
            "Evaluation" : [
            ],
            "Data.DataCleaner" : {
                "name" : "Data Cleaner",
                "description" : "Removes or fills empty data",
                "image" : "PythonElements/Data/DataCleaner/icon.png"
            },          
            "Data.FileLoader" : {
              "name" : "File Loader",
              "description" : "Load data from a file",
            "image" : "PythonElements/Data/FileLoader/icon.png"
            },
            
            "Data.DataBaseLoader": {
              "name" : "DataBase Loader",
              "description" : "Load data from a DB",
              "image" : "PythonElements/Data/DataBaseLoader/icon.png"
            },
            "Data.CloudLoader": {
              "name" : "Cloud Loader",
              "description" : "Load data from the Cloud",
              "image" : "PythonElements/Data/CloudLoader/icon.png"
            },
            "Data.FeatureSelector": {
              "name" : "Feature Selector",
              "description" : "Selects features from data",
              "image" : "PythonElements/Data/FeatureSelector/icon.png"
            },
            "Data.DataMerger": {
              "name" : "Data Merger",
              "description" : "Merges sets of data",
              "input" : "DataFrame,Series",
              "image" : "PythonElements/Data/DataMerger/icon.png"
            },
            "Data.DataSaver": {
              "name" : "Data Saver",
              "description" : "Saves data to disk",
              "image" : "PythonElements/Data/DataSaver/icon.png"
            },
            
            "Visualization.DataTable": {
              "name" : "Data Table",
              "description" : "Shows data in table",
              "image" : "PythonElements/Visualization/DataTable/icon.png"
            },
            "Visualization.PairPlot": {
              "name" : "Pair Plot",
              "description" : "Shows pair plot of data",
              "image" : "PythonElements/Visualization/PairPlot/icon.png"
            },
            "Visualization.ScatterPlot": {
              "name" : "Scatter Plot",
              "description" : "Shows scatter plot of data",
              "image" : "PythonElements/Visualization/ScatterPlot/icon.png"
            },
            "Visualization.BoxPlot": {
              "name" : "Box Plot",
              "description" : "Shows box plot of data",
              "image" : "PythonElements/Visualization/BoxPlot/icon.png"
            }            
        }

    @with_key(key='run_result')
    def runGraph(self):
        return { 'result': 'error' }