from __future__ import annotations
import json
import random as rnd
import time

from eda.models import Element
from celery import Celery

BROKER_URL = 'amqp://guest:guest@rabbitmq'
# BROKER_URL = 'amqp://fusion:fusion@62.204.199.200/fusion_server'
BACKEND    = 'rpc://'

class Graph:
    ''' A graph representing an algorithm that can be ran '''

    def __init__(self, graph: dict) -> None:
        self.originalGraph = graph
        self.graphInformation = {}
        self.nodes = []
        self.resources = []
        self.run_information = []
        [self.addNode(n) for n in graph['node_list']]
        [self.addConnection(c) for c in graph['connection_list']]
 
    def run(self) -> dict:
        print('Running graph ' + self.originalGraph['name'])
        startTime = time.time()
        runnableNodes = self.findRunnableNodes()
        print('Runnable nodes:')
        while len(runnableNodes) > 0:
            for n in runnableNodes:
                try:
                    print('Next Node to run: ', n.getID())
                    targetInfo = n.run()
                    self.run_information.append(targetInfo)
                    self.resources.append(int(10000*rnd.random()))
                except Exception as e:
                    print('Exception running node: ', n.getID())
                    print(e)
                    self.graphInformation['code'] = self.graphInformation['code'] + "Error " + 'Exception running node: ', str(n.getID())
            runnableNodes = self.findRunnableNodes()
        stopTime = time.time()
        self.graphInformation.update({
            'start': startTime,
            'end': stopTime,
            'lapsed': stopTime - startTime,
            'output': "google.com"
        })
        if not 'code' in self.graphInformation:
            self.graphInformation['code'] = "Graph run Ok"
        return {
            'graph': self.originalGraph,
            'results': {
                'resources': self.resources,
                'graph': self.graphInformation,
                'nodes': self.run_information
            }
        }

    def addNode(self, n: dict) -> None:
        self.nodes.append(Node(n))

    def addConnection(self, info: dict) -> None:
        source = self.findNodeByID(info['source'])
        target = self.findNodeByID(info['target'])
        Connection(source, target, info)

    def findNodeByID(self, id: str) -> Node:
        nodes = [n for n in self.nodes if n.getID() == id]
        return nodes[0] if len(nodes) > 0 else None

    def findRunnableNodes(self) -> list[Node]:
        result = []
        for n in self.nodes:
            isNodeReady = n.canRun()
            print('Node : ', n.getID(), ' is ready? : ', isNodeReady)
            if(isNodeReady):
                result.append(n)
        return [n for n in self.nodes if n.canRun()]


class Node:
    '''A node that represents a task'''
    info: dict = None
    visited: bool = False
    connections: list[Connection] = []
    element: Element = None

    def __init__(self, info: dict) -> None:
        self.info = info
        self.visited = False
        self.element = Element.objects.filter(id=self.getType()).first()
        self.connections = []

    def canRun(self) -> bool:
        if self.visited:
            return False
        if len(self.getInConnections()) == 0:
            return True
        expectedInputs = self.getExpectedInputs()
        properties = [p['name'] for p in self.getProperties()]
        inputs = [c.getTargetProperty() for c in self.getInConnections() if c.getVisited()]
        data = properties + inputs
        intersection = set(expectedInputs).intersection(data)
        isReady =  len(intersection) == len(expectedInputs) 
        #print("Node : ", node.getID(), " needs the inputs : [", expectedInputs, "] and has ", data)
        return isReady

    #Now the execution is blocked while waiting the results, just for testing
    def run(self) -> dict:
        self.visited = True
        app = Celery('tasks', backend=BACKEND, broker=BROKER_URL)
        node = 'tasks.worker_Python.binaryNode'
        taskName = self.translateToMachineTaskName()
        # # TO DO: Get rid of this
        if('self.' in taskName):
            targetParams = { p['name']:p['value'] for p in self.getProperties() }
            startTime = time.time()
            result = getattr(self, taskName.split('.')[1])(json.dumps(targetParams))
            stopTime = time.time()
            self.updateConnections(result['data']['output'])
            return {
                'node'   : self.getID(),
                'start'  : startTime,
                'end'    : stopTime,
                'lapsed' : stopTime - startTime,
                'code'   : 'Node run OK',
                'output' : result
            }
        inlineParams = ','.join(self.getTargetParams()).replace("'", '')
        taskInput = self.formatInputs(inlineParams)
        if taskName == 'C/FPGA/fpga':
            taskInput = '{"format":"inline","name":"","data":"misdatos/hola_mundo.txt"}'
        if taskName == 'basicOps._operation':
            node = 'tasks.worker_Python.nodoPython'
        result = app.send_task(node, args=(taskName, taskInput))
        r = result.get()
        error = r['data']['error']
        code = 'Node run OK' if not error else error
        self.updateConnections(r['data']['output'])
        return {
            'node'   : self.getID(),
            'start'  : r['info']['startTime'],
            'end'    : r['info']['stopTime'],
            'lapsed' : r['info']['duration'],
            'code'   : code,
            'output' : r,
        }

    def getTargetParams(self) -> list[str]:
        params = { p['name']:p['value'] for p in self.getProperties() }
        params.update(self.getInputs())
        return [str(params[p]) for p in params]

    def updateConnections(self, result: dict) -> None:
        expectedOutputs = self.getExpectedOutputs()
        if len(expectedOutputs) > 1 and len(result) != len(expectedOutputs):
            raise Exception('The number of node outputs does not match the number of values returned by the task')
        for oconn in self.getOutConnections():
            oconn.setVisited(True)
            oconn.setValue(result)
            print("Connection from : ", oconn.info['source'], " to : ", oconn.info['target'], " updated with : " , result)
        for iconn in self.getInConnections():
            if(iconn.info['clear_after_run']):
                iconn.setVisited(False)
                iconn.setValue(None)

    def getID(self) -> str:
        return self.info['id']

    def getType(self) -> str:
        return self.info['type']

    def getProperties(self) -> dict:
        return self.info['properties']

    def formatInputs(self, parameters: dict) -> dict:
        return {'format':'inline', 'name':'', 'data':parameters}

    def getExpectedInputs(self) -> list[str]:
        return [p['name'] for p in self.element.properties
                if 'input' in p['attributes'] and 'required' in p['attributes']]
        
    def getExpectedOutputs(self) -> list[str]:
        return [p['name'] for p in self.element.properties
                if 'output' in p['attributes']]

    def addConnection(self, c: dict) -> None:
        self.connections.append(c)
        
    def getInConnections(self) -> list[Connection]:
        return [c for c in self.connections if c.getTarget().getID() == self.getID()]

    def getOutConnections(self) -> list[Connection]:
        return [c for c in self.connections if c.getSource().getID() == self.getID()]

    # ONLY FOR TESTING!! The elements should be read from the database.
    def translateToMachineTaskName(self) -> str:
        machineNameDictionary = {
            'Program.BinaryOperation'    : 'basicOps._operation',
            'Program.FunctionOneVar'     : 'basicOps._function',
            'Program.LogicalComparison'  : 'basicOps._operation',
            'Program.NumberVariable'     : 'self.returnValue',
            'Visualization.TextAndValue' : 'C/FPGA/fpga'
        }
        return machineNameDictionary[self.getType()]

    # TO DO: desñapizar
    def returnValue(self, parameters) -> str:
        outs = json.loads(parameters)
        return JSONFormatter.format(outs['Value'])

    def getInputs(self) -> dict:
        return {
            c.getTargetProperty():c.getValue() for c in self.getInConnections() if c.getVisited()
        }

class Connection:
    '''A connection between two nodes'''
    visited: bool = False
    value: object = None
    source: Node = None
    target: Node = None
    info: dict = {}

    def __init__(self, source: Node, target: Node, info):
        self.info = info
        self.source = source
        self.target = target
        self.source.addConnection(self)
        self.target.addConnection(self)

    def getSource(self) -> Node:
        return self.source

    def getTarget(self) -> Node:
        return self.target
    
    def getTargetProperty(self) -> str:
        return self.info['target_property']

    def setVisited(self, visited: bool) -> None:
        self.visited = visited

    def getVisited(self) -> bool:
        return self.visited or not self.info['required_to_run']

    def setValue(self, value: object):
        self.value = value

    def getValue(self) -> object:
        return self.value


class JSONFormatter:

    @staticmethod
    def format(output: object) -> object:
        return {
            'data': {
                'error': None,
                'output': output
            },
            'format': 'json',
            'info': {},
            'name': ''
        }