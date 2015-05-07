#!/usr/bin/python
import os
from time import sleep
import paramiko

from jobs.popo.SSHSession import SSHSession
from jobs.popo.TorqueDriver import TorqueDriver

class JobManager(object):
  ''' L
  '''

  def __init__(self, job_info):
    self.queue = 'fast'
    self.data_sent = False
    self.data_received = False

    self.root_path = '/home/jchacon/ciemat/'
    self.job_path = self.root_path + 'tareas/' + job_info['name'] + '/'
    self.job_results_path = self.root_path + 'resultados/'
    self.job_tmp_path = self.root_path + 'tmp/'
    self.job_name = job_info['name'] + '.pbs'
    self.job_host = job_info['host']
    self.job_user = job_info['user']
    self.job_input = job_info.get('input', '')
    self.job_input_localfile = job_info.get('localfile', '')
    self.job_output = job_info.get('output', '')
    self.job_id = job_info.get('job_id', '')
    self.driver = self._get_driver()

  def _get_driver(self):
    session = SSHSession(self.job_host, self.job_user)
    session.connect()
    return TorqueDriver(session)

  def submit_job(self):
    '''
    Submit a new job to the server
    '''
    self._prepare_job()
    self._run_job()

  def _prepare_job(self):
    filename = self.job_input
    localfile = self.job_input_localfile
    remotefile = self.job_tmp_path + filename
    self._put_file(localfile, remotefile)

  def _put_file(self, localfile, remotepath):
    def file_sent():
      self._file_sent = True
    self._file_sent = False
    self.driver.send_file(localfile, remotepath, file_sent)
#    while not self._file_sent:
#      pass

  def _run_job(self):
    job = self.job_path + self.job_name
    self.job_id = self.driver.send_job(job, self.queue).decode('utf-8')

  def get_results(self, localfile):
    '''
    Get the results from the server
    '''
    remotefile = self.job_results_path + self.job_id + '/' + self.job_output
    self._get_file(localfile, remotefile)

  def _get_file(self, localfile, remotefile):
    def file_received():
      self._file_received = True
    self._file_received = False
    print(localfile)
    print(remotefile)
    self.driver.get_file(localfile, remotefile, file_received)
#    while not self._file_received:
#      pass

  def get_status(self):
    '''
    Get the job status
    '''
    return self.driver.get_job_status(self.job_id)

  def set_job_id(self, job_id):
    self.job_id = job_id

  def get_job_id(self):
    '''
    Get the job id
    '''
    return self.job_id
