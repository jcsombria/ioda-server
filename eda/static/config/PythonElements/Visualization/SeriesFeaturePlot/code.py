import pandas as _pandas
import matplotlib.pyplot as _matplotlib_pyplot
import uuid as _uuid

def _Visualization_SeriesFeaturePlot (*_inputs, **_kwargs):
    '''
        Creates a plot of a series and (optionally) a feature
    '''
    _matplotlib_pyplot.rcParams['figure.figsize'] = [20, 10]
    _matplotlib_pyplot.rcParams['figure.dpi'] = 300
            
    _title = None
    _featureStyle = "ro"
    _markerSize = 10
    _display=None
    
    for _key, _value in _kwargs.items():
        if _key=="Title":
            _title = _value
        elif _key== "FeatureStyle":
            _featureStyle = _value
        elif _key== "MarkerSize":
            _markerSize = _value
        elif _key== "_display":
            _display = _value
            
        # prepare a plot with subplots in a column
    _matplotlib_pyplot.clf()
    
    if _title is None:
        _matplotlib_pyplot.title('Plot of series and feature')
    else:
        _matplotlib_pyplot.title(_title)

    for _input in _inputs: 
        if isinstance(_input, _pandas.Series):
            _matplotlib_pyplot.plot(_input)
        elif isinstance(_input, dict):
            _x = _input['index']
            _y = _input['value']
            _matplotlib_pyplot.plot(_x,_y, _featureStyle,markersize=_markerSize)
                     
    _outputFile = "_plot"+str(_uuid.uuid4())+".jpg"
    _matplotlib_pyplot.savefig(_outputFile);
    _matplotlib_pyplot.close()

    _output = "<img src='"+_outputFile+"' alt='Plot' width='100%' height='50%'>"
    if (_display):
        print (_output)
    
    return _output