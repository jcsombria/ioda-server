from django.db import models

def get_upload_path(instance, filename):
    return 'user/{0}/{1}'.format(instance.user.username, filename)

def get_code_upload_path(instance, filename):
    return 'elements/{0}/{1}'.format(instance.path, filename)

# Create your models here.
class Element(models.Model):
    path = models.CharField(max_length=250, default='path', primary_key=True)
    icon = models.ImageField(blank=True)
    code = models.description_file = models.FileField(upload_to=get_code_upload_path, default=None, blank=True)
    properties = models.TextField(default='{}')

    def __str__(self):
        return '%s' % (
            self.path,
        )


class ProjectTemplate(models.Model):
    name = models.CharField(max_length=250, default='New_Template', primary_key=True)
    elements = models.ManyToManyField(Element)

    def __str__(self):
        return '%s' % (
            self.name,
        )


class Project(models.Model):
    name = models.CharField(max_length=250, default='New_Project', primary_key=True)
    elements = models.ManyToManyField(Element)
    template = models.ForeignKey(ProjectTemplate, on_delete=models.RESTRICT)

    def __str__(self):
        return '%s' % (
            self.name,
        )
