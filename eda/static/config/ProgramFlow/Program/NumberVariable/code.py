class Program_NumberVariable:
    def __init__(self, name):
        self.value = None

    def setProperty(self, propertyName, propertyValue):
        if propertyName=='Value':
            self.value = propertyValue

    def getProperty(self, propertyName, propertyValue):
        if propertyName=='Value':
            return self.value
        return None 

    def run(self):
        pass

