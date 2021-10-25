import os as _os
import pandas as _pandas
import numpy as _numpy

def _Data_DischargeLoader (_input=None, Campaign=None, Discharge=None, DataDir="data/Campaigns/", _display=False):
    '''
        Loads data of a given campaign and discharge and fills in a DataFrame
        - _input" can be a dict of two types:
            { 'filename' , 'skiprows'} indicating a single csv file with a DataFrame with all signals indexed with the same time
            { 'campaign', 'discharge' } for a set of files, each with a signal with perhaps different times
        - _input can be None, in which case Campaign and Discharge parametres are used as substitue of the second dict type
            '''
    _frame = None
    _filename = None
    
    if _input is not None:
        
        if 'filename' in _input:
            _filename = _input['filename']
            if 'skiprows' in _input:
                _skiprows = _input['skiprows']
            else:
                _skiprows = 0
            _frame = pd.read_csv(DataDir+str(_filename),skiprows=_skiprows)
        
        else: # try dict with campaing and discharge  
            if 'campaign' in _input:
                Campaign = _input['campaign']
            if 'discharge' in _input:
                Discharge = _input['discharge']

    if _frame is None:
        Campaign  = str(Campaign)
        Discharge = str(Discharge)
    
    _dir = DataDir+Campaign+"/"
    _files=[]
    with _os.scandir(_dir) as _iterator:
        for _entry in _iterator:
            if _entry.is_file() and Discharge+'_' in _entry.name:
                _name = _entry.name.split('.')[0]
                _signal = _name.split('_')[-1]
                _files.append( { "signal" : _signal, "file" : _entry.name}) 
    
    _files = sorted(_files, key=lambda k: k['signal']) 

    _list = []
    for _entry in _files:
        _file   = _entry['file']
        _signal = _entry['signal']
        _data = _pandas.read_csv(_dir+_file, sep=" ", header=None, skipinitialspace=True)
        _data.columns = ['time_'+_signal, 'signal_'+_signal]
        _list.append(_data)

    _frame = _pandas.concat(_list, axis=1)

    if (_display):
        if _filename is not None:
            print ("<h2>Data from file "+_filename+"</h2>")
        else: 
            print ("<h2>Data for discharge "+Discharge+" in campaign "+Campaign+"</h2>")
        print (_frame)

    return _frame
