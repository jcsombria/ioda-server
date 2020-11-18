#!/usr/bin/python
import os
from time import sleep
import paramiko
import uuid

from jobs.drivers.SSHSession import SSHSession
from jobs.drivers.TorqueDriver import TorqueDriver

class JobManager(object):
  ''' L
  '''

  def __init__(self, job_instance):
    self.queue = 'fast'
    self.job = job_instance
    self.job_model = job_instance.job
    self.job_id = uuid.uuid4()
    self.driver = self._get_driver()  

  def _get_driver(self):
    session = SSHSession(self.job_model.host, self.job_model.user)
    session.connect()
    return TorqueDriver(session)

  def submit_job(self):
    '''
    Submit a new job to the server
    '''
    self._prepare_job()
    self._run_job()

  def _prepare_job(self):
    localfile = self.job.input
    remotefile = self._get_name_for_sending(self.job_model.input)
    self.driver.send_file(localfile, remotefile, None)

  def _get_name_for_sending(self, name):
    return self.job_model.tmp_path + str(self.job_id) + '_' + name

  def _run_job(self):
    job = self._get_job_path()
    args = 'INPUT_PREFIX=%s_' % self.job_id
    self.job_id = self.driver.send_job(job, self.queue, args).decode('utf-8').strip('\n')

  def _get_job_path(self):
    return self.job_model.job_path + self.job_model.name + '/' + self.job_model.name + '.pbs'

  def get_results(self, localfile):
    '''
    Get the results from the server
    '''
    remotefile = self.job_model.results_path + self.job.runningjob_id + '/' + self.job_model.output
    print(remotefile)
    self.driver.get_file(localfile, remotefile, None)

  def get_log(self, localfile):
    '''
    Get the log from the server
    '''
    remotefile = self.job_model.results_path + self.job.runningjob_id + '/log.txt'
    print(remotefile)      
    self.driver.get_file(localfile, remotefile, None)

  def get_status(self):
    '''
    Get the job status
    '''
    return self.driver.get_job_status(self.job.runningjob_id)

  def set_input_file(self, input_file):
    self.job_input_file = input_file 
  
  def set_job_id(self, job_id):
    self.job_id = job_id

  def get_job_id(self):
    '''
    Get the job id
    '''
    return self.job_id
