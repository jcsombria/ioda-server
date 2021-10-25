import os
import pywt
import matplotlib.pyplot as _matplotlib_pyplot

def _Visualization_WaveletPlot (_input=None,
  Wavemother='haar',
  Level=4,
  Mode='symmetric',
  _display=True):
    '''
        Applies a wavelet to a Matlab plot
    '''

    _coeffs2d = pywt.wavedec2(_input, Wavemother, Mode, Level)
    _appcoeffs4 = _coeffs2d[0]

    if (_display):
        _counter = 1;
        _name = "_waveletplot_"+str(_counter)+".png"
        while os.path.exists(_name):
            _counter += 1
            _name = "_waveletplot_"+str(_counter)+".png"

        _imgplot = _matplotlib_pyplot.imshow(_appcoeffs4)
        _matplotlib_pyplot.savefig(_name)
        print ("<img src='"+ _name + "' alt='"+_name+"'>")

    return _input
