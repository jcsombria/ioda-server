import json

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
 
from eda.models import ProjectTemplate, Project, Element
from eda.protocol.graph import Graph

from celery import Celery

class UserSession(object):
     
    # Add 'key, data' response format
    def with_key(key='default_key'):
        def w(action):
            def f(self, *args, **kwargs):
                data = action(self, *args, **kwargs)
                #print('data: {0}'.format(data))
                return { 'key': key, 'data': data }
            return f
        return w

    
    def __init__(self, socket):
        self.socket = socket
        self.user = None
        self.project = None
        self.commands = {
            'login': self.login,
            'logout': self.logout,
            'get_projects_info': self.getProjectsInfo,
            'set_project': self.setProject,
            'edit_project': self.editProject,
            'get_workfile': self.getWorkfile,
            'save_workfile': self.saveWorkfile,
            'run_graph': self.runGraph,
#             'set_element': self.setElement,
#             'edit_element': self.editElement,
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
        ''' Used by the user to log into the system.
        
        Servers can opt for a different login mechanism. Login is prior to the server accepting any other message.
        
        Parameters
        ----------
        params
            A dict-like object that contains 'name' and 'password'
        '''
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
 
 
    @with_key(key='logout_result')
    def logout(self):
        ''' Log out of the system.
        
        Servers can opt for a different log out mechanism.
        '''
        if self.user is not None:
            # Acciones necesarias para el logout
            self.user = None
            #self.socket.close();
            return { 'result': 'ok' }
        return { 'result': 'error' }


    @with_key(key='projects_info')
    def getProjectsInfo(self):
        ''' get_projects_info
         Used to obtain the list of project types and of user projects in the server.
        '''
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
        return names

    
    @with_key(key='project')
    def setProject(self, params):
        ''' set_project
        Used to select an existing user project or create a new one.
        Setting a project using a non-existing name will effectively
        create a new project of the given type with the provided description
        
        Parameters
        ----------
        params
            A dict-like object that contains project's 'name', 'type' and 'description'.
        '''
        name = params.get('name')
        type_ = params.get('type')
        description = params.get('description')
        project = Project.objects.filter(name=name).first()
        if not project:
            project = Project.objects.create(name=name, type=type_, description=description)
        self.project = project
        
        return {
            'name': name,
            'elements': self._getElements(),
            'workfile': project.workfile,
        }

    # ONLY FOR TESTING!! The elements should be read from the database.
    def _getElements(self):
        testingElements = {
            # NOTA: Esto hay que verlo, la implementación del editor no coincide con el documento
            "groups" : [
                { "name": "Data", "image": "PythonElements/Data/icon.png"},
                { "name": "Visualization", "image": "PythonElements/Visualization/icon.png"},
                { "name": "Model", "image": "PythonElements/Model/icon.png"},
                { "name": "Evaluation", "image": "PythonElements/Evaluation/icon.png"},
                { "name" : "Program", "image": "ProgramFlow/Program/icon.png" },
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
                "Visualization.BoxPlot",
                "Visualization.TextAndValue"
            ],
            "Model" : [           
            ],
            "Evaluation" : [
            ],
            "Program" : [
                "Program.BinaryOperation",
                "Program.FunctionOneVar",
                "Program.LogicalComparison",
                "Program.NumberVariable",
                "Program.PolishCalculation"
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
            },
#             "Visualization.TextAndValue": {
#                 "name" : "HTML variable output", 
#                 "description" : "Creates or adds to an HTML div a text message and a value",
#                 "image" : "ProgramFlow/Visualization/TextAndValue/icon.png",
#                 "properties" : [
#                     {    "name" : "Text",
#                         "local_name": "Text to display",
#                         "type" : "String",
#                         "attributes" : "input|output|manual"
#                     },
#                     {    "name" : "Value",
#                         "local_name": "Second operand",
#                         "type" : "Number",
#                         "attributes" : "input|output|manual"
#                     },
#                     {    "name" : "Div",
#                         "local_name": "HTML result (as a div)",
#                         "type" : "String",
#                         "attributes" : "input|output|manual"
#                     }
#                 ]
#             },
#             "Program.BinaryOperation": {
#                 "name" : "Binary operation",
#                 "description" : "Does one of several possible binary operations",
#                 "image" : "ProgramFlow/Program/BinaryOperation/icon.png",
#                 "properties" : [
#                     {    "name" : "Operand1",
#                         "local_name": "First operand",
#                         "type" : "Number",
#                         "attributes" : "required|input|manual"
#                     },
#                     {    "name" : "Operand2",
#                         "local_name": "Second operand",
#                         "type" : "Number",
#                         "attributes" : "required|input|manual"
#                     },
#                     {    "name" : "Operation",
#                         "local_name": "Operation to apply",
#                         "type" : "OPTION['plus','minus', 'times', 'divided by']",
#                         "attributes" : "required|manual"
#                     },
#                     {    "name" : "Result",
#                         "local_name": "Operation result",
#                         "type" : "Number",
#                         "attributes" : "output"
#                     }
#                 ]
#             },
            "Program.FunctionOneVar": {
              "name" : "Function One Var",
              "image" : "ProgramFlow/Program/FunctionOneVar/icon.png"
            },
            "Program.LogicalComparison": {
                "name" : "Logical Comparison",
                "image" : "ProgramFlow/Program/LogicalComparison/icon.png"
            },
#             "Program.NumberVariable": {
#                 "name" : "Numeric Variable",
#                 "description" : "Creates and/or keeps a numeric variable",
#                 "image" : "ProgramFlow/Program/NumberVariable/icon.png",
#                 "properties" : [{
#                     "name" : "Value",
#                     "local_name": "Value",
#                     "type" : "Number",
#                     "attributes" : "required|manual|input|output"
#                 }]
#             },
            "Program.PolishCalculation": {
                "name" : "Polish Calculation",
                "image" : "ProgramFlow/Program/PolishCalculation/icon.png"
            }
        }
        elements = { e.id : {
            'name': e.name,
            'description': e.description,
            'image': e.image.name,
            'properties': e.properties,
        } for e in Element.objects.all() }
        testingElements.update(elements)
        print(testingElements)
        return testingElements
    
    @with_key(key='project')
    def editProject(self, params):
        '''  Modify an existing user project.

        Parameters
        ----------
        params
            A dict-like object that contains project's 'name', 'type' and 'description'.
        '''
        name = params.get('name')
        newname = params.get('new_name') 
        description = params.get('description')
        delete = params.get('delete')
        
        project = Project.objects.filter(name=name).first()
        if project:
            if delete:
                project.delete()
            else:
                if newname:
                    project.name = newname
                if description:
                    project.description = description
                project.save()

    @with_key(key='run_result')
    def saveWorkfile(self, params):
        # save_workfile: The client requests the server to save the current status of the work file.
        workfile = params.get('workfile')
        resources_list = params.get('resources_list')
        
        return 'NOT IMPLEMENTED'


    @with_key(key='workfile')
    def getWorkfile(self):
        # get_workfile: Used by the client to request the latest saved status of a project work file.
        if self.project:
            return { 'workfile': self.project.workfile }
        return { 'workfile_error': 'There is no active project.' }


    @with_key(key='run_result')
    def runGraph(self, params):
        ''' run_graph
        Used by the client to request the execution of a graph.
        '''
        return Graph(params).run()

# set_element: Used by the client to create a user-defined data analysis element.
# edit_element: Used by the client to edit a user-defined data analysis element.
# delete_element: Used by the client to delete a user-defined data analysis element. NOTA: Hacer como con los proyectos, edit_element incluye el delete_element.

#         threading.Thread(target=worker, args=(input,)).start()
def worker(input):
    content = json.loads(input)
    app = Celery('tasks', backend='rpc://', broker='amqp://guest:guest@rabbitmq')
    result = app.send_task("tasks.worker_Python.nodoPython", ['basicOps._operation', content])
    response = result.get()
    messageResponse = json.dumps(response, indent=4, sort_keys=True)
    if(len(messageResponse)>600):
        print(messageResponse[0:400] + '(...)')
        print(messageResponse[-200:])
    else:
        print(messageResponse)
