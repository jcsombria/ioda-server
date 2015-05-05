import os

from django.conf import settings
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.core.servers.basehttp import FileWrapper
from django.http import HttpResponse
from django.shortcuts import render, redirect

from .forms import NewUserForm, NewJobForm
from .models import Job, List, RunningJob, RunningUser
from .popo.JobManager import JobManager

def home_page(request):
  ''' This view shows the main page to the user.
  '''
  return render(request, 'home.html')


def login_view(request):
  ''' This view shows the login form.
  '''
  if request.method == 'POST':
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)
    if user is not None:
      if user.is_active:
        login(request, user)
        request.session.set_expiry(300)
        try:
          url = request.POST['next']
        except KeyError:
          url = '/'
        return redirect(url)
      else:
        return HttpResponse('disabled account')
    else:
      return HttpResponse('invalid login')
#  else:
  return render(request, 'login.html')


def create_account(request):
  ''' This view shows a form to create a new user account
  '''
  if request.method == 'POST':
    form = NewUserForm(request.POST)
    if form.is_valid():
      data = form.cleaned_data
      if data.password == data.confirm_password:
        return HttpResponse('Valid request')
      else:
        return render(request, 'create_account.html', {'form': form})
    else:
      return HttpResponse('Invalid request')

#      is_valid_password = (password == confirm_password)
#      is_valid_user = not User.objects.filter(username=username).exists()
#      if is_valid_password and is_valid_user:
#        new_user = User.objects.create_user(
#          username,
#          email,
#          password
#        )
#        new_user.is_active = False
#        new_user.save()
#      else:
#        return HttpResponse('Invalid request')
#      return redirect('/')
  else:
    form = NewUserForm()
    return render(request, 'create_account.html', {'form': form})


@login_required(login_url='/login/')
def available_jobs(request):
  ''' This view shows a list of the jobs available to the logged user
  '''
  try:
    jobs = Job.objects.filter(name='suma')
  except (Job.DoesNotExist, Job.MultipleObjectsReturned):
    return HttpResponse('Server Error: Invalid Job Definition')    
  return render(request, 'available_jobs.html', {'list': jobs})


@login_required(login_url='/login/')
def running_jobs(request):  
  ''' This view shows a list of the jobs which the logged user has 
  already submitted.
  '''
  list_ = RunningJob.objects.filter(user=request.user)
  # Update status
  for job in list_:
    job_info = {
      'name': job.job.name,
      'host': job.job.host,
      'user': job.job.user,
      'job_id': job.runningjob_id,
    }
    job_manager = JobManager(job_info)
    job_manager.set_job_id(job.runningjob_id)
    job_status = job_manager.get_status()
    if job_status != job.status:
      job.status = job_status
      job.save(update_fields=['status'])
  return render(request, 'running_jobs.html', {'list': list_})


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
      # Actually submit job
      job_info = {
        'name': job.name,
        'input': job.input,
        'localfile': job_input,
        'output': job.output,
        'host': job.host,
        'user': job.user,
      }
      job_manager = JobManager(job_info)
      job_manager.submit_job()
      job_id = job_manager.get_job_id().strip('\n')
      running_job = RunningJob.objects.create(
        job=job,
        runningjob_id=job_id,
        user=request.user,
        input=job_input,
        output=job.output,
      )
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


@login_required(login_url='/login/')
def get_job_results(request):
  try:
    job_id = request.GET['job_id']
    field = request.GET['field']
    job = RunningJob.objects.get(runningjob_id=job_id)

    if field == 'job_output':
      job_manager = JobManager('jobs_description/suma.job')
      job_manager.set_job_id(job_id)
      job_manager.get_results('jobs/static/salida.txt')
      return redirect('/static/salida.txt')
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


