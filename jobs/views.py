import os
from datetime import datetime, timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpResponse
from django.shortcuts import render, redirect

from wsgiref.util import FileWrapper

from .forms import NewUserForm, NewJobForm, LoginForm
from .models import Job, RunningJob, UserProfile
from .drivers.JobManager import JobManager

def home_page(request):
  ''' This view shows the main page to the user.
  '''
  return render(request, 'home.html')


def login_view(request):
  ''' This view shows the login form.
  '''
  if request.method == 'POST':
    form = LoginForm(request.POST)
    if form.is_valid():
      username = request.POST['username']
      password = request.POST['password']
      user = authenticate(username=username, password=password)
      if user is not None and user.is_active:
        login(request, user)
        request.session.set_expiry(900)
        url = request.POST.get('next', '/')
        return redirect(url)
      else:
        return HttpResponse('invalid login')
  else:
    form = LoginForm()
  return render(request, 'login.html', {'form': form})


def create_account(request):
  ''' This view shows a form to create a new user account
  '''
  if request.method == 'POST':
    form = NewUserForm(request.POST)
    if form.is_valid():
      data = form.cleaned_data
      is_valid_password = (data['password'] == data['confirm_password'])
      is_valid_user = not User.objects.filter(username=data['username']).exists()
      if is_valid_password and is_valid_user:
        new_user = User.objects.create_user(
          data['username'],
          data['email'],
          data['password']
        )
        new_user.is_active = False
        new_user.save()
        new_user_profile = UserProfile.objects.create(
          user=new_user,
          expiration_date=datetime.now()+timedelta(days=365)
        )
        send_mail(
          'User account activation',
          'User ' + new_user.username + ' ask for account activation.',
          'src@mail',
          ['dst@mail']
        )
        return HttpResponse('User account created.')
#      return redirect('/')
      else:
        return render(request, 'create_account.html', {'form': form})
    else:
      return HttpResponse('Invalid request')
  else:
    form = NewUserForm()
    return render(request, 'create_account.html', {'form': form})


@login_required(login_url='/login/')
def available_jobs(request):
  ''' This view shows a list of the jobs available to the logged user
  '''
  try:
    jobs = Job.objects.all()
  except (Job.DoesNotExist, Job.MultipleObjectsReturned):
    return HttpResponse('Server Error: Invalid Job Definition')    
  return render(request, 'available_jobs.html', {'list': jobs})


@login_required(login_url='/login/')
def running_jobs(request):  
  ''' This view shows a list of the jobs the logged user has 
  already submitted.
  '''
  list_ = RunningJob.objects.filter(user=request.user)
#  for job in list_:
#    job_manager = JobManager(job)
#    job_status = job_manager.get_status()
#    if job_status != job.status:
#      job.status = job_status
#      job.save(update_fields=['status'])
  context = {
    'list': list_.exclude(status='completed'),
    'status': 'uncompleted',
  }
  return render(request, 'running_jobs.html', context)

@login_required(login_url='/login/')
def finished_jobs(request):  
  ''' This view shows a list of the jobs which are completed.
  '''
  list_ = RunningJob.objects.filter(user=request.user)
#  for job in list_:
#    job_manager = JobManager(job)
#    job_status = job_manager.get_status()
#    if job_status != job.status:
#      job.status = job_status
#      job.save(update_fields=['status'])
  context = {
    'list': list_.filter(status='completed'),
    'status': 'completed',
  }
  return render(request, 'running_jobs.html', context)


@login_required(login_url='/login/')
def submit_job(request):
  ''' This view allows the user to submit a new job to be executed.
  '''
  if request.method == 'POST':
    form = NewJobForm(request.POST, request.FILES)
    if form.is_valid():
      data = form.cleaned_data
      job_name = data['job_name']
      job_input = request.FILES['job_input']
      job = Job.objects.filter(name=job_name)[0]
      running_job = RunningJob(
        job=job,
        user=request.user,
        input=job_input,
        output=job.output,
      )
      job_manager = JobManager(running_job)
      job_manager.submit_job()
      running_job.runningjob_id = job_manager.get_job_id().strip('\n')
      if running_job.runningjob_id != '':
        running_job.save()
    return redirect('/jobs/running')
  else:
    try:
      job_name = request.GET['job_name']
      form = NewJobForm()
      form.initial = {'job_name':job_name}
    except:
      return HttpResponse('Invalid request')
    return render(request, 'submit_job.html', {'form': form})


@login_required(login_url='/login/')
def cancel_job(request):
  try:
    job_id = request.GET['job_id']
    jobs = RunningJob.objects.filter(runningjob_id=job_id, user=request.user)
    for job in jobs:
      job.delete()
  except Job.DoesNotExist:
    pass
  return redirect('/jobs/running')

import tempfile
@login_required(login_url='/login/')
def get_job_results(request):
  try:
    job_id = request.GET['job_id']
    field = request.GET['field']
    job = RunningJob.objects.get(runningjob_id=job_id)
    if field == 'job_output':
      job_manager = JobManager(job)
      tmpfile = tempfile.TemporaryFile()
      job_manager.get_results(tmpfile)
      tmpfile.seek(0)
      response = HttpResponse(tmpfile, content_type='application/zip')
      response['Content-Disposition'] = 'attachment; filename="results.zip"'
      return response
    elif field == 'job_log':
      job_manager = JobManager(job)
      tmpfile = tempfile.TemporaryFile()
      job_manager.get_log(tmpfile)
      tmpfile.seek(0)
      response = HttpResponse(tmpfile, content_type='text/plain')
      response['Content-Disposition'] = 'attachment; filename="log.txt"'
      return response
    elif field == 'job_input':
      size = os.path.getsize(job.input.path)
      wrapper = FileWrapper(job.input)
      response = HttpResponse(wrapper, content_type='text/plain')
      response['Content-Length'] = size
      return response
  except Job.DoesNotExist:
    pass
  return HttpResponse('Invalid Request')

@login_required(login_url='/login/')
def logout_view(request):
  logout(request)
  return redirect('/')
