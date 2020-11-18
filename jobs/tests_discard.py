###class JobsTest(TestCase):

###  def setUp(self):
###    username = 'sakura'
###    password = 'sakura'
###    email = 'sakura@ciematweb.com'
###    self.user = User.objects.create_user(username, email, password)

###  def test_user_must_login(self):
###    protected_urls = ('/jobs/available', '/jobs/running', '/jobs/submit')
###    for url in protected_urls:
###      self.check_ask_for_login_if_not_authenticated(url)

###  def check_ask_for_login_if_not_authenticated(self, url):
###    response = self.client.get(url)
###    self.assertRedirects(response, 'login/?next=%s' % (url,)) 

###  def test_user_can_submit_job(self):
###    list_ = List.objects.create(user=self.user)
###    Job.objects.create(name='suma', input='entrada.txt', 
###      output='salida.txt', description='Add numbers', list=list_)
###    self.login()
###    job_input = open('entrada.txt', 'w+')
###    response = self.client.post(
###      '/jobs/submit',
###      data={
###        'job_name': 'suma',
###        'job_input': job_input
###      }
###    )
###    new_job = RunningJob.objects.first()   
###    self.assertEqual(RunningJob.objects.count(), 1)
###    self.assertEqual(new_job.job.name, 'suma')
###    self.assertRedirects(response, '/jobs/running')

####  def test_user_can_submit_job_with_files(self):
####    list_ = List.objects.create(user=self.user)
####    Job.objects.create(name='suma', input='entrada.txt', 
####      output='salida.txt', description='Add numbers', list=list_)
####    self.login()
####    response = self.client.post(
####      '/jobs/submit',
####      data={'job_name': 'suma'}
####    )
####    
####    new_job = RunningJob.objects.first()   
####    self.assertEqual(RunningJob.objects.count(), 1)
####    self.assertEqual(new_job.job.name, 'suma')
####    self.assertRedirects(response, '/jobs/running')

####  def test_user_can_retrieve_available_jobs(self):
####    list_ = List.objects.create()
####    job = Job.objects.create(name='suma', list=list_)
####    self.login()
####    response = self.client.get('/jobs/available/')       
####    context = self.get_user_context(response)
####    context.update({'list': list_})
####    expected_html = render_to_string('available_jobs.html', context)
####    self.assertEqual(response.content.decode(), expected_html)

###  def login(self):
###    response = self.client.post( '/login/', 
###      data={'username': 'sakura', 'password': 'sakura' }
###    )

###  def get_user_context(self, response):
###    context = {
###      'csrf_token': response.client.cookies['csrftoken'].value, 
###      'user': self.user
###    }
###    return context    

####  def test_user_can_retrieve_running_jobs(self):
####    list_ = List.objects.create(user=self.user)
####    job = Job.objects.create(name='suma', list=list_)
####    user = RunningUser.objects.create(name='sakura')
####    jobinstance = RunningJob.objects.create(job=job, user=user)
####    self.login()
####    response = self.client.get('/jobs/running/')
####    context = self.get_user_context(response)
####    context.update({'list': list_})
####    expected_html = render_to_string('running_jobs.html', context)
####    self.assertEqual(response.content.decode(), expected_html)

###from datetime import datetime, timedelta


###class JobsModelTest(TestCase):

###  def setUp(self):
###    username = 'sakura'
###    password = 'sakura'
###    email = 'sakura@ciematweb.com'
###    self.user = User.objects.create_user(username, email, password)
###    

###  def test_running_job_model(self):
###    dummy_list = List.objects.create()
###    dummy_job = Job.objects.create(name='suma', list=dummy_list)
###    running_job = RunningJob.objects.create(
###      user=self.user,
###      job=dummy_job,
###    )
###    # Test timestamp
###    now = datetime.utcnow()
###    timestamp = running_job.timestamp.utcnow()
###    delta = now - timestamp
###    onesecond = timedelta(seconds=1)
###    self.assertLess(delta, onesecond)


#from paramiko.agent import Agent, AgentKey
#from jobs.drivers.SSHSession import SSHSession
#from jobs.drivers.JobManager import JobManager
#import tempfile
#import time

#class JobsTest(TestCase):

#  def setUp(self):
#    self.job = Job.objects.create(
#      name='suma',
#      input='entrada.txt',
#      output='salida.txt',
#      description='Add numbers',
#      host='62.204.199.200',
#      user='jchacon',
#    )
#    self.jo
# b_input = tempfile.TemporaryFile(mode='w+')
#    tmp_data = '1\n1 2\n1 2 3\n1 2 3 4\n' 
#    self.job_input.write(tmp_data)
#    self.job_input.flush()

#  def test_user_can_get_ssh_keys(self):
#    try:
#      ssh_agent = Agent()
#      ssh_keys = ssh_agent.get_keys()
#    except SSHException:
#      print('incompatible protocol')

#    for key in ssh_keys:
#      print(key.get_name())

#  def test_user_can_send_file(self):
#    self.job_input.seek(0)
#    session = SSHSession('62.204.199.200', 'jchacon')
#    session.connect()
#    session.send_file(self.job_input, '/home/jchacon/ciemat/tmp/prueba.txt', None)

#    self.assertEqual(session.connect(), True)

#  def test_user_can_submit_job(self):
#    self.job_submitter = JobManager({
#      'name': self.job.name,
#      'input': self.job.input,
#      'localfile': self.job_input,
#      'output': self.job.output,
#      'host': self.job.host,
#      'user': self.job.user,
#    },
#      self.job
#    )    
#    self.job_submitter.submit_job()
#    job_id = self.job_submitter.get_job_id().strip('\n')
#    self.assertNotEqual(job_id, '')
