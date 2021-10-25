class Program_PolishCalculation:
    OPERATIONS = {
        'plus':         lambda a, b : a + b,
        'minus':        lambda a, b : a - b,
        'times':        lambda a, b : a * b,
        'divided by':   lambda a, b : a / b,
        'pow':          lambda a, b : Math.pow(a,b),
        'atan2':        lambda a, b : Math.atan2(a,b),
        'sqrt':         lambda a : Math.sqrt(a),
        'exp':          lambda a : Math.exp(a),
        'log':          lambda a : Math.log(a),
        'sin':          lambda a : Math.sin(a),
        'cos':          lambda a : Math.cos(a),
        'tan':          lambda a : Math.tan(a),
        'asin':          lambda a : Math.asin(a),
        'acos':          lambda a : Math.acos(a),
        'atan':         lambda a : Math.atan(a),
        }

    def __init__(self, name):
        self.op1 = None
        self.op2 = None
        self.op3 = None
        self.op4 = None
        self.op5 = None
        self.op6 = None
        self.op7 = None
        self.op8 = None
        self.op9 = None
        self.op10= None
        self.operator1 = None
        self.operator2 = None
        self.operator3 = None
        self.operator4 = None
        self.operator5 = None
        self.operator6 = None
        self.operator7 = None
        self.operator8 = None
        self.operator9 = None
        self.operator10 = None
        self.result = None

    def setProperty(self, propertyName, propertyValue):
        if   propertyName=='Operand1': self.op1 = propertyValue
        elif propertyName=='Operand2': self.op2 = propertyValue
        elif propertyName=='Operand3': self.op3 = propertyValue
        elif propertyName=='Operand4': self.op4 = propertyValue
        elif propertyName=='Operand5': self.op5 = propertyValue
        elif propertyName=='Operand6': self.op6 = propertyValue
        elif propertyName=='Operand7': self.op7 = propertyValue
        elif propertyName=='Operand8': self.op8 = propertyValue
        elif propertyName=='Operand9': self.op9 = propertyValue
        elif propertyName=='Operand10': self.op10 = propertyValue
        elif propertyValue in OPERATIONS:
            if   propertyName=='Operator1': self.operator1 = propertyValue
            elif propertyName=='Operator2': self.operator2 = propertyValue
            elif propertyName=='Operator3': self.operator3 = propertyValue
            elif propertyName=='Operator4': self.operator4 = propertyValue
            elif propertyName=='Operator5': self.operator5 = propertyValue
            elif propertyName=='Operator6': self.operator6 = propertyValue
            elif propertyName=='Operator7': self.operator7 = propertyValue
            elif propertyName=='Operator8': self.operator8 = propertyValue
            elif propertyName=='Operator9': self.operator9 = propertyValue
            elif propertyName=='Operator10': self.operator10 = propertyValue

    def getProperty(self, propertyName, propertyValue):
        if propertyName=='Result':
            return self.result
        return None 

    def run(self):
        # TODO implement it correctly
        self.result = OPERATIONS[self.operation](self.op1,self.op2)

