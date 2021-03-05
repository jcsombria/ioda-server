import paramiko
from pip._internal.cli import status_codes
#import jobs.drivers.SSHSession

class MatlabDriver(object):
	''' 
	Runs Matlab scripts or executable with parameters using SSHSession, that
	encapsulates an SSH connection to a host.
	'''

	def __init__(self, transport):
		'''
		Create a new ssh session for (user, key) in host
		'''
		#print('Init matlab driver')
		self.transport = transport #SSHconnection = jobs.drivers.SSHSession(host, user)
		#if (pwd==''):
		#	return self.SSHconnection.connect(pwd)
		#	return self.SSHconnection.connect(pwd)
		#else:
		#	return self.SSHconnection.connect()
		self.SEND_JOB = 'send_job'
		self.CANCEL_JOB = 'cancel_job'
		self.GET_JOB_STATUS = 'get_job_status'
		self.commands = {
			self.SEND_JOB: 'python3.6 runUserScript.py -t {0} -p {1} &',
			self.CANCEL_JOB: 'python3.6 runUserScript.py -k {0}',
			self.GET_JOB_STATUS: 'cat {0}status{1}.txt'
		}
		self.job_id = 0

	def send_file(self, localfile, remotepath, callback):
		'''
		Sends a file to the server
		'''
		self.transport.send_file(localfile, remotepath,
			lambda x, y: self._file_sent(x, y, callback))
		
		
	def get_file(self, localpath, remotepath, callback):
		self.transport.get_file(localpath, remotepath,
			lambda x, y: self._file_sent(x, y, callback))

	def send_job(self, job_name, queue, args):
		'''
		Execute a remote task using the name of the task
		'''
		send_job = self.get_send_job_command(job_name, args)
		#send_job = self.get_send_job_command()
		#print(send_job)
		stdin, stdout, stderr = self.transport.exec_command(send_job)
		job_id = self._get_job_id(stdout)
		self.job_id = job_id
		return job_id

	def get_send_job_command(self, job_name, args):
	#def get_send_job_command(self):
		'''
		Build the string for send_job command
		'''
		#return self.commands[self.SEND_JOB].format(job_name, args)
		
		#print(self.commands[self.SEND_JOB].format())
		return self.commands[self.SEND_JOB].format(job_name.split('/')[1], args.split('=')[1])
	
	def _get_job_id(self, stdout):
		job_id = stdout.read()
		#print(job_id)
		return job_id
	
	def cancel_job(self, job_name):
		'''
		Try to cancel job_name
		'''
		cancel_job = self.get_cancel_job_command(self.job_id)
		#print(cancel_job)
		stdin, stdout, stderr = self.transport.exec_command(cancel_job)

	def get_cancel_job_command(self, job_name):
		'''
		Build the string for cancel_job command
		'''
		return self.commands[self.CANCEL_JOB].format(job_name)

	def get_job_status(self, job_name, remotePath = None):
		'''
		Query the system to obtain info about the status of job_name
		'''
		get_job_status = self.get_job_status_command(job_name, remotePath)
		#print(get_job_status)
		stdin, stdout, stderr = self.transport.exec_command(get_job_status)
		status = self.parse_get_job_status_response(stdin, stdout, stderr)
		return status

	def get_job_status_command(self, job_name, remotePath = None):
		'''
		Build the string for cancel_job command
		'''
		#print('retrieved job id : ' + str(job_name))
		return self.commands[self.GET_JOB_STATUS].format(remotePath,job_name)
		
	def parse_get_job_status_response(self, stdin, stdout, stderr):
		'''
		'''
		#torque_states = {
		#torque_states = {
		#	'A':'running',
		#	'I':'waiting',
		#	'Z':'canceled',
		#	'E':'exiting',
		#	'T':'stopped'
		#}
		status_code = stdout.read().strip().decode("utf-8")	 
		#print(status_code)
		if(status_code == ''):
			status = 'waiting'
		#else:
		#status = torque_states.get(status_code, 'completed')
		return status_code
	
	def _file_sent(self, bytes_sent, bytes_total, callback):
		if bytes_sent == bytes_total:
			try:
				callback()
			except:
				pass
