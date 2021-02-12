from celery import Celery

#app = Celery('tasks', backend='rpc://', broker='pyamqp://fusion:fusion@localhost/fusion_server')
#app = Celery('tasks', backend='rpc://', broker='pyamqp://fusion:fusion@hpcserver.dia.uned.es/fusion_server')
app = Celery('tasks', backend='rpc://', broker='pyamqp://fusion:fusion@62.204.199.200/fusion_server')

@app.task
def add(x, y):
    return x + y

def callMatlab(task, params, sessionID, savepath, runpath)
	return send_task("tasks.MatlabCallAsync", ['a', False, 'b', 'c'])
