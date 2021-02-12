from django.contrib import admin

from jobs.models import Job, RunningJob, UserProfile

admin.site.register(UserProfile)
admin.site.register(Job)
admin.site.register(RunningJob)

