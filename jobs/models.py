from datetime import datetime, timedelta
from django.db import models
from django.contrib.auth.models import User

def get_upload_path(instance, filename):
  return 'user/{0}/{1}'.format(instance.user.username, filename)

def _get_expiration_date():
  return datetime.now() + timedelta(days=90);


class UserProfile(models.Model):
  user = models.OneToOneField(User, primary_key=True, default=None, on_delete=models.CASCADE)
  expiration_date = models.DateTimeField(default=_get_expiration_date)

  def __str__(self):
    return '%s->%s' % (
      self.user.username,
      self.expiration_date,
    ) 


class Job(models.Model):
  TORQUE = 'TO'
  CONDOR = 'CO'
  BACKENDS = (
    (TORQUE, 'Torque'),
    (CONDOR, 'Condor'),
  )
  name = models.CharField(max_length=250, default='', primary_key=True)
  input = models.TextField(default='')
  output = models.CharField(max_length=255, default='')
  description = models.TextField(default='')
  detailed_description = models.TextField(default='')
  host = models.GenericIPAddressField(default='0.0.0.0')
  user = models.CharField(max_length=255, default='')
  backend = models.CharField(max_length=2, choices=BACKENDS, default=TORQUE)
  job_path = models.CharField(max_length=255)  
  results_path = models.CharField(max_length=255)  
  tmp_path = models.CharField(max_length=255)  
  
  def __str__(self):
    return '%s:%s->%s@%s' % (
      self.get_backend_display(),
      self.name,
      self.user,
      self.host
    )


class RunningJob(models.Model):
  job = models.ForeignKey(Job, default=None, on_delete=models.RESTRICT)
  user = models.ForeignKey(User, default=None, on_delete=models.CASCADE)
  timestamp = models.DateTimeField(auto_now_add=True)
  expiration_date = models.DateTimeField(default=_get_expiration_date)
  runningjob_id = models.CharField(max_length=255, default='')
  status = models.CharField(max_length=255, default='')
  input = models.FileField(upload_to=get_upload_path, default=None)
  output = models.FileField(default=None)
  notified_completed = models.BooleanField(default=False)
  notified_expiration = models.BooleanField(default=False)
  
  def __str__(self):
    return '%s %s:%s->%s' % (
      self.user,
      self.job.name,
      self.timestamp,
      self.status
    )
