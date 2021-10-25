class Program_LogicalComparison:
    COMPARISONS = {
        '>' : lambda a, b : a >  b,
        '>=': lambda a, b : a >= b,
        '<' : lambda a, b : a <  b,
        '<=': lambda a, b : a <= b,
        '==': lambda a, b : a == b,
        '!=': lambda a, b : a != b
        }

    def __init__(self, name):
        self.op1 = None
        self.op2 = None
        self.comparison = None
        self.result = None

    def setProperty(self, propertyName, propertyValue):
        if   propertyName=='Operand1':
            self.op1 = propertyValue
        elif propertyName=='Operand2':
            self.op2 = propertyValue
        elif propertyName=='Comparison':
            if propertyValue in COMPARISONS:
                self.comparison = propertyValue

    def getProperty(self, propertyName, propertyValue):
        if propertyName=='Result':
            return self.result
        return None 

    def run(self):
        self.result = COMPARISONS[self.comparison](self.op1,self.op2)

