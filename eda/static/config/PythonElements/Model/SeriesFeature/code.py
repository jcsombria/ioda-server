import pandas as _pandas

def _Model_SeriesFeature(_input=None, Feature='max', _display=False):
    
    if _input is None:
        _output =  { "index" : None, "value": None }

    if Feature=='min':
        _index = _input.idxmin()
    elif Feature=='max':
        _index = _input.idxmax()
    else:
        _index = None

    if _index is None:
        _output = { "index" : None, "value": None }
    else:
        _output = { "index" : _index, "value": _input[_index] }
    
    if (_display):
        print ("<h2>Series "+Feature+":</h2>")
        print ("<h3>Value: ",_output['value'],"</h3>")
        print ("<h3>Index: ",_output['index'],"</h3>")

    return _output


    
