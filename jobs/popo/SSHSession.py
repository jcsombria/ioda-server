import paramiko


class SSHSession(object):
  ''' Encapsulates an SSH connection to a host, providing methods
      to connect/disconnect, to send/get files and to run commands in the
      remote host.
  '''

  def __init__(self, host, user, key):
    ''' Create a new ssh session for (user, key) in host
    '''
    self.host = host
    self.user = user
    self.key = key
    self.client = paramiko.SSHClient()
    self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

  def connect(self):
    ''' Connect to the host
    '''
    self.client.connect(
      hostname=self.host, 
      username=self.user, 
      pkey=self.key
    )

  def send_file(self, localpath, remotepath, callback):
    ''' Send a file to the host
    '''
    sftp = self.client.open_sftp()
    sftp.put(localpath, remotepath, callback)
    sftp.close()

  def get_file(self, localpath, remotepath, callback):
    ''' Get a file from the host
    '''
    sftp = self.client.open_sftp()
    sftp.get(remotepath, localpath, callback)
    sftp.close()

  def exec_command(self, command):
    ''' Execute a remote command
    '''
    return self.client.exec_command(command)

  def close(self):
    ''' Close the opened connection
    '''
    self.client.close()
