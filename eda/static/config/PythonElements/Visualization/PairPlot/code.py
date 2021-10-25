import seaborn as _seaborn

def _Visualization_PairPlot (_input, Style="ticks", Hue=None, _display=False):
    '''
        Creates a Seaborn _pairplot
    '''
    _seaborn.set(style=Style)
    _scatterplot = _seaborn.pairplot(_input,hue=Hue)
    if (_display):
        _scatterplot.savefig("_pairplot.png")
        print ("<img src='_pairplot.png' alt='Plot' width='100%' height='100%'>")
    return _scatterplot
