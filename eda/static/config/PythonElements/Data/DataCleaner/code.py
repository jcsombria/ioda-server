import pandas as _pandas

def _Data_DataCleaner_ (_input, DropNA=False, DropAxis=0, DropHow='any', DropThresh=None, 
                                FillNA=False, FillValue=None, FillMethod=None, FillAxis=None, FillLimit=None,
                                _display=False):
    '''
    axis=0, how='any', thresh=None, subset=None,
               inplace=False
        Applies dropna and/or fillna
    '''
    if DropNA :
        _input.dropna(axis=DropAxis,how=DropHow,thresh=DropThresh)
    
    if FillNA :
        _input.fillna(axis=FillAxis,method=FillMethod,value=FillValue, limit=FillLimit)

    if (_display):
        print (_input.head());
    return _input
