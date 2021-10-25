import pandas as _pandas
import numpy as _numpy

def _Data_DischargePreprocessing (_input, SamplingPeriod=0.001, _display=False):
    '''
        Converts a DataFrame with columns 'time_xxx', 'signal_xxx' ... into a DataFrame
        with the same time frame and cols 'signal_xxx' ...
        The time fram spans from the common minimum to the commom maximum and is sampled at a given period 
    '''
    
    _list = []
    _tmin = -1
    _tmax = float("inf")

    for _col in _input:
        if _col.startswith('time_'):
            _signal = _col[5:]
            _data = _input[[_col, 'signal_'+_signal]].dropna()
            _tmin = max(_tmin,_data[_col].min())
            _tmax = min(_tmax,_data[_col].max())
            _data.set_index(_col,inplace=True)
            _list.append(_data)

    _time = _numpy.arange(_tmin,_tmax,SamplingPeriod)

    for _index, _data in enumerate(_list):
        _data = _data.reindex(_data.index.union(_time))
        _data.interpolate(method='values',inplace=True)
        _list[_index] = _data.reindex(_time)

    _frame = _pandas.concat(_list, axis=1)

    if (_display):
       print ("<h2>Discharge data preprocessed from input</h2>")
       print ("<h3>Samplig period = "+str(SamplingPeriod)+"</h3>")
       print (_frame)

    return _frame

