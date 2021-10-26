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

# Create your models here.
class Element(models.Model):
    id = models.CharField(max_length=250, default=new_element_id, primary_key=True)
    name = models.CharField(max_length=250, default='New Element')
    image = models.ImageField(blank=True)
    code = models.description_file = models.FileField(upload_to=get_code_upload_path, default=None, blank=True)
    properties = models.JSONField(default=dict)
    help = models.URLField(blank=True)
    description = models.CharField(max_length=500, default='A new Element')

    def __str__(self):
        return '%s' % (
            self.name,
        )


class ProjectTemplate(models.Model):
    name = models.CharField(max_length=250, default='New_Template', primary_key=True)
    description = models.CharField(max_length=250, default='A new template for projects.')
    image = models.ImageField(upload_to ='project_templates/')
#     elements = models.ManyToManyField(Element)

    def __str__(self):
        return '%s' % (
            self.id,
        )


class Project(models.Model):
    name = models.CharField(max_length=250, default='New_Project', primary_key=True)
#     elements = models.ManyToManyField(Element)
    type = models.ForeignKey(ProjectTemplate, on_delete=models.RESTRICT)
    description = models.CharField(max_length=250, default='A new template for projects.')
    workfile = models.JSONField()

    def __str__(self):
        return '%s' % (
            self.name,
        )
