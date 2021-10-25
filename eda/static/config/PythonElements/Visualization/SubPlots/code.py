import pandas as _pandas
import matplotlib.pyplot as _matplotlib_pyplot
import uuid as _uuid

def _Visualization_SubPlots (*_inputs, **_kwargs):
    '''
        Creates a plot of a series and (optionally) a feature
    '''
            
    _header = None
    _rows = 1
    _cols = 1
    _display = None
    for _key, _value in _kwargs.items():
        if _key=="Header":
            _header = _value
        elif _key== "Rows":
            _rows = _value
        elif _key== "Columns":
            _cols = _value
        elif _key== "_display":
            _display = _value

    _grid = ""
    if _header is not None:
        _grid += "'" + ("header "*_cols) +"' "
    _counter = 1
    for _row in range(_rows):
        _grid += "'"
        for _col in range(_cols):
            _grid += "item"+str(_counter)+" "
            _counter +=1
        _grid += "'"
        
    _html = "<div style=\"display: grid;grid-gap: 10px;padding: 10px; grid-template-areas:"+_grid+";\">\n"
 
    if _header is not None:
        _html += "<div style=\"grid-area:header; text-align: center;background-color: rgba(255, 255, 255, 0.8);padding: 20px 0;font-size: 20px;\">"+_header+"</div>\n"

    _counter = 1
    for _input in _inputs:
      _html += "  <div style=\"grid-area:item"+str(_counter)+";padding: 20px 0;\">\n"+str(_input)+"\n  </div>\n"
      _counter +=1

    if (_display):
        print (_html)
    
    return _html