#!/usr/bin/python
from time import sleep
import paramiko

from jobs.popo.SSHSession import SSHSession
from jobs.popo.TorqueExecutor import TorqueExecutor
from jobs.popo.JobLoader import JobLoader

class JobManager(object):
  ''' L
  '''

  def __init__(self, job_file):
    self.localpath = './jobs_description/'
    
    self.queue = 'fast'
    self.data_sent = False
    self.data_received = False
    self.load(job_file)        
  
  def load(self, job_file):
    ''' Load a new job from a config file
    '''
    job_description = JobLoader(job_file)
    self.job_options = job_description.get_options()
    host = self.job_options['host']
    user = self.job_options['user']
    self.jobmanager = self.get_job_manager(host, user)

  def get_job_manager(self, host, user):
    self.key = self._get_rsa_key_from_ssh_agent()
    session = SSHSession(host, user, self.key)
    session.connect()
    jobmanager = TorqueExecutor(session)
    return jobmanager

  def _get_rsa_key_from_ssh_agent(self):
    try:
      ssh_agent = paramiko.Agent()
      ssh_keys = ssh_agent.get_keys()
    except paramiko.ssh_exception.SSHException:
      print('incompatible protocol')

    for key in ssh_keys:
      if(key.get_name() == 'ssh_rsa'):
        return key

  def submit_job(self):
    ''' Submit a new job to the server
    '''
    self._prepare_job()
    self._run_job()

  def _prepare_job(self):
    ''' Prepare the job to be ran
    '''
    job_path = self.job_options['job_path']
    filename = self.job_options['input']
    localfile = self.localpath + filename
    remotefile = self.job_options['tmp_path'] + filename
    self.put_file(localfile, remotefile)

  def put_file(self, localfile, remotefile):
    ''' Send a file to the server
    '''
    def file_sent():
      self._file_sent = True
    self._file_sent = False
    self.jobmanager.send_file(localfile, remotefile, file_sent)
    while not self._file_sent:
      pass

  def _run_job(self):
    ''' Run the job
    '''
    job = self.job_options['job_path'] + self.job_options['name']
    self.job_id = self.jobmanager.send_job(job, self.queue).decode('utf-8')

  def get_results(self, localfile):
    ''' Get the results from the server
    '''
    results_path = self.job_options['results_path']
    output_files = self.job_options['output']
    remotefile = results_path + self.job_id + '/' + output_files
    self.get_file(localfile, remotefile)

  def get_file(self, localfile, remotefile):
    ''' Get a file  from the server
    '''
    def file_received():
      self._file_received = True
    self._file_received = False
    self.jobmanager.get_file(localfile, remotefile, file_received)
    while not self._file_received:
      pass

  def get_status(self):
    return self.jobmanager.get_job_status(self.job_id)

  def set_job_id(self, job_id):
    self.job_id = job_id

  def get_job_id(self):
    return self.job_id
