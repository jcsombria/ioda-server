import matplotlib.pyplot as _matplotlib_pyplot
import numpy as _numpy
import os

def _Visualization_MatlabPlot (_input=None, Keyword=None, Index=0, Resolution=(385,576),
  Transpose=False, _display=True):
    '''
        Display a plot extracted from a Matlab file
    '''

    _data = _input[Keyword]
    _vectorImage = _data[Index]
    _image = _numpy.reshape(_vectorImage, Resolution)
    if Transpose: _image = _image.T

    if (_display):
        _counter = 1;
        _name = "_matlabplot_"+str(_counter)+".png"
        while os.path.exists(_name):
            _counter += 1
            _name = "_matlabplot_"+str(_counter)+".png"

        _imgplot = _matplotlib_pyplot.imshow(_image)
        _matplotlib_pyplot.savefig(_name)
        print ("<img src='"+ _name + "' alt='"+_name+"'>")

    return _image
