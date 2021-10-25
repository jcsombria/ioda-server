import math

class Program_Function1D:
    FUNCTIONS = {
        'min':  lambda a,b : math.min(a,b),
        'max': lambda a,b : math.max(a,b),
        'pow': lambda a,b : math.pow(a,b),
        'atan': lambda a,b : math.atan(a,b)
        }

    def __init__(self, name):
        self.argument = None
        self.function = None
        self.result = None

    def setProperty(self, propertyName, propertyValue):
        if   propertyName=='Argument':
            self.argument = propertyValue
        elif propertyName=='Function':
            if propertyValue in FUNCTIONS:
                self.function = propertyValue

    def getProperty(self, propertyName, propertyValue):
        if propertyName=='Result':
            return self.result
        return None 

    def run(self):
        self.result = FUNCTIONS[self.function](self.argument)

