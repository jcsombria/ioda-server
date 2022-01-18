from django.contrib.auth.models import User
from django.db import models
import uuid

def get_upload_path(instance, filename):
    return 'user/{0}/{1}'.format(instance.user.username, filename)

def get_code_upload_path(instance, filename):
    return 'elements/{0}/{1}'.format(instance.name, filename)

def new_element_id():
    id = '%s' % uuid.uuid4()
    print(id)
    return id


class ProjectTemplate(models.Model):
    '''A template of a project'''
    name = models.CharField(max_length=250, default='New_Template', primary_key=True)
    description = models.CharField(max_length=250, default='A new template for projects.')
    image = models.ImageField(upload_to ='project_templates/')

    def __str__(self):
        return '%s' % (self.name,)

class Project(models.Model):
    '''A project'''
    name = models.CharField(max_length=250, default='New_Project', primary_key=True)
    type = models.ForeignKey(ProjectTemplate, on_delete=models.RESTRICT)
    description = models.CharField(max_length=250, default='A new template for projects.')
    workfile = models.JSONField()

    def __str__(self):
        return '%s' % (self.name,)

class ElementGroup(models.Model):
    '''A group of elements'''
    name = models.CharField(max_length=250, default='New Group of Elements', primary_key=True)
    icon = models.ImageField(blank=True)
    position_in_groups = models.IntegerField(default=0)

    def __str__(self):
        return '%s->%s' % (self.position_in_groups, self.name)

class DefaultElementGroup(ElementGroup):
    '''A default group of elements'''
    projectTemplate = models.ManyToManyField(ProjectTemplate)

class UserElementGroup(ElementGroup):
    '''An user-defined group of elements'''
    project = models.ForeignKey(Project, on_delete=models.RESTRICT)


class Element(models.Model):
    '''An Element'''
    PYTHON = 'PY'
    C = 'C'
    MATLAB = 'MA'
    LANGUAGES = (
        (PYTHON, 'Python'),
        (C, 'C'),
        (MATLAB, 'Matlab'),
    )
    nick = models.CharField(max_length=250, default='new_element')
    name = models.CharField(max_length=250, default='New Element')
    image = models.ImageField(blank=True)
    language = models.CharField(max_length=2, choices=LANGUAGES, default=PYTHON)
    code = models.TextField(default='')
    properties = models.JSONField(default=dict, blank=True)
    help = models.CharField(max_length=250, blank=True)
    description = models.CharField(max_length=500, default='A new Element', blank=True)
    group = models.ManyToManyField(ElementGroup)

    def __str__(self):
        return '%s' % (self.nick,)

class DefaultElement(Element):
    '''A default Element'''

class UserElement(Element):
    '''An user-defined Element'''
    user = models.ForeignKey(User, default=None, on_delete=models.CASCADE)