/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 *
 * This code is Open Source and is provided "as is".
 */

var IODA_GRAPH = IODA_GRAPH || {};

/**
 * Tool to graphically simulate a graph running, to send the run information to a server, 
  * and to display the server run 
 *
 */
IODA_GRAPH.runControl = function(mGraph) {
	const GRAPH_CONSTANTS = IODA_GRAPH.Constants;
	var self = {};

	var mSimulateConditionals = false;
	var mSimulateTrueConditionals = true;
	
	var mIsRunning = false;

	// -----------------------------
	// Basic setters and getters
	// -----------------------------
	
	self.setSimulateConditionals = function(simulate) {
		mSimulateConditionals = simulate;
	}

	self.getSimulateConditionals = function() {
		return mSimulateConditionals;
	}

	self.setSimulateTrueConditionals = function(simulate) {
		mSimulateTrueConditionals = simulate;
	}

	self.getSimulateTrueConditionals = function() {
		return mSimulateTrueConditionals;
	}

	self.isRunning = function() {
		return mIsRunning;
	}

	// -----------------------------
	// Serialization
	// -----------------------------
	
	self.toObject = function(object) {
		if (typeof object === "undefined") object = {};
		object.simulate_conditionals = mSimulateConditionals;
		object.true_conditionals     = mSimulateTrueConditionals;
		return object;
	}
	
	self.fromObject = function(object) {
		if ('simulate_conditionals' in object) mSimulateConditionals     = object.simulate_conditionals;
		if ('true_conditionals'     in object) mSimulateTrueConditionals = object.true_conditionals;
		return self;
	}
	
	// -----------------------------
	// Check graph
	// -----------------------------
	
	function recursiveAddChildren(outputConnections,currentList) {
		for (var i=0; i<outputConnections.length; i++) {
			var connection = outputConnections[i];
			if (currentList.indexOf(connection)<0) { // Only if not yet visited
				currentList.push(connection);
				var targetNode = connection.getTargetNode();
				recursiveAddChildren(targetNode.getOutputConnections(),currentList)
			}
		}
	}

	self.showPathFromNode = function(node) {
		var path = [];
		recursiveAddChildren(node.getOutputConnections(),path);
		//console.log ("Path = ");
		//for (var i=0; i<path.length; i++) console.log(path[i].toString());
		mGraph.showPath(path);
		return path;
	}

	// -----------------------------
	// Recording run
	// -----------------------------
	
	var mInfoRunGraph = {};
	var mInfoRunArray = [];
	var mInfoRunPrevious = null;
	
	function dateToStr (date) {
    const year  = date.getFullYear();
    const month = String(date.getMonth()).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');
    const hour  = String(date.getHours()).padStart(2, '0');
    const min   = String(date.getMinutes()).padStart(2, '0');
    const sec   = String(date.getSeconds()).padStart(2, '0');
    return year  + '-' + month + '-' + day + ' '
									+ hour + ':' + min + ':' + sec;
	}
	
	function finishRunGraphInfo(message) {
		const date = new Date();
		mInfoRunGraph['code']   = message;
		mInfoRunGraph['lapsed'] = date - mInfoRunGraph['start'];
		mInfoRunGraph['start']  = dateToStr(mInfoRunGraph['start']);
		mInfoRunGraph['end']    = dateToStr(date);
		mInfoRunGraph['output'] = 'www.um.es';
	}

	function finishPreviousRunInfo(date) {
		if (mInfoRunPrevious)	{
			mInfoRunPrevious['end'] = dateToStr(date);
			mInfoRunPrevious['lapsed'] = date-mInfoRunPrevious['start'];
			mInfoRunPrevious['start']  = dateToStr(mInfoRunPrevious['start']);
		}
		mInfoRunPrevious = null;
	}
		
	function runNode(node, code) {
		var date = new Date();
		finishPreviousRunInfo(date);
		mInfoRunPrevious = { 
			'node' : node.getID(),
			'start': date, 
			'code' : code,
			'output' : 'www.google.com'
		};	
		mInfoRunArray.push(mInfoRunPrevious);
	}
	
	self.showLastSimulationRun = function() {
		if (mInfoRunArray.length<=0) {
			mGraph.showMessage('Error',"No run information!");
			return;	
		}
		var graphData = self.getGraphRunData();
		resultsData = { 'resources' : null , 'graph' : mInfoRunGraph, 'nodes' : mInfoRunArray};
		sTabbedPannel.readRunResult(graphData, resultsData);
	}
	
	// -----------------------------
	// Simulate graph
	// -----------------------------
	
	function checkNodesStatus(nodeList) {
		var nodesToRun = [];
		nodeList.forEach(function(node) {
			//console.log("Checking status of node "+node.getName());
			if (node.canBeRun()) {
				//console.log(node.getName()+" can be run.");
				node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_READY_TO_RUN);
				nodesToRun.push(node);
			}
			else if (node.canBeCoded()) {
				//console.log(node.getName()+" can be coded.");
				node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_WAITING_FOR_CONNECTION);
				node.getInputConnections().forEach(function(conn) {
					if (conn.getConnectionStatus()===GRAPH_CONSTANTS.CONNECTION_STATUS_TRAVERSED) {
						conn.setConnectionStatus(GRAPH_CONSTANTS.CONNECTION_STATUS_TRAVERSED_BUT_WAITING);
					}
				})
			}
			else {
				//console.log(node.getName()+" can not be coded.");
				node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_CAN_NOT_BE_CODED);
			}
		});
		return nodesToRun;
	}
	
	function findNodeIncomplete(nodeList) {
		for(var i=0; i<nodeList.length; i++) {
			if (!nodeList[i].canBeCoded()) return nodeList[i];
		}
		return null;
	}

	var mNodesToRun = [];

	self.start = function(userInterface) {
		mGraph.getNodes().forEach(function(node) {
			node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_NORMAL);
		});
		mGraph.getConnections().forEach(function(connection) {
			connection.setConnectionStatus(GRAPH_CONSTANTS.CONNECTION_STATUS_NORMAL);
		});
		mInfoRunGraph['start'] = new Date();
		mInfoRunArray = [];
		mInfoRunPrevious = null;
		
		var startNodes = [];
		// Nodes with no input connections
		mGraph.getNodes().forEach(function(node) {
			if (node.isStartNode()) startNodes.push(node);
			if (!node.canBeCoded()) node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_CAN_NOT_BE_CODED);
		});
		mNodesToRun = checkNodesStatus(startNodes);
		var nodeIncomplete = findNodeIncomplete(mNodesToRun);
		if (nodeIncomplete!=null) {
			const message = "At least one of the nodes to run ('"
				+nodeIncomplete.getName()+"') is incomplete.";
			mGraph.showMessage("Simulation step Error",message);
			return;
		}
		mIsRunning = true;
	}

	self.step = function(userInterface) {
		var nodeIncomplete = findNodeIncomplete(mNodesToRun);
		if (nodeIncomplete!=null) {
			const message = "At least one of the nodes to run ('"
				+nodeIncomplete.getName()+"') is incomplete.";
			mGraph.showMessage("Simulation step Error", message);
			return;
		}
		if (mNodesToRun.length<=0) {
			mGraph.showMessage("Simulation step Error",
				"No node can be run. Please restart the simulation.");
			return;
		}
		// run them !
		mNodesToRun.forEach(function(node) {
			runNode(node, 'Ok');
			node.getInputConnections().forEach(function(conn) { 
				if (conn.getClearLinkAfterRun()) conn.setConnectionStatus(GRAPH_CONSTANTS.CONNECTION_STATUS_NORMAL);
				else conn.setConnectionStatus(GRAPH_CONSTANTS.CONNECTION_STATUS_RUN);
			});
			node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_RUN);
		});
		var newNodesToRun = [];
		// Add nodes that have received a connection
		mNodesToRun.forEach(function(node) {
			node.getOutputConnections().forEach(function(conn) { 
				var addIt = true;
				if (mSimulateConditionals) {
					const condition = conn.getSourceTriggerBoolean(); 
					if (condition) {
						if (condition.endsWith("= true")) addIt = mSimulateTrueConditionals;
						else addIt = !mSimulateTrueConditionals;
					}
				}
				if (addIt) {
					conn.setConnectionStatus(GRAPH_CONSTANTS.CONNECTION_STATUS_TRAVERSED);
					// Do not add twice the same node when triggered SIMULTANEOUSLY!
					if (newNodesToRun.indexOf(conn.getTargetNode())<0) newNodesToRun.push(conn.getTargetNode());
				}
			});
		});
		mNodesToRun = checkNodesStatus(newNodesToRun);
		mGraph.getPanel().render();
	}
		
	self.stop = function(userInterface,calledByUser) {
		mGraph.clearPath();
		mNodesToRun = [];
		if (calledByUser) {
			const message = "Simulation was stopped by user. It seems to have run correctly";
			finishPreviousRunInfo(new Date());
			finishRunGraphInfo(message);
			mGraph.showMessage("Graph simulation", message);
		}
		mIsRunning = false;
	}

	// -----------------------------
	// Run graph
	// -----------------------------
	
	self.isGraphIncomplete = function() {
		return findNodeIncomplete(mGraph.getNodes())!=null;
	}
	
	/**
	 * returns a dictionary with the information of the graph for the server to run it 
	 */
	self.getGraphRunData = function() {
		var nodeList = [];
		mGraph.getNodes().forEach(function(node) {
	    var properties = [];
			node.getProperties().forEach(function(property) {
				if (property.value!=null) 
					properties.push ({ name : property.name , value : property.value });
			});
	    nodeList.push({ 
				id : node.getID(),
	      name : node.getName(),
	      type : node.getClassname(),
	      properties : properties
	    });
	  });
		var connectionList = [];
		mGraph.getConnections().forEach(function(connection) {
			var connObj = { 
				source : connection.getSourceNode().getID(),
				target : connection.getTargetNode().getID(),
				required_to_run : connection.isRequiredToRunNode(),
				clear_after_run : connection.getClearLinkAfterRun()
			}
			if (connection.getSourceProperty()!=null &&
			    connection.getTargetProperty()!=null) {
				connObj['source_property'] = connection.getSourceProperty();
				connObj['target_property'] = connection.getTargetProperty();
			}
			if (connection.getSourceTriggerBoolean()!=null) {
				connObj['source_trigger'] = connection.getSourceTriggerBoolean();
			}
	    connectionList.push(connObj);
	  });

	  return { 
			name : mGraph.getName(), //+"-run", 
			description : mGraph.getComment(), 
			node_list : nodeList,
			connection_list : connectionList,
			client_object : mGraph.toObject({})
		};
	};
	
	// -----------------------------
	// Final start-up
	// -----------------------------
	
	return self;
}

