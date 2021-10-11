import tempfile, time, os

from django.core.files import File
from django.contrib.auth.models import User
from django.test import TestCase

from jobs.models import Job, RunningJob
from jobs.drivers.SSHSession import SSHSession
from jobs.drivers.JobManager import JobManager

class Helper(object):

    def create_file(self, data):
        new_file = tempfile.TemporaryFile(mode='w+')
        new_file.write(data)
        new_file.flush()
        return new_file
  

class SSHSessionTest(TestCase):

    def setUp(self):
        # Configure before running the tests
        self.TEST_HOST = '127.0.0.1'
        self.TEST_USER = 'test'
        self.SRC_FILENAME = 'server_path/src_filename.txt'
        self.DST_FILENAME = 'local_path/dst_filename.txt'
        self.helper = Helper()
    
    def connect(self):
        self.session = SSHSession(self.TEST_HOST, self.TEST_USER)
        is_connected = self.session.connect()
        return is_connected
    
    def test_can_connect(self):
        is_connected = self.connect()
        self.assertEqual(is_connected, True)
    
    def test_can_send_file(self):
        expected_response = '1\n1 2\n1 2 3\n1 2 3 4\n'
        file_to_send = self.helper.create_file(expected_response)
        self.connect()
        response = self.session.send_file(file_to_send, self.FILENAME, None)
    
        self.assertEqual(response.st_size, len(expected_response))
    
    def test_can_get_file(self):
        expected_response = '1\n1 2\n1 2 3\n1 2 3 4\n'
        file_to_send = self.helper.create_file(expected_response)
        self.connect()
        file_sent = self.session.send_file(file_to_send, self.FILENAME, None)
        self.session.get_file(self.DST_FILENAME, self.FILENAME, None)
        file_received = open(self.DST_FILENAME, 'r')
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
        # Check this configuration before running tests
        self.TEST_HOST = '127.0.0.1'
        self.TEST_USER = 'test'
        self.RESULTS_FILENAME = './results.txt'
        self.user = User.objects.create_user(
            self.TEST_USER,
            self.TEST_USER,
            '%s@localhost' % self.USER
        )
        self.job_model = Job.objects.create(
            name='suma',
            input='entrada.txt',
            output='salida.txt',
            description='Add numbers',
            host=self.TEST_HOST,
            user=self.TEST_USER,
            job_path='job_path',
            tmp_path='tmp_path',
            results_path='results_path',
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
        filename = self.RESULTS_FILENAME
        #    os.remove(filename)
        self.job_instance.runningjob_id = self.job_submitter.job_id
        self.job_submitter.get_results(filename)
        self.assertEqual(os.path.isfile(filename), True)