
import pandas as _pandas

def _Model_SignalSelection(_input=None, Signal=None, 
                           UpperLimit=None, UpperValue=None, 
                           LowerLimit=None, LowerValue=None, 
                           _display=False):
    '''
    Selects a signal from the discharge DataFrame and 
    optionally saturates it
    '''
    if _input is None:
        return _pandas.Series()

    if Signal is None:
        return _pandas.Series()
    
    #_key = "signal "+"{0:0=2d}".format(Signal)
    _series = _input[Signal]
    
    if UpperLimit is not None:
        if UpperValue is None:
            UpperValue = UpperLimit
        _series[_series > UpperLimit] = UpperValue

    if LowerLimit is not None:
        if LowerValue is None:
            LowerValue = LowerLimit
        _series[_series < LowerLimit] = LowerValue

    if (_display):
        print ("<h2>Series after saturation for "+ Signal+"</h2>")
        print (_series)

    return _series

    
