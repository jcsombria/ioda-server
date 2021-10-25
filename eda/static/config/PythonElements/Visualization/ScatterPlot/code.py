import seaborn as _seaborn

def _Visualization_ScatterPlot (_input, Style="ticks", Hue=None, _display=True):
    '''
        Creates a Seaborn scatterplot
    '''
    _seaborn.set(style=Style)
    # "Melt" the dataset to "long-form" or "tidy" representation
    _inputMelted = _pandas.melt(_input, Hue, var_name="measurement")

    # Draw a categorical scatterplot to show each observation
    _scatterplot = _seaborn.swarmplot(x="measurement", y="value", hue=Hue, data=_inputMelted)

    #_scatterplot = _seaborn.scatterplot(_input,hue=Hue)
    if (_display):
        _scatterplot.get_figure().savefig("_scatterplot.png")
        print ("<img src='_scatterplot.png' alt='Plot' width='100%' height='100%'>")
    return _input
