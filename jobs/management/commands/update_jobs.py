from django.core.management.base import BaseCommand, CommandError
from django.core.mail import send_mail

from jobs.models import RunningJob
from jobs.popo.JobManager import JobManager

import time
from datetime import datetime, timedelta

class Command(BaseCommand):
  help = 'Update the status of the jobs'

  def handle(self, *args, **options):
    start = time.time()
    try:
      jobs = RunningJob.objects.all()
      for job in jobs:
        job_manager = JobManager(job)
        self.stdout.write(str(job))
        modified_fields = []

#        self.update_status()
        job_status = job_manager.get_status()
        if job_status != job.status:
          modified_fields.append('status')
          job.status = job_status

#        self.notify_if_completed()
        if job.status == 'completed' and not job.notified_completed:
          modified_fields.append('notified_completed')
          job.notified_completed = True
          self.notify(job.user.email)

#       self.notify_if_near_expiration(job, job_manager)
        now = datetime.now(job.expiration_date.tzinfo)
        delta = job.expiration_date - now
        if delta < timedelta(days=7):
          modified_fields.append('notified_expiration')
          job.notified_expiration = True
          self.notify(job.user.email)
        if delta < timedelta(days=0):
          pass
#         self.purge_job()
#        self.purge_if_expired()

#        self.save_if_modified()
        if modified_fields:
          job.save(update_fields=modified_fields)
          
    except RunningJob.DoesNotExist:
      raise CommandError('There are no jobs to update')
    end = time.time()
    print(end - start)

  def update_status(self, job):
    if job_status != job.status:
      modified_fields.append('status')
      job.status = job_status



  def notify(self, email):
    issue = 'Job completed.'
    message = 'Your job is completed. You can log in with your user profile to download the results.'
    src_email = 'noreply@hpc.dia.uned.es'
    send_mail(issue, message, src_email, [email])

