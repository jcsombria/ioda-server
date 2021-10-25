import math

class Program_Function1D:
    FUNCTIONS = {
        'exp':  lambda a : math.exp(a),
        'sqrt': lambda a : math.sqrt(a),
        'log':  lambda a : math.log(a)
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

