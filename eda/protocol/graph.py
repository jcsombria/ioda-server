import json
from celery.execute import send_task
import random as rnd
import time


class Graph:
    ''' A graph representing an algorithm that can be ran '''

    def __init__(self, graph):
        self.graph = graph
        self.graph['resources'] = []
        self.graph['run_information'] = []
        self.nodes = []
        self.connections = []

    def run(self):
        print("Running graph " + self.graph['name'])
        [self.addNode(n) for n in self.graph["node_list"]]
        [self.addConnection(c) for c in self.graph["connection_list"]]
        nodesRemaining = True
        while nodesRemaining:
            nextNodesToRun = self.findRunnableNodes()
            if(len(nextNodesToRun) == 0):
                break

            for n in nextNodesToRun:
                try:
                    print("Next Node to run: ", n.getID())
                    targetInfo = self.callNode(n)
                    self.updateConnections(n, targetInfo["output"])
                    self.graph['resources'].append(int(10000*rnd.random()))
                    self.graph['run_information'].append(targetInfo)
                except:
                    print('Exception running node: ', n.getID())

        print(self.graph)
        return self.graph

    def addNode(self, n):
        self.nodes.append(Node(n))

    def addConnection(self, c):
        c['visited'] = False
        c['load'] = None
        self.connections.append(c)

    def findRunnableNodes(self):
        result = []
        for n in self.nodes:
            isNodeReady = self.canRunNode(n)
            print("Node : ", n.node["id"], " is ready? : ", isNodeReady)
            if(isNodeReady):
                result.append(n)
        return result

    def updateConnections(self, node, nodeOutputs):
        result = nodeOutputs["data"]["output"]
        expectedOutputs = node.getExpectedOutputs()
        if(len(result) != len(expectedOutputs)):
            raise Exception("The number of node outputs does not match the number of values returned by the task")
        for oconn in self.getOutConnections(node):
            oconn["visited"] = True
            oconn["load"] = result
        for iconn in self.getInConnections(node):
            if(iconn["clear_after_run"]):
                oconn["visited"] = False
                oconn["load"] = None

    def getInConnections(self, node):
        return [c for c in self.connections if(c["target"] == node.getID())]
        
    def getOutConnections(self, node):
        return [c for c in self.connections if(c["source"] == node.getID())]
        
    def canRunNode(self, node):
        if node.visited:
            return False
        if len(self.getInConnections(node)) == 0:
            return True
        expectedInputs = node.getExpectedInputs()
        properties = [p["name"] for p in node.getProperties()]
        inputs = [c["target_property"] for c in self.getInConnections(node) if c["visited"] or not c["required_to_run"]]
        data = properties + inputs
        intersection = set(expectedInputs).intersection(data)
        return len(intersection) == len(expectedInputs)

    def callNode(self, node):
        node.visited = True
        param  = { p['name']:p['value'] for p in node.getProperties() }
        inputs = { c['target_property']:c['load'] for c in self.getInConnections(node) if c['visited'] }
        param.update(inputs)
        targetParams = [str(param[p]) for p in param]
        machineName = node.translateToMachineTaskName()
        # TO DO: Move to Node
        if("self." in machineName):
            targetParams = param
            startTime = time.time()
            result = getattr(self, machineName.split(".")[1])(json.dumps(targetParams))
            stopTime = time.time()
            return {
                "node"   : node.getID(),
                "start"  : startTime,
                "end"    : stopTime,
                "lapsed" : startTime - stopTime,
                "code"   : "",
                "output" : result
            }
        inlineParams = ','.join(targetParams)
        nodeInfo = {
            "task"       : machineName,
            "parameters" : inlineParams.replace("'","")
        }
        return node.run(nodeInfo)

    def returnValue(self, parameters):
        outs = json.loads(parameters)
        return JSONFormatter.format(outs["Value"])
        
    def returnStr(self, parameters):
        text = json.loads(parameters)["Text"]
        result = json.loads(parameters)["Result"]
        out = str(text) + "\t" + "Result"
        return JSONFormatter.format(out)
    
    def resultHandler(self,result):
        print(result)


class Node:
    ''' A node that represents a task '''

    def __init__(self, node):
        self.node = node
        self.visited = False

    def isRunnable(self):
        return False

    #Now the execution is blocked while waiting the results, just for testing
    def run(self, nodeInfo):
        taskName = nodeInfo["task"]
        parameters = nodeInfo["parameters"]
        inputs = self.formatInputs(parameters)
        print("Obtaining Results from fusion server for: ", [taskName, inputs])
        result = send_task("tasks.worker_Python.nodoPython", args=(taskName, inputs))
        r = result.get()
        error = r["data"]["error"]
        if not error:
            code = "Node run OK"
        else:
            code = error
        return {
            "node"   : self.getID(),
            "start"  : r["info"]["startTime"],
            "end"    : r["info"]["stopTime"],
            "lapsed" : r["info"]["duration"],
            "code"   : code,
            "output" : r['data']['output'],
        }

    def getID(self):
        return self.node['id']

    def getType(self):
        return self.node['type']

    def getProperties(self):
        return self.node['properties']

    def formatInputs(self, parameters):
        inputs = {"format":"inline", "name":"", "data":parameters}
        return inputs

    # ONLY FOR TESTING!! The elements should be read from the database.
    def getExpectedInputs(self):
        expectedInputsDictionary = {
            "Program.BinaryOperation"   : ["Operation", "Operand1", "Operand2"],
            "Program.FunctionOneVar"    : ["Funtion", "Argument"],
            "Program.LogicalComparison" : ["Operation", "Operand1", "Operand2"],
            "Program.NumberVariable"    : ["Value"],
            "Visualization.TextAndValue": ["Text", "Result"]
        }
        return expectedInputsDictionary[self.getType()]
        
    # ONLY FOR TESTING!! The elements should be read from the database.
    def getExpectedOutputs(self):
        expectedInputsDictionary = {
            "Program.BinaryOperation"   : ["Result"],
            "Program.FunctionOneVar"    : ["Result"],
            "Program.LogicalComparison" : ["Result"],
            "Program.NumberVariable"    : ["Result"],
            "Visualization.TextAndValue": ["Result"]
        }
        return expectedInputsDictionary[self.getType()]

    # ONLY FOR TESTING!! The elements should be read from the database.
    def translateToMachineTaskName(self):
        machineNameDictionary = {
            "Program.BinaryOperation"   : "basicOps._operation",
            "Program.FunctionOneVar"    : "basicOps._function",
            "Program.LogicalComparison" : "basicOps._operation",
            "Program.NumberVariable"     : "self.returnValue",
            "Visualization.TextAndValue": "self.returnStr"
        }
        return machineNameDictionary[self.getType()]


class JSONFormatter:

    @staticmethod
    def format(output):
        return {
            "data": {
                "error": None,
                "output": output
            },
            "format": "json",
            "info": {},
            "name": ""
        }