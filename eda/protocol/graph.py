from __future__ import annotations
import json
import random as rnd
import time

from eda.models import DefaultElement, UserElement, Element, DefaultElementGroup, UserElementGroup

from celery import Celery
import traceback

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

        #=======================================================================
        # #Solving a little error:
        # if(graph['name'] == "Testing IFs"):
        #     graph["node_list"][3]["properties"] = [{"name": "Comparison", "value": "'<='"},{"name": "Operand2", "value": "5"}]
        # elif(graph['name'] == "Testing Loops"):
        #     graph["node_list"][2]["properties"] = [{"name": "Comparison", "value": "'<='"},{"name": "Operand2", "value": "5"}]
        # elif(graph['name'] == "Sum N squares"):
        #     graph["node_list"][6]["properties"] = [{"name": "Comparison", "value": "'<='"}]
        #     graph["node_list"][4]["properties"] =[{"name": "Operator2", "value": "'plus'"}, {"name": "Operator1", "value": "'pow'"}, {"name": "Operand3", "value": "2"}]
        # elif(graph['name'] == "Quadratic equation"):
        #     graph["node_list"][3]["properties"] = [{"name": "Operand2", "value": "0"}, {"name": "Comparison", "value": "'=='"}]
        #     graph["node_list"][4]["properties"] = [{"name": "Operand2", "value": "0"}, {"name": "Comparison", "value": "'<'"}]
        #     graph["node_list"][5]["properties"] = [{"name": "Operand2", "value": "0"}, {"name": "Comparison", "value": "'=='"}]
        #     graph["node_list"][6]["properties"] = [{"name": "Operand2", "value": "0"}, {"name": "Operator1", "value": "'minus'"}, {"name": "Operator2", "value": "'divided by'"}]
        #     graph["node_list"][7]["properties"] = [{"name": "Operand2", "value": "0"}, {"name": "Comparison", "value": "'=='"}]
        #     graph["node_list"][8]["properties"] = [{"name": "Operand2", "value": "0"}, {"name": "Comparison", "value": "'=='"}]
        #     graph["node_list"][9]["properties"] = [{"name": "Operator1", "value": "'pow'"},{"name": "Operator2", "value": "'None'"}, {"name": "Operand5", "value": "2"}, {"name": "Operand2", "value": "4"}, {"name": "Operator3", "value": "'times'"}, {"name": "Operator4", "value": "'times'"}, {"name": "Operator5", "value": "'minus'"}]
        #     graph["node_list"][10]["properties"] = [{"name": "Operand1", "value": "2"}, {"name": "Operator1", "value": "'minus'"}, {"name": "Operator2", "value": "'None'"}, {"name": "Operand3", "value": "0"}, {"name": "Operator3", "value": "'times'"}, {"name": "Operator4", "value": "'divided by'"}]
        #     graph["node_list"][11]["properties"] = [{"name": "Operand1", "value": "2"}, {"name": "Operator1", "value": "'minus'"}, {"name": "Operator2", "value": "'None'"}, {"name": "Operator3", "value": "'times'"}, {"name": "Operator4", "value": "'divided by'"}]
        #     graph["node_list"][12]["properties"] = [{"name": "Operand1", "value": "2"}, {"name": "Operator1", "value": "'plus'"}, {"name": "Operator2", "value": "'times'"}, {"name": "Operator3", "value": "'None'"}, {"name": "Operand3", "value": "-1"}, {"name": "Operator4", "value": "'times'"}, {"name": "Operator5", "value": "'divided by'"}]
        #=======================================================================

    def run(self) -> dict:
        print(self.originalGraph)
        self.graphInformation['code'] = ''
        print('Running graph ' + self.originalGraph['name'])
        startTime = time.time()
        runnableNodes = self.findRunnableNodes()
        print('Runnable nodes:')
        while len(runnableNodes) > 0:
            temporalResults = []
            for n in runnableNodes:
                try:
                    print('    Next Node to run: ', n.getID())
                    targetInfo = n.run()
                    print("targetInfo : " ,targetInfo)
                    temporalResults.append(targetInfo['output']['data']['output'])
                    self.run_information.append(targetInfo)
                    self.resources.append(int(10000*rnd.random()))
                except Exception as e:
                    print('    Exception running node: ', n.getID())
                    print(traceback.format_exc())
                    self.graphInformation['code'] = self.graphInformation['code'] + "Error " + 'Exception running node: ', str(n.getID())
            try:
                [item.updateConnections(temporalResults[i]) for i,item in enumerate(runnableNodes)]
                runnableNodes = self.findRunnableNodes()
            except Exception as e:
                    print('Exception updating')
                    print(traceback.format_exc())
                    break
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
            isNodeReady = n.isRunnable()
            if(isNodeReady):
                print('Node : ', n.getID(), ' is ready')
                result.append(n)
        return [n for n in self.nodes if n.isRunnable()]


class Node:
    '''A node that represents a task'''
    info: dict = None
    visited: bool = False
    connections: list[Connection] = []
    element: Element = None
    verbose: bool = False
    isUserEl:bool = False 

    def __init__(self, info: dict) -> None:
        self.info = info
        self.visited = False
        group, id = self.getType().split('.')

        # print("self.getType()", self.getType().split('.'))
        #self.element = Element.objects.filter(id=self.getType()).first()
        # print("self.info", self.info)
        if DefaultElementGroup.objects.filter(name=group).exists():
            model = DefaultElement
            print('Element is not here!')
            self.isUserEl = False
        elif UserElementGroup.objects.filter(name=group).exists():
            model = UserElement
            print('Element is not there!')
            self.isUserEl = True

        self.element = model.objects.filter(nick=id, group=group).first()
        # try:
        #     self.element = UserElement.objects.filter(nick=self.getType().split('.')[1]).first()
        #     self.isUserEl = True
        # except:
        #     self.element = DefaultElement.objects.filter(nick=self.getType().split('.')[1]).first()
        #     self.isUserEl = False
        #print('=================================================')
        #print("self.element", self.element)
        self.connections = []
        self.verbose = False

    def isRunnable(self) -> bool:
        try:
            properties = [p['name'] for p in self.getProperties()]
            inputConns = self.getInputConnections()
            if len(inputConns) == 0:
                if(self.verbose) : print("        No inputs, and visited = ", self.visited)
                return (not self.visited)
            else:
                hasUpdates = self.updated()
                expectedInputs = self.getGraphDefinedInputs()
                readyInputs = []
                if(self.visited):
                    if(self.verbose) : print("        Has inputs, was visited, hasupdates = ", hasUpdates, ", and all the conn vitited = ",self.allConnsVisited())
                    return (hasUpdates and self.allConnsVisited())
                else:
                    for c in inputConns:
                        if(c.getVisited() and not self.isTriggerConnection(c)):
                            if(c.getTargetProperty() not in properties and c.getTargetProperty() not in readyInputs):
                                readyInputs.append(c.getTargetProperty())
                        if(c.getSourceTrigger()):
                            if(c.getValue() is None and c.getRequiredToRun()):
                                if(self.verbose) : print('        Has inputs, was not visited, one required_to_run trigger connection is not ready, load is None')
                                return False
                                
                    insAndProps = properties + readyInputs
                    intersection = set(expectedInputs).intersection(insAndProps)
                    isReady =  len(intersection) >= len(expectedInputs) 
                    if(self.verbose) : print("        Has inputs, was not visited and all the comms are ready, properties: ", properties, " readyInputs: ", readyInputs, "expectedInputs: ", expectedInputs)
                    return isReady
        except Exception as e:
            print("Error : ", traceback.format_exc())

    def reorderParams(self,params:dict)-> list[dict]:
        order = self.getExpectedInputs()
        finalParams = []
        for ordParam in order: 
            try:
                #finalParams[ordParam] = params[ordParam['name']]
                nextP = {'name': ordParam['name'], 'data': params[ordParam['name']],'type':ordParam['type']}
                finalParams.append(nextP)
            except:
                pass
        return finalParams

    def gatherParameters(self)-> dict:
        param  = { p['name']:p['value'] for p in self.getProperties() }
        inputs = {}
        hasUpdates = self.updated()
        for c in self.getInputConnections():
            if(not self.isTriggerConnection(c)):
                if(hasUpdates):
                    if(c.getTargetProperty() in param and c.getValue() is not None):
                        del param[c.getTargetProperty()]
                        if(c.getTargetProperty() in inputs):
                            print("Found same input property twice, updated connections have priority")
                        else:
                            inputs[c.getTargetProperty()] = c.getValue()
                    elif(c.getValue() is not None):
                            inputs[c.getTargetProperty()] = c.getValue()
                else:
                    if(c.getVisited() and c.getValue() is not None):
                            inputs[c.getTargetProperty()] = c.getValue()
        param.update(inputs)
        return param

    #Now the execution is blocked while waiting the results, just for testing
    def run(self) -> dict:
        self.visited = True
        app = Celery('tasks', backend=BACKEND, broker=BROKER_URL)
        params = self.gatherParameters()
        machineName = self.translateToMachineTaskName()
        nodeInfo = {}
        nodeInfo['task'] = machineName
        nodeInfo['params'] = params
        taskName = machineName
        if('self.' in taskName):
            targetParams = params
            startTime = time.time()
            result = getattr(self, taskName.split('.')[1])(json.dumps(targetParams))
            stopTime = time.time()
            return {
                'node'   : self.getID(),
                'start'  : startTime,
                'end'    : stopTime,
                'lapsed' : stopTime - startTime,
                'code'   : 'Node run OK',
                'output' : result
            }
        #TO recover inline params in matlab calls
        #inlineParams = ','.join(self.getTargetParams()).replace("'", '')
        taskInput = self.formatInputs(self.getTargetParams(),self.getExpectedOutputs())
        if taskName == 'C/FPGA/fpga':
            taskInput = '{"format":"inline","name":"","data":"misdatos/hola_mundo.txt"}'
            node = 'tasks.worker_Python.binaryNode'
        else:
            node = 'tasks.worker_Python.nodoPython'
            
        print("        Sending the task : ", taskName, " to server with parameters: ", taskInput)
        result = app.send_task(node, args=(taskName, taskInput))
        r = result.get()
        error = r['data']['error']
        code = 'Node run OK' if not error else error
        #print(r)
        return {
            'node'   : self.getID(),
            'start'  : r['info']['startTime'],
            'end'    : r['info']['stopTime'],
            'lapsed' : r['info']['duration'],
            'code'   : code,
            'output' : r,
        }

    def getTargetParams(self) -> list[dict]:
        params = { p['name']:p['value'] for p in self.getProperties() }
        #params = [ {p['name']:p['value']} for p in self.getProperties() ]
        params.update(self.getInputs())
        targetParams = self.reorderParams(params)
        return targetParams

    def getProperty(self, name: str):
        properties = self.info['properties']
        for prop in properties:
            if(prop['name'] == name):
                return prop['value']
        return None

    def updateConnections(self, result: dict) -> None:
        for oconn in self.getOutputConnections():
            if(oconn.getSourceTrigger()):
                triggerValue = oconn.getSourceTrigger().split('=')[1].strip() == 'true'
                if(triggerValue == result['Result']):
                    oconn.setVisited(True)
                    oconn.setUpdated(True)
                    if(not self.isTriggerConnection(oconn)):
                        oconn.setValue(self.getProperty(oconn.getSourceProperty()))
                        if(oconn.getValue() is None):
                            for iconn in self.getInputConnections():
                                if(oconn.getSourceProperty() == iconn.getTargetProperty()):
                                    oconn.setValue(iconn.getValue())
                    else:
                        #oconn.setValue(result)
                        oconn.setValue(result[oconn.getSourceProperty()])
                        
            else:
                oconn.setVisited(True)
                #oconn.setValue(result)
                oconn.setValue(result[oconn.getSourceProperty()])
                oconn.setUpdated(True)
            if(oconn.getValue() is not None):
                print(" -> Connection from : ", oconn.getSource().getID(), " to : ", oconn.getTarget().getID(), " updated with : " , oconn.getValue())
        for iconn in self.getInputConnections():
            if(iconn.getClearAfterRun()):
                print(" <- Clearing input connection from : ", iconn.getSource().getID(), " to : ", iconn.getTarget().getID())
                iconn.setVisited(False)
                iconn.setValue(None)
                iconn.setUpdated(False)
            else:
                print(" <- Input connection from : ", iconn.getSource().getID(), " to : ", iconn.getTarget().getID(), " has been used")
                iconn.setUpdated(False)

    def getID(self) -> str:
        return self.info['id']

    def getType(self) -> str:
        return self.info['type']

    def getProperties(self) -> dict:
        return self.info['properties']

    def formatInputs(self, parameters: list, expectedOutputs) -> dict:
        return {'variables':parameters, 'expectedOutputs':expectedOutputs}

    def getGraphDefinedInputs(self)-> list[str]:
        propertiesJSON = self.getProperties()
        properties = [prop['name'] for prop in propertiesJSON]
        ins = self.getInputConnections()
        if(len(ins)>=0):
            insTargetProperties = [iconn.getTargetProperty() for iconn in ins if iconn.getTargetProperty() is not None]
        else:
            insTargetProperties = []
        properties = properties + insTargetProperties
        properties = list(dict.fromkeys(properties))
        return properties

    def getExpectedInputs(self) -> list[str]:
        #print(self.element.properties)
        #return [p['name'] for p in self.element.properties
                #if 'input' in p['attributes']]
        return [p for p in self.element.properties
                if 'input' in p['attributes']]
                #if 'input' in p['attributes'] and 'required' in p['attributes']]
        
    def getExpectedOutputs(self) -> list[str]:
        return [p['name'] for p in self.element.properties
                if 'output' in p['attributes']]

    def addConnection(self, c: dict) -> None:
        self.connections.append(c)
        
    def getInputConnections(self) -> list[Connection]:
        return [c for c in self.connections if c.getTarget().getID() == self.getID()]

    def getOutputConnections(self) -> list[Connection]:
        return [c for c in self.connections if c.getSource().getID() == self.getID()]

    def updated(self)-> bool:
        updated = False
        inputConns = self.getInputConnections()
        for incon in inputConns:
            updated = updated or incon.getUpdated()
        return updated
    
    def allConnsVisited(self)-> bool:
        visited = True
        inputConns = self.getInputConnections()
        for incon in inputConns:
            visited = visited and incon.getVisited()
        return visited
    
    def hasTriggerConnections(self)-> bool:
        inconns = self.getInputConnections()
        hasTriggers = False
        hasTriggers = [hasTriggers or self.isTriggerConnection(conn) for conn in inconns]
        return hasTriggers
        
    def isTriggerConnection(self,conn)-> bool:
        sourceNodeIsLogic = conn.getSourceTrigger()
        notConnectedProperties = (conn.getSourceProperty() is None) and (conn.getTargetProperty() is None)
        return sourceNodeIsLogic and notConnectedProperties

    # ONLY FOR TESTING!! The elements should be read from the database.
    def translateToMachineTaskName(self):
        machineNameDictionary = {
            'Program.BinaryOperation'    : 'basicOps._operation',
            'Program.FunctionOneVar'     : 'basicOps._function',
            'Program.LogicalComparison'  : 'basicOps._operation',
            'Program.NumberVariable'     : 'self.returnValue',
            'Visualization.TextAndValue' : 'self.returnStr',
            'Program.PolishCalculation'  : 'basicOps._polishCalculation',
            'Program.Template'  : 'template.methodName1'
        }
        try:
            name = machineNameDictionary[self.getType()]
            return name
        except:
            name = self.getType().split('.')[1] + '.userMethod'
            return name

    # TO DO: desñapizar
    def returnValue(self, parameters) -> str:
        outs = json.loads(parameters)
        return JSONFormatter.format(outs)

    def returnStr(self, parameters)-> str:
        paramsJson = json.loads(parameters)
        text = paramsJson['Text']
        result = text
        if('Value' in paramsJson):
            result = result + str(paramsJson['Value'])
        if('Div' in paramsJson):
            result = str(paramsJson['Div']) + "\n" + result
        out = str(result)
        return JSONFormatter.format(out)

    def getInputs(self) -> dict:
        return {
            c.getTargetProperty():c.getValue() for c in self.getInputConnections() if c.getVisited()
        }

class Connection:
    '''A connection between two nodes'''
    visited: bool = False
    updated: bool = False
    value: object = None
    source: Node = None
    target: Node = None
    info: dict = {}

    def __init__(self, source: Node, target: Node, info):
        self.info = info
        self.source = source
        self.target = target
        self.visited = False
        self.updated = False
        self.value = None
        self.source.addConnection(self)
        self.target.addConnection(self)

    def getSource(self) -> Node:
        return self.source

    def getTarget(self) -> Node:
        return self.target
    
    def getTargetProperty(self) -> str:
        try:
            return self.info['target_property']
        except: 
            return None

    def getSourceProperty(self) -> str:
        try:
            return self.info['source_property']
        except: 
            return None
        

    def getClearAfterRun(self) -> str:
        return self.info['clear_after_run']

    def getSourceTrigger(self) -> str:
        try:
            return self.info['source_trigger']
        except: 
            return None

    def getRequiredToRun(self) -> str:
        return self.info['required_to_run']

    def setVisited(self, visited: bool) -> None:
        self.visited = visited
        
    def setUpdated(self, updated: bool) -> None:
        self.updated = updated

    def getUpdated(self) -> None:
        return self.updated

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