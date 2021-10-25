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
IODA_GRAPH.runReplay = function(mGraph) {
	const GRAPH_CONSTANTS = IODA_GRAPH.Constants;
	var self = {};

	var mRunGraphInfo = {};
	var mRunNodesInformation = [];
	
	var mReproductionIndex = -1;
	var mIsRunning = false;
	
	// -----------------------------
	// Basic setters and getters
	// -----------------------------

	self.isRunning = function() {
		return mIsRunning;
	}
	
	self.setRunInformation = function (graphInfo, nodesInfo) {
		mRunGraphInfo        = graphInfo;
		mRunNodesInformation = nodesInfo;
		completeNodeInfo();
	}

	self.getRunGraphInfo = function () {
		return mRunGraphInfo;
	}
	
	function getRunNodeInformation(index) {
		if (index<0 || index>=mRunNodesInformation.length) return null;
		return mRunNodesInformation[index];
	}
	

	self.getCurrentNode = function () {
		var runInfo = getRunNodeInformation(mReproductionIndex);
		if (runInfo==null) return null;
		return mGraph.findNode(runInfo['node']);
	}

	// -----------------------------
	// Serialization
	// -----------------------------
	
	self.toObject = function(object) {
		cleanNodeInfo();
		if (typeof object === "undefined") object = {};
		object.run_graph = mRunGraphInfo;
		object.run_nodes = mRunNodesInformation;
		return object;
	}
	
	self.fromObject = function(object) {
		if ('run_graph' in object) mRunGraphInfo        = object.run_graph;
		if ('run_nodes' in object) mRunNodesInformation = object.run_nodes;
		completeNodeInfo();
		return self;
	}
	
	function completeNodeInfo() {
		var nodeCounter = {};
        console.log(mRunNodesInformation)
		mRunNodesInformation.forEach(function(nodeInfo) {
			const nodeID = nodeInfo.node;
			if (nodeID in nodeCounter) nodeCounter[nodeID] = nodeCounter[nodeID]+1;
			else nodeCounter[nodeID] = 1;
			nodeInfo['iteration'] = nodeCounter[nodeID];
		});
		mRunNodesInformation.forEach(function(nodeInfo) {
			const nodeID = nodeInfo.node;
			if (nodeID in nodeCounter) nodeInfo['iterations_count'] = nodeCounter[nodeID];
			else nodeInfo['iterations_count'] = 0;
			nodeInfo['iteration_string'] = nodeInfo['iteration']+"/"+nodeInfo['iterations_count'];
		});
	}

	function cleanNodeInfo() {
		mRunNodesInformation.forEach(function(nodeInfo) {
			nodeInfo['iteration'] = null;
			nodeInfo['iterations_count'] = null;
			nodeInfo['iteration_string'] = null;
		});
	}
	
	// -----------------------------
	// Replay a previous run
	// -----------------------------

	self.start = function(userInterface) {
		mGraph.getNodes().forEach(function(node) {
			node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_NORMAL);
		});
		mGraph.getConnections().forEach(function(connection) {
			connection.setConnectionStatus(GRAPH_CONSTANTS.CONNECTION_STATUS_NORMAL);
		});

		var runInfo = getRunNodeInformation(0);
		if (runInfo==null) {
			const message = "No run information available!";
			mGraph.showMessage("Reproduction start error",message);
			return;
		}
		mReproductionIndex = 0;
		const node = mGraph.findNode(runInfo['node']);
		node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_READY_TO_RUN);
		mIsRunning = true;
		userInterface.displayRunInfo(runInfo);
	}

	self.step = function(userInterface) {
		if (mReproductionIndex<0) {
			const message = "No node can be run. Please restart the simulation.";
			mGraph.showMessage("Reproduction step error", message);
			return null;
		}
		
		var runInfo = getRunNodeInformation(mReproductionIndex);
		var node = mGraph.findNode(runInfo['node'])
		node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_RUN);

		runInfo = getRunNodeInformation(mReproductionIndex+1);
		if (runInfo==null) {
			const message = "No more nodes to run!";
			mGraph.showMessage("Reproduction step error",message);
			return null;
		}
		mReproductionIndex++;
		node = mGraph.findNode(runInfo['node'])
		node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_READY_TO_RUN);
		userInterface.displayRunInfo(runInfo);
		return node;
	}
		
	self.stop = function(userInterface,calledByUser) {
		mGraph.clearPath();
		mReproductionIndex = -1;
		mIsRunning = false;
		userInterface.displayRunInfo(null);
	}

	self.forwardToNode = function(userInterface,nodeID) {
		var node = null;
		do {
			node = self.step(userInterface);
		} while (node!=null && nodeID!=node.getID());
	}

	// -----------------------------
	// Final start-up
	// -----------------------------
	
	mGraph.setNodeAction(null);
	
	mGraph.setConnectionAction(null);
	mGraph.setCanCreateConnections(false);

	return self;
}

