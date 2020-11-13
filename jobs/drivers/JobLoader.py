import configparser
import re

class JobLoader(object):
  ''' Loads a 'job' descriptor file.
  '''

  def __init__(self, filename):
    self.SECTION_NAME = 'Job'
    self._config = configparser.ConfigParser()
    self._option = {}
    self.load(filename)

  def load(self, filename):
    ''' Loads a 'job' descriptor file
    '''
    self._config.read(filename)
    options = self._config.options(self.SECTION_NAME)
    for option in options:
      raw_value = self._config.get(self.SECTION_NAME, option)
      if option == 'input':
        re.findall("''", raw_value)
        value = raw_value
        print(option, ':', value)
      else:
        value = raw_value
      self._option[option] = value

  def get_options(self):
    ''' Return a dictionary object with the options loaded from the file
    '''
    return self._option
