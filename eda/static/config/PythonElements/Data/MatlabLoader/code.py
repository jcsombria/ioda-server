import scipy.io as _scipy_io

def _Data_MatlabLoader (_input=None, Filename=None, Keywords=None, _display=False):
    '''
        Loads data from a Matlab file
    '''
    if _input is not None:
        _output = _scipy_io.loadmat(_input)
    else:
        _output = _scipy_io.loadmat(Filename)

    if Keywords is not None:
        _output = { key: _output[key] for key in Keywords }

    if (_display):
       print ("<h2>Keys in Matlab file:</h2>")
       print (sorted(_output.keys()))

    return _output
