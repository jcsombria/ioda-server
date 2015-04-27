from django.core.urlresolvers import resolve
from django.contrib.auth.models import User
from django.test import TestCase
from django.http import HttpRequest
from django.template.loader import render_to_string
from django.core.context_processors import csrf

from jobs.views import home_page, running_jobs
from jobs.models import List, Job, RunningJob, RunningUser


class LoginTest(TestCase):
  def setUp(self):
    self.username = 'sakura'
    self.password = 'sakura'
    self.email = 'sakura@ciematweb.com'
    self.user = User.objects.create_user(self.username, self.email, self.password)

  def test_user_can_log_in(self):
    response = self.client.post( '/login/', 
      data={'username': self.username, 'password': self.password}
    )
    self.assertRedirects(response, '/')

  def test_user_can_log_out(self):
    user_data = {'username': self.username, 'password': self.password}
    response = self.client.post('/login/', data=user_data)
    response = self.client.get('/logout/')    
    self.assertRedirects(response, '/')


class HomePageTest(TestCase):

  def test_root_url_resolves_to_home_page_view(self):
    found = resolve('/')
    self.assertEqual(found.func, home_page)

  def test_home_page_returns_correct_html_before_login(self):
    expected_html = render_to_string('home.html')
    response = self.client.get('/')
    self.assertEqual(response.content.decode(), expected_html)

  def test_home_page_returns_correct_html_after_login(self):
    username = 'sakura'
    password = 'sakura'
    email = 'sakura@ciematweb.com'
    user = User.objects.create_user(username, email, password)
    
    response = self.client.post( '/login/', 
      data={'username': username, 'password': password}
    )
    expected_html = render_to_string('home.html', {'user': user})
    response = self.client.get('/')
    self.assertEqual(response.content.decode(), expected_html)


class JobsTest(TestCase):

  def setUp(self):
    username = 'sakura'
    password = 'sakura'
    email = 'sakura@ciematweb.com'
    self.user = User.objects.create_user(username, email, password)

  def test_user_must_login(self):
    protected_urls = ('/jobs/available', '/jobs/running', '/jobs/submit')
    for url in protected_urls:
      self.check_ask_for_login_if_not_authenticated(url)

  def check_ask_for_login_if_not_authenticated(self, url):
    response = self.client.get(url)
    self.assertRedirects(response, 'login/?next=%s' % (url,)) 

  def test_user_can_submit_job(self):
    list_ = List.objects.create(user=self.user)
    Job.objects.create(name='suma', input='entrada.txt', 
      output='salida.txt', description='Add numbers', list=list_)
    self.login()
    job_input = open('entrada.txt', 'w+')
    response = self.client.post(
      '/jobs/submit',
      data={
        'job_name': 'suma',
        'job_input': job_input
      }
    )
    new_job = RunningJob.objects.first()   
    self.assertEqual(RunningJob.objects.count(), 1)
    self.assertEqual(new_job.job.name, 'suma')
    self.assertRedirects(response, '/jobs/running')

#  def test_user_can_submit_job_with_files(self):
#    list_ = List.objects.create(user=self.user)
#    Job.objects.create(name='suma', input='entrada.txt', 
#      output='salida.txt', description='Add numbers', list=list_)
#    self.login()
#    response = self.client.post(
#      '/jobs/submit',
#      data={'job_name': 'suma'}
#    )
#    
#    new_job = RunningJob.objects.first()   
#    self.assertEqual(RunningJob.objects.count(), 1)
#    self.assertEqual(new_job.job.name, 'suma')
#    self.assertRedirects(response, '/jobs/running')

#  def test_user_can_retrieve_available_jobs(self):
#    list_ = List.objects.create()
#    job = Job.objects.create(name='suma', list=list_)
#    self.login()
#    response = self.client.get('/jobs/available/')       
#    context = self.get_user_context(response)
#    context.update({'list': list_})
#    expected_html = render_to_string('available_jobs.html', context)
#    self.assertEqual(response.content.decode(), expected_html)

  def login(self):
    response = self.client.post( '/login/', 
      data={'username': 'sakura', 'password': 'sakura' }
    )

  def get_user_context(self, response):
    context = {
      'csrf_token': response.client.cookies['csrftoken'].value, 
      'user': self.user
    }
    return context    

#  def test_user_can_retrieve_running_jobs(self):
#    list_ = List.objects.create(user=self.user)
#    job = Job.objects.create(name='suma', list=list_)
#    user = RunningUser.objects.create(name='sakura')
#    jobinstance = RunningJob.objects.create(job=job, user=user)
#    self.login()
#    response = self.client.get('/jobs/running/')
#    context = self.get_user_context(response)
#    context.update({'list': list_})
#    expected_html = render_to_string('running_jobs.html', context)
#    self.assertEqual(response.content.decode(), expected_html)

from datetime import datetime, timedelta


class JobsModelTest(TestCase):

  def setUp(self):
    username = 'sakura'
    password = 'sakura'
    email = 'sakura@ciematweb.com'
    self.user = User.objects.create_user(username, email, password)
    

  def test_running_job_model(self):
    dummy_list = List.objects.create()
    dummy_job = Job.objects.create(name='suma', list=dummy_list)
    running_job = RunningJob.objects.create(
      user=self.user,
      job=dummy_job,
    )
    # Test timestamp
    now = datetime.utcnow()
    timestamp = running_job.timestamp.utcnow()
    delta = now - timestamp
    onesecond = timedelta(seconds=1)
    self.assertLess(delta, onesecond)


from paramiko.agent import Agent, AgentKey

class SSHTest(TestCase):

  def test_user_can_get_ssh_keys(self):
    try:
      ssh_agent = Agent()
      ssh_keys = ssh_agent.get_keys()
    except SSHException:
      print('incompatible protocol')

    for key in ssh_keys:
      print(key.get_name())




