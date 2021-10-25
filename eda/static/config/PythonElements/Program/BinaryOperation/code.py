import math 

class Program_BinaryOperation:
    OPERATIONS = {
        'plus':         lambda a, b : a + b,
        'minus':        lambda a, b : a - b,
        'times':        lambda a, b : a * b,
        'divided by':   lambda a, b : a / b,
        'minimum':      lambda a, b : math.min(a,b),
        'maximum':      lambda a, b : math.max(a,b),
        'power':        lambda a, b : math.pow(a,b),
        'atan2':        lambda a, b : math.atan2(a,b)
        }

    def __init__(self, name):
        self.op1 = None
        self.op2 = None
        self.operation = None
        self.result = None

    def setProperty(self, propertyName, propertyValue):
        if   propertyName=='Operand1':
            self.op1 = propertyValue
        elif propertyName=='Operand2':
            self.op2 = propertyValue
        elif propertyName=='Operation':
            if propertyValue in OPERATIONS:
                self.operation = propertyValue

    def getProperty(self, propertyName, propertyValue):
        if propertyName=='Result':
            return self.result
        return None 

    def run(self):
        self.result = OPERATIONS[self.operation](self.op1,self.op2)

