import paramiko


class SSHSession(object):
	''' 
	Encapsulate an SSH connection to a host, providing methods
	to connect/disconnect, to send/get files and to run commands
	in the remote host.
	'''

	def __init__(self, host, user):
		'''
		Create a new ssh session for (user, key) in host
		'''
		self.host = host
		self.user = user
		self.client = paramiko.SSHClient()
		self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
		#print('Init ssh')

	def _get_rsa_key_from_ssh_agent(self):
		try:
			ssh_agent = paramiko.Agent()
			ssh_keys = ssh_agent.get_keys()
		except paramiko.ssh_exception.SSHException:
			print('Incompatible protocol')
		return ssh_keys

	def connect(self):
		'''
		Connect to the host
		'''
		for key in self._get_rsa_key_from_ssh_agent():
			try:
				self.client.connect(
					hostname=self.host, 
					username=self.user, 
					pkey=key
				)
				return True
			except paramiko.AuthenticationException:
				print('Authentication Error')
		return False

	def connectPWD(self, pwd):
		'''
		Connect to the host with password 
		'''
		try:
			self.client.connect(
				hostname=self.host, 
				username=self.user, 
				password=pwd
			)
			return True
		except paramiko.AuthenticationException:
			print('Authentication Error')
		return False

	def send_file(self, localfile, remotepath, callback):
		'''
		Send a file to the host
		'''
		#print(remotepath)
		sftp = self.client.open_sftp()
		localfile.seek(0)
		status = sftp.putfo(localfile, remotepath, callback=callback, confirm=True)
		sftp.close()
		return status

	def get_file(self, localpath, remotepath, callback):
		'''
		Get a file from the host
		'''
		sftp = self.client.open_sftp()
		sftp.getfo(remotepath, localpath, callback)
		sftp.close()

	def exec_command(self, command):
		'''
		Execute a remote command
		'''
		return self.client.exec_command(command)

	def close(self):
		'''
		Close the opened connection
		'''
		self.client.close()
