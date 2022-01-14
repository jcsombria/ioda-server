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
    name = models.CharField(max_length=250, default='New_Template', primary_key=True)
    description = models.CharField(max_length=250, default='A new template for projects.')
    image = models.ImageField(upload_to ='project_templates/')
#     elements = models.ManyToManyField(Element)

    def __str__(self):
        return '%s' % (self.id,)


class Project(models.Model):
    name = models.CharField(max_length=250, default='New_Project', primary_key=True)
#     elements = models.ManyToManyField(Element)
    type = models.ForeignKey(ProjectTemplate, on_delete=models.RESTRICT)
    description = models.CharField(max_length=250, default='A new template for projects.')
    workfile = models.JSONField()

    def __str__(self):
        return '%s' % (self.name,)

class Element(models.Model):
    id = models.CharField(max_length=250, default=new_element_id, primary_key=True)
    name = models.CharField(max_length=250, default='New Element')
    image = models.ImageField(blank=True)
    code = models.description_file = models.FileField(upload_to=get_code_upload_path, default=None, blank=True)
    properties = models.JSONField(default=dict)
    help = models.URLField(blank=True)
    description = models.CharField(max_length=500, default='A new Element')

    def __str__(self):
        return '%s' % (self.name,)

class ElementGroup(models.Model):
    name = models.CharField(max_length=250, default='New Group of Elements', primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.RESTRICT)
    icon = models.ImageField(blank=True)
    before = models.ForeignKey('self', on_delete=models.RESTRICT, blank=True, null=True, related_name='relative_before')
    after = models.ForeignKey('self', on_delete=models.RESTRICT, blank=True, null=True, related_name='relative_after')
    position_in_group = models.IntegerField(default=0)

    def __str__(self):
        return '%s->%s' % (self.position_in_group, self.name)