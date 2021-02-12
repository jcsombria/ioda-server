class TorqueDriver(object):
  ''' L
  '''

  def __init__(self, transport):
    ''' Init the TorqueExecutor instance
    '''
    self.transport = transport
    self.SEND_JOB = 'send_job'
    self.CANCEL_JOB = 'cancel_job'
    self.GET_JOB_STATUS = 'get_job_status'
    self.commands = {
      self.SEND_JOB: 'qsub {0} -q {1} -v{2}',
      self.CANCEL_JOB: 'qrun {0}',
      self.GET_JOB_STATUS: 'qstat -f {0} | grep job_state | cut -d= -f2'
    }

  def send_file(self, localfile, remotepath, callback):
    '''
    Sends a file to the server
    '''
    self.transport.send_file(localfile, remotepath,
      lambda x, y: self._file_sent(x, y, callback))

  def _file_sent(self, bytes_sent, bytes_total, callback):
    if bytes_sent == bytes_total:
      try:
        callback()
      except:
        pass

  def get_file(self, localpath, remotepath, callback):
    self.transport.get_file(localpath, remotepath,
      lambda x, y: self._file_sent(x, y, callback))

  def send_job(self, job_name, queue, args):
    '''
    Sends job_name to queue
    '''
    send_job = self.get_send_job_command(job_name, queue, args)
    stdin, stdout, stderr = self.transport.exec_command(send_job)
    job_id = self._get_job_id(stdout)

    return job_id

  def get_send_job_command(self, job_name, queue, args):
    '''
    Build the string for send_job command
    '''
    return self.commands[self.SEND_JOB].format(job_name, queue, args)

  def _get_job_id(self, stdout):
    job_id = stdout.read()
    return job_id

  def cancel_job(self, job_name):
    '''
    Try to cancel job_name
    '''
    cancel_job = self.get_cancel_job_command(job_name)
    stdin, stdout, stderr = self.transport.exec_command(cancel_job)

  def get_cancel_job_command(self, job_name):
    '''
    Build the string for cancel_job command
    '''
    return self.commands[self.CANCEL_JOB].format(job_name)

  def get_job_status(self, job_name):
    '''
    Query the system to obtain info about the status of job_name
    '''
    get_job_status = self.get_job_status_command(job_name)
    stdin, stdout, stderr = self.transport.exec_command(get_job_status)
    status = self.parse_get_job_status_response(stdin, stdout, stderr)
    return status

  def get_job_status_command(self, job_name):
    '''
    Build the string for cancel_job command
    '''
    return self.commands[self.GET_JOB_STATUS].format(job_name)

  def parse_get_job_status_response(self, stdin, stdout, stderr):
    '''
    '''
    torque_states = {
      'Q':'queued',
      'H':'held',
      'W':'waiting',
      'R':'running',
      'E':'exiting',
      'C':'completed',
      'T':'transit',
    }
    status_code = stdout.read().strip().decode("utf-8")   
    status = torque_states.get(status_code, 'completed')
    return status
