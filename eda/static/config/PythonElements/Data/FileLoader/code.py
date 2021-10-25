import pandas as _pandas

def _Data_FileLoader (_input=None, Filename=None, Style=None, _display=False):
    '''
        Reads a Comma Separated Value set of entries from a file
    '''
    if _input is not None:
        _output = _pandas.read_csv(_input)
    else:
        _output = _pandas.read_csv(Filename)
        
    if (_display):
       print ("<h2>Head of data:</h2>")
       print (_output.head());
       print ("<h2>Has null entries?:</h2>")
       print(_output.isnull().any())
       print ("<h2>Description:</h2>")
       print(_output.describe())
       
    return _output
