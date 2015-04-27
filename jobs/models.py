from django.db import models
from django.contrib.auth.models import User

class RunningUser(models.Model):
  user = models.OneToOneField(User, primary_key=True, default=None)


class List(models.Model):
  user = models.TextField(default='')


class Job(models.Model):
  name = models.TextField(default='')
  input = models.TextField(default='')
  output = models.TextField(default='')
  description = models.TextField(default='')
  list = models.ForeignKey(List, default=None)


def get_upload_path(instance, filename):
  return 'user/{0}/{1}'.format(instance.user.username, filename)

class RunningJob(models.Model):
  job = models.ForeignKey(Job, default=None)
  user = models.ForeignKey(User, default=None)
  timestamp = models.DateTimeField(auto_now_add=True, default=None)
  runningjob_id = models.TextField(default='')
  status = models.TextField(default='')
  input = models.FileField(upload_to=get_upload_path, default=None)
  output = models.FileField(default=None)

