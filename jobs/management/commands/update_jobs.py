from django.core.management.base import BaseCommand, CommandError
from django.core.mail import send_mail

from jobs.models import RunningJob
from jobs.drivers.JobManager import JobManager

import time
from datetime import datetime, timedelta

class Command(BaseCommand):
  help = 'Update the status of the jobs'
  messages = {
    'completed': {
      'issue': 'Job completed.',
      'body': 'Your job is completed. You can log in with your user profile to download the results.'
    },
    'near_expiration': {
      'issue': 'Job near to expiration date.',
      'body': 'Your job is about to expire. Please, log in and download your results data before 7 days. After this date your data will be removed from the server.'
    },

  }

  def handle(self, *args, **options):
    start = time.time()
    try:
      jobs = RunningJob.objects.all()
      for job in jobs:
        self.stdout.write(str(job))
        modified_fields = []
        self.update_status(job, modified_fields)
        self.notify_if_completed(job, modified_fields)
        self.notify_if_near_expiration(job, modified_fields)
        self.save_if_modified(job, modified_fields)          
    except RunningJob.DoesNotExist:
      raise CommandError('There are no jobs to update')
    end = time.time()
    self.stdout.write(str(end - start))

  def update_status(self, job, modified_fields):
    ''' Update the status of the job
    '''
    job_manager = JobManager(job)
    job_status = job_manager.get_status()
    if job_status != job.status:
      modified_fields.append('status')
      job.status = job_status

  def notify_if_completed(self, job, modified_fields):
    ''' Send an email to the job propietary notifying the completion
        of the job. 
    '''
    if job.status == 'completed' and not job.notified_completed:
      self.stdout.write('job_notified: '+job.notified_completed)
      modified_fields.append('notified_completed')
      job.notified_completed = True
      self.notify(job.user.email, notification='completed')

  def notify_if_near_expiration(self, job, modified_fields):
    ''' Send an email to the job propietary remembering the expiration
        date of the job. 
    '''
    if job.notified_completed and not job.notified_expiration:
      now = datetime.now(job.expiration_date.tzinfo)
      delta = job.expiration_date - now
      if delta < timedelta(days=7):
        modified_fields.append('notified_expiration')
        job.notified_expiration = True
        self.notify(job.user.email, notification='near_expiration')
      if delta < timedelta(days=0):
        # TO DO: Remove job from the server
        # self.purge_job()
        pass
    return modified_fields

  def notify(self, email, notification):
    message = self.messages.get(notification)
    src_email = 'noreply@hpc.dia.uned.es'
    send_mail(message['issue'], message['body'], src_email, [email])

  def save_if_modified(self, job, modified_fields):
    if modified_fields:
      job.save(update_fields=modified_fields)
