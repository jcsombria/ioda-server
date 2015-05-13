from django.db import models
from django.contrib.auth.models import User

class RunningUser(models.Model):
  user = models.OneToOneField(User, primary_key=True, default=None)


class List(models.Model):
  user = models.TextField(default='')


class Job(models.Model):
  TORQUE = 'TO'
  CONDOR = 'CO'
  BACKENDS = (
    (TORQUE, 'Torque'),
    (CONDOR, 'Condor'),
  )
  name = models.TextField(default='', primary_key=True)
  input = models.TextField(default='')
  output = models.TextField(default='')
  description = models.TextField(default='')
  host = models.GenericIPAddressField(default='0.0.0.0')
  user = models.TextField(default='')
  backend = models.CharField(max_length=2, choices=BACKENDS, default=TORQUE)
  
  def __str__(self):
    return '%s:%s->%s@%s' % (
      self.get_backend_display(),
      self.name,
      self.user,
      self.host
    )


def get_upload_path(instance, filename):
  return 'user/{0}/{1}'.format(instance.user.username, filename)


class RunningJob(models.Model):
  job = models.ForeignKey(Job, default=None)
  user = models.ForeignKey(User, default=None)
  timestamp = models.DateTimeField(auto_now_add=True, default=None)
#  expiration_date = models.DateTimeField(default=None)
  runningjob_id = models.TextField(default='')
  status = models.TextField(default='')
  input = models.FileField(upload_to=get_upload_path, default=None)
  output = models.FileField(default=None)
  
  def __str__(self):
    return '%s %s:%s->%s' % (
      self.user,
      self.job.name,
      self.timestamp,
      self.status
    )

