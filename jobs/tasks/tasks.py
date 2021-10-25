from celery import Celery, chain, signature
from celery.execute import send_task
import base64
import json
import os
from pathlib import Path

app = Celery('tasks', backend='rpc://', broker='pyamqp://fusion:fusion@62.204.199.200/fusion_server')

@app.task
def add(x, y):
    return x + y

@app.task
def multiply(x, y):
    return x * y

class Response(object):
    
    def __init__(self, result):
        print(result)
        self.result = result
        
    def saveAsFile(self, path):
        if self.result['format'] == 'bundle':
            name = self.result['name']
            data = self.result['data']
            filename = Path(os.path.join(path, name))
            filename.touch(exist_ok=True)
            with open(filename, 'wb') as f:
                try:
                    decoded = base64.b64decode(data)
                    f.write(decoded)
                except Exception as e:
                    print(e)
        
# data = json.loads('{"format":"inline","name":"","data":"\'C15a\',0.001,65988,6"}');
# task1 = signature('tasks.resample', [data])
# task2 = signature('tasks.maximum_matlab')
# #task2 = signature('tasks.maximum_python')
# task3 = signature('tasks.visualize')
# result = chain(task1, task2, task3) ()
# response = result.get(timeout=60)
# Response(response).saveAsFile('.')




if __name__== "__main__":
    try:
        image = '{"format":"inline","name":"","data":"\'C15a\',0.001,65988,6"}'
        ins = json.loads(image)

        task1 = signature('tasks.nodoMatlab')
        task2 = signature('tasks.nodoPython')
        
        result = chain(task1, task2) ()
        response = result.get(timeout=60)
        Response(response).saveAsFile('.')
        #BASE_DIR + '/' + settings.MEDIA_ROOT
    except:
        print('Timeout expired')