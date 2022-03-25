import base64
import json
import os
from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
 
from eda.models import ProjectTemplate, Project, DefaultElement, UserElement, DefaultElementGroup, UserElementGroup, Element
from eda.protocol.graph import Graph

from celery import Celery
from dataclasses import dataclass, field
from typing import Protocol

class UserSession(object):
     
    # Add 'key, data' response format
    def with_key(key='default_key'):
        def w(action):
            def f(self, *args, **kwargs):
                data = action(self, *args, **kwargs)
                # print('data: {0}'.format(data))
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
            'user_elements': self.setElement,
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
        if not method:
            return self.socket.send(text_data=json.dumps({
                { 'result': 'Unknown command' }
            }))
        params = message.get('data')
        if params:
            result = method(params)
        else:
            result = method()
        # result = { 'result': 'incorrect arguments'}
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
        self.user = user
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
        return names

    
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
            'elements': {
                'groups': self._getGroups(),
                'elements': self._getElements()
            },
            'user_elements': {
                'groups': self._getUserGroups(),
                'elements': self._getUserElements()
            },
            'workfile': project.workfile,
        }

    def _getGroups(self):
        # groups = [{
        #         "name": "Data",
        #         "image": "PythonElements/Data/icon.png",
        #         "elements": [
        #             "Data.FileLoader",
        #             "Data.DataBaseLoader",
        #             "Data.CloudLoader",
        #             "Data.DataCleaner",
        #             "Data.FeatureSelector",
        #             "Data.DataMerger",
        #             "Data.DataSaver"
        #         ]
        #     }, {
        #         "name": "Visualization",
        #         "image": "PythonElements/Visualization/icon.png",
        #         "elements": [
        #             "Visualization.DataTable",
        #             "Visualization.PairPlot",
        #             "Visualization.ScatterPlot",
        #             "Visualization.BoxPlot",
        #         ],
        groups = [{ 
            'name': g.name,
            'image': g.icon.name,
            'elements': [f'{g.name}.{e.nick}' for e in DefaultElement.objects.filter(group=g)],
        } for g in DefaultElementGroup.objects.all().order_by('position_in_groups')]
        return groups


    def _getElements(self):
        # elementList = {
        #     "Data.DataCleaner" : {
        #         "name" : "Data Cleaner",
        #         "description" : "Removes or fills empty data",
        #         "image" : "PythonElements/Data/DataCleaner/icon.png"
        #     },          
        #     "Data.FileLoader" : {
        #         "name" : "File Loader",
        #         "description" : "Load data from a file",
        #         "image" : "PythonElements/Data/FileLoader/icon.png"
        #     },
        #     "Data.DataBaseLoader": {
        #         "name" : "DataBase Loader",
        #         "description" : "Load data from a DB",
        #         "image" : "PythonElements/Data/DataBaseLoader/icon.png"
        #     },
        #     "Data.CloudLoader": {
        #         "name" : "Cloud Loader",
        #         "description" : "Load data from the Cloud",
        #         "image" : "PythonElements/Data/CloudLoader/icon.png"
        #     },
        #     "Data.FeatureSelector": {
        #         "name" : "Feature Selector",
        #         "description" : "Selects features from data",
        #         "image" : "PythonElements/Data/FeatureSelector/icon.png"
        #     },
        #     "Data.DataMerger": {
        #         "name" : "Data Merger",
        #         "description" : "Merges sets of data",
        #         "input" : "DataFrame,Series",
        #         "image" : "PythonElements/Data/DataMerger/icon.png"
        #     },
        #     "Data.DataSaver": {
        #         "name" : "Data Saver",
        #         "description" : "Saves data to disk",
        #         "image" : "PythonElements/Data/DataSaver/icon.png"
        #     },
        #     "Visualization.DataTable": {
        #         "name" : "Data Table",
        #         "description" : "Shows data in table",
        #         "image" : "PythonElements/Visualization/DataTable/icon.png"
        #     },
        #     "Visualization.PairPlot": {
        #         "name" : "Pair Plot",
        #         "description" : "Shows pair plot of data",
        #         "image" : "PythonElements/Visualization/PairPlot/icon.png"
        #     },
        #     "Visualization.ScatterPlot": {
        #         "name" : "Scatter Plot",
        #         "description" : "Shows scatter plot of data",
        #         "image" : "PythonElements/Visualization/ScatterPlot/icon.png"
        #     },
        #     "Visualization.BoxPlot": {
        #         "name" : "Box Plot",
        #         "description" : "Shows box plot of data",
        #         "image" : "PythonElements/Visualization/BoxPlot/icon.png"
        #     },
        #     "Program.FunctionOneVar": {
        #         "name" : "Function One Var",
        #         "image" : "ProgramFlow/Program/FunctionOneVar/icon.png"
        #     },
        #     "Program.LogicalComparison": {
        #         "name" : "Logical Comparison",
        #         "image" : "ProgramFlow/Program/LogicalComparison/icon.png"
        #     },
        #     "Program.PolishCalculation": {
        #         "name" : "Polish Calculation",
        #         "image" : "ProgramFlow/Program/PolishCalculation/icon.png"
        #     }
        # }
        elementList = { f'{g.name}.{e.nick}' : {
            'name': e.name,
            'description': e.description,
            'image': e.image.name,
            'language': e.language,
            'code': e.code,
            'help': e.help,
            'properties': e.properties,
        } for g in DefaultElementGroup.objects.all().order_by('position_in_groups')
            for e in DefaultElement.objects.filter(group=g)
        }
        return elementList
    
    def _getUserGroups(self):
        print([g.icon.name for g in UserElementGroup.objects.filter(project=self.project).order_by('position_in_groups')])
        return [{ 
            'name': g.name,
            'image': g.icon.name,
            'elements': [f'{g.name}.{e.name}' for e in UserElement.objects.filter(group=g)],
        } for g in UserElementGroup.objects.filter(project=self.project).order_by('position_in_groups')]

    def _getUserElements(self):
        return {f'{g.name}.{e.nick}': { 
                'name': e.name,
                'description': e.description,
                'image': e.image.name,
                'language': e.language,
                'code': e.code,
                'help': e.help,
                'properties': e.properties,
            } for g in UserElementGroup.objects.filter(project=self.project).order_by('position_in_groups')
                for e in UserElement.objects.filter(group=g)
        }

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

    @with_key(key='user_elements')
    def setElement(self, params):
        # set_element: Used by the client to create a user-defined data analysis element.
        print("params: ", params)
        command = createCommand(params, self)
        try:
            command.action()
        except Exception as e:
            print(e)

        return {
            'groups': self._getUserGroups(),
            'elements': self._getUserElements()
        }

# edit_element: Used by the client to edit a user-defined data analysis element.
# delete_element: Used by the client to delete a user-defined data analysis element. NOTA: Hacer como con los proyectos, edit_element incluye el delete_element.

#         threading.Thread(target=worker, args=(input,)).start()
def worker(input):
    content = json.loads(input)
    #app = Celery('tasks', backend='rpc://', broker='amqp://guest:guest@rabbitmq')
    app = Celery('tasks', backend='rpc://', broker='amqp://fusion:fusion@127.0.0.1/fusion_server')
    
    
    result = app.send_task("tasks.worker_Python.nodoPython", ['basicOps._operation', content])
    response = result.get()
    messageResponse = json.dumps(response, indent=4, sort_keys=True)
    if(len(messageResponse)>600):
        print(messageResponse[0:400] + '(...)')
        print(messageResponse[-200:])
    else:
        print(messageResponse)


class Command(Protocol):
    
    def action():
        '''Execute the command'''

class CreateElement:

    def __init__(self, session, command):
        self.session = session
        self.command = command

    def action(self):
        group = UserElementGroup.objects.filter(
            name=self.command['options'].get('in_group')
        ).first()
        element, _ = UserElement.objects.get_or_create(
            nick=self.command['options']['name'],
            user=self.session.user
        )
        print("element: ", element)
        element.name = self.command['options']['name'] 
        element.image = save_image(
            f'element_icons/{element.nick}.png',
            self.command['options']['base64Icon']
        )
        element.code = self.command['options']['code'] 
        element.properties = self.command['options']['properties'] 
        element.help = self.command['options']['help'] 
        element.description = self.command['options']['description'] 
        element.language = self.command['options']['language'] 
        element.save() # Cannot add group until saved
        element.group.add(group)
        element.save()
        
        
        print("self.command['options']", self.command['options'])
        self._createRemoteTask(element.name, element.properties, element.code, element.language)
        
        return element

    def _createRemoteTask(self,typeN, properties,code, lang):
        langCommand = {
            'python' : 'tasks.worker_Python.createTask',
            'matlab' : 'tasks.worker_Matlab.createTask',
            'PY' : 'tasks.worker_Python.createTask',
            'MA' : 'tasks.worker_Matlab.createTask',
            }
        LANGS = {
            'PY' :'python',
            'MA': 'matlab',
            'python' :'python',
            'matlab' :'matlab'
            }
        #BROKER_URL = 'amqp://guest:guest@rabbitmq'
        BROKER_URL = 'amqp://fusion:fusion@127.0.0.1/fusion_server'+LANGS[lang]
        BACKEND    = 'rpc://'
        app = Celery('tasks', backend=BACKEND, broker=BROKER_URL)
        print("lang", lang)
        print("(typeN, properties, code)", [typeN, properties, code])
        result = app.send_task(langCommand.get(lang), args=(typeN, properties, code))
        isOK = result.get()
        print("------> Adding new Element, result : ", str(isOK))


class CreateGroup:

    def __init__(self, session, command):
        self.session = session
        self.command = command

    def action(self):
        groups = UserElementGroup.objects.filter(
            project=self.session.project,
        )
        new = UserElementGroup.objects.create(
            name=self.command['target'],
            project=self.session.project
        )
        new.icon = save_image(
            f'icons/{new.name}.png',
            self.command['options']['base64Icon']
        )
        if self.command['options']['relative_position'] == 'as_is':
            new.position_in_groups = groups.count() - 1
            new.save()
        else:
            inserted = False
            for g in groups.order_by('position_in_groups'):
                if g.name == self.command['options']['relative_object']:
                    if self.command['options']['relative_position'] == 'before':
                        new.position_in_groups = g.position_in_groups
                        g.position_in_groups = g.position_in_groups + 1 
                    if self.command['options']['relative_position'] == 'after':
                        new.position_in_groups = g.position_in_groups + 1
                    g.save()
                    inserted = True
                    continue
                if inserted:
                    g.position_in_group = g.position_in_groups + 1
                    g.save()
            new.save()


def save_image(filename, base64_content):
    icon = base64.b64decode(base64_content)
    os.makedirs(os.path.dirname(f'eda/static/config/{filename}'), exist_ok=True)
    #with open(filename, 'xb') as f:
    #   f.write(icon)
    with open(f'eda/static/config/{filename}', 'xb') as f:
        f.write(icon)
    f.close()
    #result = File(open(os.path.abspath(filename), 'rb'))
    #result.name = filename
    return  os.path.dirname(f'eda/static/config/{filename}')


class EditElement:
    def __init__(self, session, command):
        self.command = command
        self.session = session

    def action(self):
        if not 'relative_position' in self.command['options'] or not 'relative_object' in self.command['options']:
            raise ValueError('Invalid command.')

        # relative = UserElementGroup.objects.filter(
        #     project=self.session.project,
        #     name=self.command['options']['relative_object']
        # ).first()
        # if not relative:
        #     raise ValueError('Relative group not found.')

        target = self.getTarget()
        if not target:
            raise ValueError('Element not found.')

        self.updateFields(target)

        if self.command['options']['relative_position'] == 'as_is':
            return
        # groups = [g for g in UserElementGroup.objects.filter(
        #     project=self.session.project,
        # ).order_by('position_in_groups')]
        # if self.command['options']['relative_position'] == 'before':
        #     index = relative.position_in_groups
        # elif self.command['options']['relative_position'] == 'after':
        #     index = relative.position_in_groups + 1

        # if target.position_in_groups < index:
        #     index = index - 1
        # groups.remove(target)
        # groups.insert(index, target)
        # for i, g in enumerate(groups):
        #     g.position_in_groups = i
        #     g.save()


    def getTarget(self):
        return UserElement.objects.filter(
            nick=self.command['target'].split('.')[1],
            user=self.session.user
        ).first()

    def updateFields(self, target):
        if 'name' in self.command['options']:
            target.delete()
            target.nick = self.command['options']['name']
            target.name = self.command['options']['name']
            target.save()

        if 'description' in self.command['options']:
            target.description = self.command['options']['description']

        if 'properties' in self.command['options']:
            target.properties = self.command['options']['properties']

        if 'language' in self.command['options']:
            target.language = self.command['options']['language']

        if 'code' in self.command['options']:
            target.code = self.command['options']['code']

        if 'help' in self.command['options']:
            target.help = self.command['options']['help']

        if 'base64Icon' in self.command['options']:
            icon = base64.b64decode(self.command['options']['base64Icon'])
            img_temp = NamedTemporaryFile(delete=True)
            img_temp.write(icon)
            img_temp.flush()
            print(f'static/config/icons/{target.nick}.png')
            target.image.save(f'static/config/icons/{target.nick}.png', File(img_temp))

        if 'in_group' in self.command['options']:
            target.group.add(self.command['options']['in_group'])
        target.save()

class DuplicateElement(EditElement):

    def getTarget(self):
        target = UserElement.objects.filter(
            user=self.session.user,
            nick=self.command['target'].split('.')[1]
        ).first()
        if 'name' in self.command['options']:
            groups = target.group.first()
            target.element_ptr_id = None
            target.id = None
            target.nick = self.command['options']['name']
            target.name = self.command['options']['name']
            target.save()
            target.group.add(groups)
            target.save()
        return target


class DeleteElement:

    def __init__(self, session, command):
        self.command = command
        self.session = session

    def action(self):
        e = UserElement.objects.filter(
            name=self.command['target'].split('.')[1]
        ).first()
        if not e:
            raise ValueError('Element not found')
        e.delete()


class DeleteGroup:
    def __init__(self, session, command):
        self.command = command
        self.session = session

    def action(self):
        group = UserElementGroup.objects.filter(
            project=self.session.project,
            name=self.command['target']
        ).first()
        if group:
            group.delete()

class EditGroup:
    def __init__(self, session, command):
        self.command = command
        self.session = session

    def action(self):
        if not 'relative_position' in self.command['options'] or not 'relative_object' in self.command['options']:
            raise ValueError('Invalid command.')

        target = UserElementGroup.objects.filter(
            project=self.session.project,
            name=self.command['target']
        ).first()
        if not target:
            raise ValueError('Group not found.')

        relative = UserElementGroup.objects.filter(
            project=self.session.project,
            name=self.command['options']['relative_object']
        ).first()
        if not relative:
            raise ValueError('Relative group not found.')

        if 'name' in self.command['options']:
            target.delete()
            target.name = self.command['options']['name']           
            target.save()

        if 'base64Icon' in self.command['options']:
            icon = base64.b64decode(self.command['options']['base64Icon'])
            img_temp = NamedTemporaryFile(delete=True)
            img_temp.write(icon)
            img_temp.flush()
            target.icon.save(f'user_icons/project/{target.name}.png', File(img_temp))

        if self.command['options']['relative_position'] == 'as_is':
            return

        groups = [g for g in UserElementGroup.objects.filter(
            project=self.session.project,
        ).order_by('position_in_groups')]
        if self.command['options']['relative_position'] == 'before':
            index = relative.position_in_groups
        elif self.command['options']['relative_position'] == 'after':
            index = relative.position_in_groups + 1

        if target.position_in_groups < index:
            index = index - 1
        groups.remove(target)
        groups.insert(index, target)
        for i, g in enumerate(groups):
            g.position_in_groups = i
            g.save()


def createCommand(params, session):
    commands = {
        'CreateGroup': CreateGroup,
        'EditGroup': EditGroup,
        'DeleteGroup': DeleteGroup,
        'CreateElement': CreateElement,
        # 'DuplicateProjectElement': DuplicateProjectElement,
        'DuplicateElement': DuplicateElement,
        'DeleteElement': DeleteElement,
        'EditElement': EditElement,
    }
    if not params['command'] in commands:
        raise ValueError('Unknown command.')
    return commands[params['command']](session, params)