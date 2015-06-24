import tempfile, time, os

from django.core.files import File
from django.contrib.auth.models import User
from django.test import TestCase
from paramiko.agent import Agent, AgentKey

from jobs.views import home_page, running_jobs
from jobs.models import List, Job, RunningJob
from jobs.popo.SSHSession import SSHSession
from jobs.popo.JobManager import JobManager

class Helper(object):

  def create_file(self, data):
    new_file = tempfile.TemporaryFile(mode='w+')
    new_file.write(data)
    new_file.flush()
    return new_file
  

class SSHSessionTest(TestCase):

  def setUp(self):
    self.helper = Helper()

  def connect(self):
    self.session = SSHSession('62.204.199.200', 'jchacon')
    is_connected = self.session.connect()
    return is_connected

  def test_can_connect(self):
    is_connected = self.connect()
    self.assertEqual(is_connected, True)

  def test_can_send_file(self):
    expected_response = '1\n1 2\n1 2 3\n1 2 3 4\n'
    file_to_send = self.helper.create_file(expected_response)
    self.connect()
    response = self.session.send_file(file_to_send, '/home/jchacon/ciemat/tmp/prueba.txt', None)

    self.assertEqual(response.st_size, len(expected_response))

  def test_can_get_file(self):
    expected_response = '1\n1 2\n1 2 3\n1 2 3 4\n'
    file_to_send = self.helper.create_file(expected_response)
    self.connect()
    file_sent = self.session.send_file(file_to_send, '/home/jchacon/ciemat/tmp/prueba.txt', None)
    self.session.get_file('./borrar.txt', '/home/jchacon/ciemat/tmp/prueba.txt', None)
    
    file_received = open('./borrar.txt', 'r')
    file_received.seek(0,2)
    expected_size = file_sent.st_size
    response_size = file_received.tell()
    file_received.close()
    self.assertEqual(response_size, expected_size)

  def test_can_exec_command(self):
    expected_response = 'ok'
    command = 'echo ' + expected_response
    self.connect()
    [stdin, stdout, stderr] = self.session.exec_command(command)
    response = stdout.read().strip().decode('utf-8')
    
    self.assertEqual(response, expected_response)

class JobManagerTest(TestCase):

  def setUp(self):
    self.user = User.objects.create_user(
      'sakura',
      'sakura',
      'sakura@ciematweb.com'
    )
    self.job_model = Job.objects.create(
      name='suma',
      input='entrada.txt',
      output='salida.txt',
      description='Add numbers',
      host='62.204.199.200',
      user='jchacon',
      job_path='ciemat/tareas/',
      tmp_path='ciemat/tmp/',
      results_path='ciemat/resultados/',
    )
    self.helper = Helper()
    tmp_data = '1\n1 2\n1 2 3\n1 2 3 4\n'
    self.dummy_file = self.helper.create_file(tmp_data)
    self.job_instance = RunningJob.objects.create(
      job=self.job_model,
      user=self.user,
      input=File(self.dummy_file)
    )

  def test_can_submit_job(self):
    self.job_submitter = JobManager(self.job_instance)    
    self.job_submitter.submit_job()
    job_id = self.job_submitter.get_job_id().strip('\n')
    self.assertNotEqual(job_id, '')
  
  def test_can_get_results(self):
    self.job_submitter = JobManager(self.job_instance)    
    self.job_submitter.submit_job()
    time.sleep(10)
    filename = './results.txt'
#    os.remove(filename)
    self.job_instance.runningjob_id = self.job_submitter.job_id
    self.job_submitter.get_results(filename)
    self.assertEqual(os.path.isfile(filename), True)

#  def test_can_get_log(self):

#  def test_can_get_status(self):    

