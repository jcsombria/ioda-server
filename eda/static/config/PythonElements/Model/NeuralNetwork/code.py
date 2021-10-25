import matplotlib.pyplot as _matplotlib_pyplot
import numpy as _numpy
import pywt
from sklearn.svm import SVC

def _Model_SVM (_input=None,
  Keyword=None,
  Resolution=(385,576),
  Transpose=True,
  Wavemother='haar',
  Level=4,
  Mode='symmetric',
  Ones=None,
  _display=True):
    '''
        Applies SVM to images from a Matlab file
    '''

    _data = _input[Keyword]

    _dataw=[]

    # extract characteristics
    for i in range(len(_data)):
      _imageVector=_data[i]
      _image = _numpy.reshape(_imageVector, Resolution)
      _image = _image.T
      _coeffs2d = pywt.wavedec2(_image, Wavemother, Mode, Level)
      _appcoeffs4 = _coeffs2d[0]
      _appcoeffs4array = _numpy.reshape(_appcoeffs4,_appcoeffs4.size)
      if len(_dataw)<1: _dataw = _appcoeffs4array
      else: _dataw = _numpy.vstack([_dataw,_appcoeffs4array])


    # prepare data
    _labels = -_numpy.ones((len(_data),1))
    _labels[Ones] = 1

    # train
    _clf = SVC(gamma='auto')
    _clf.fit(_dataw, _labels)

    SVC(C=1.0, cache_size=200, class_weight=None, coef0=0.0,
        decision_function_shape='ovr', degree=3, gamma='auto', kernel='rbf',
        max_iter=-1, probability=False, random_state=None, shrinking=True,
        tol=0.001, verbose=False)

    # test
    if (_display):
        _pLabels = _clf.predict(_dataw)
        _pLabels = _numpy.reshape(_pLabels,(len(_pLabels),1))

        print('<h2>Real class</h2>')
        print('<p>')
        print (_labels.T)
        print ('</p>')
        print('<h2>Predicted class</h2>')
        print('<p>')
        print (_pLabels.T)
        print ('</p>')

    return _clf
