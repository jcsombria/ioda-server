/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 *
 * This code is Open Source and is provided "as is".
 */

var IODA_GRAPH = IODA_GRAPH || {};

/**
 * Drawing panel
 */
IODA_GRAPH.Constants = {

	NODE_STATUS_NORMAL: 0,
	NODE_STATUS_SELECTED: 1,
	NODE_STATUS_CAN_BE_CODED: 10,
	NODE_STATUS_CAN_NOT_BE_CODED: 11,
	NODE_STATUS_CURRENT_STEP: 20,
	NODE_STATUS_READY_TO_RUN : 21,
	NODE_STATUS_WAITING_FOR_CONNECTION : 22,
	NODE_STATUS_RUN : 23,
	
	CONNECTION_STATUS_NORMAL: 0,
	CONNECTION_STATUS_TRAVERSED: 1,
	CONNECTION_STATUS_TRAVERSED_BUT_WAITING: 2,
	CONNECTION_STATUS_RUN: 3

}

/**
 * Creates a Graph object with a graphic representation using ejsS
 * A graph is basically a collection of nodes and connections 
 * between ordered pairs of nodes. 
 * A node can have properties. 
 * One connection can be used to link an output property of one 
 * of the nodes it connects, with an input property of the other.
 * The graph (and hence the connections) can be directed or non-directed.
 * By default the graph is created directed.
 *
 * @param mUserInterface object : The object that handles the user interface.
 * 	Must implement the functions:
 *		- reportChange()
 *		- showMessage(header,message)
 *		- getTitle()
 * @param mElementService object : The object that provides information about nodes (by classname).
 * 	Must implement the functions:
 *		- getIcon(classname)
 *		- getPropertiesNameList(classname)
 *		- getPropertyType(classname, property_name)
 * 		- getPropertyAttributes(classname, property_name)
 * 		- showHelp(classname)
 * @param mID string : a unique String that identifies the graph
 * @param mTopLevel object : the top level HTML element in which to display the graphics.
 *   If null, the mID is used to create a <div> that must be placed 
 *   somewhere for display by the calling code
 */
IODA_GRAPH.createGraph = function(mUserInterface, mElementService, mID,mTopLevel) {
	const GRAPH_CONSTANTS = IODA_GRAPH.Constants;
	var self = {};

	var mIsDirected = true; 
	var mShowNodeLabels = true;
	var mShowOutputLabels = true;
	var mShowInputLabels = true;
	var mShowConditionLabels = true;
//	var mSimulateConditionals = false;
//	var mSimulateTrueConditionals = true;
	var mComment = "";

	var mNodes = [];
	var mConnections = [];

	var mNodeAction = null;
	var mNodeSelectedAction = null;
	var mNodeUnselectedAction = null;
	
	var mConnectionSelectedAction = null;
	var mConnectionAction = null;
	
	var mPanel;
	var mCanCreateConnections = true;
	
	// -----------------------------
	// Basic setters and getters
	// -----------------------------

	self.getID = function() { return mID; }

	self.getTopLevel = function() { return mTopLevel; }

	self.isDirected  = function() { return mIsDirected; }

	self.setDirected = function() { return mSetDirected; }
	
	self.getTopLevelElement = function() { return mPanel.getView()._getTopLevelElement(); }

	self.getShowNodeLabels = function() {
		return mShowNodeLabels;
	}
	
	self.setShowNodeLabels = function(show) {
		if (mShowNodeLabels!=show) {
			mShowNodeLabels = show;
			self.render();
		}
	}

	self.getShowOutputLabels = function() {
		return mShowOutputLabels;
	}
	
	self.setShowOutputLabels = function(show) {
		if (mShowOutputLabels!=show) {
			mShowOutputLabels = show;
			self.render();
		}
	}
	
	self.getShowInputLabels = function() {
		return mShowInputLabels;
	}

	self.setShowInputLabels = function(show) {
		if (mShowInputLabels!=show) {
			mShowInputLabels = show;
			self.render();
		}
	}

	self.getShowConditionLabels = function() {
		return mShowConditionLabels;
	}
	
	self.setShowConditionLabels = function(show) {
		if (mShowConditionLabels!=show) {
			mShowConditionLabels = show;
			self.render();
		}
	}

	self.getComment = function() { return mComment; }

	self.setComment = function(comment) {
		if (mComment!=comment) {
			mComment = comment;
			self.reportChange();
		}
	}

	self.setNodeAction = function(action) {
		mNodeAction = action;
	}

	self.setNodeSelectedAction = function(action) {
		mNodeSelectedAction = action;
	}

	self.setNodeUnselectedAction = function(action) {
		mNodeUnselectedAction = action;
	}


	self.setConnectionAction = function(action) {
		mConnectionAction= action;
	}

	self.setConnectionSelectedAction = function(action) {
		mConnectionSelectedAction = action;
	}

	self.setCanCreateConnections = function (canCreate) {
		mCanCreateConnections = canCreate;
	}

	self.canCreateConnections = function () {
		return mCanCreateConnections;
	}

	// -----------------------------
	// Serialization
	// -----------------------------
	
	self.toObject = function(object) {
		if (typeof object === "undefined") object = {};
		object.is_directed      = mIsDirected;
		object.node_labels      = mShowNodeLabels;
		object.output_labels    = mShowOutputLabels;
		object.input_labels     = mShowInputLabels;
		object.condition_labels = mShowConditionLabels;
//		object.simulate_conditionals = mSimulateConditionals;
//		object.true_conditionals     = mSimulateTrueConditionals;

		object.nodes = [];
		mNodes.forEach(function(node) {
			object.nodes.push(node.toObject());
		});
		object.connections = [];
		mConnections.forEach(function(conn) {
			object.connections.push(conn.toObject());
		});
		object.comment = mComment;
		return object;
	}
	
	self.fromObject = function(object) {
		// name and type are read by the super (gui_graph)
		if ('is_directed'      in object) mIsDirected          = object.is_directed;
		if ('node_labels'      in object) mShowNodeLabels      = object.node_labels;
		if ('output_labels'    in object) mShowOutputLabels    = object.output_labels;
		if ('input_labels'     in object) mShowInputLabels     = object.input_labels;
		if ('condition_labels' in object) mShowConditionLabels = object.condition_labels;
//		if ('simulate_conditionals' in object) mSimulateConditionals     = object.simulate_conditionals;
//		if ('true_conditionals'     in object) mSimulateTrueConditionals = object.true_conditionals;
		
		if ('nodes' in object) {
			object.nodes.forEach(function(nodeDict) {
				var node = self.addNode(nodeDict.classname,nodeDict.id,nodeDict.position);
				node.fromObject(nodeDict);
			});
			if ('connections' in object) {
				object.connections.forEach(function(connectionDict) {
					var sourceNode = self.findNode(connectionDict.from);
					var targetNode = self.findNode(connectionDict.to);
					if (sourceNode==null || targetNode==null) {
						self.showMessage("(graph.js) READING ERROR",
							"At least one of the nodes ID does not exist: "+connectionDict.from,","+connectionDict.to);
					}
					else {
						var connection = self.addConnection(sourceNode,targetNode);
						connection.fromObject(connectionDict);
					}
				});
			}
		}
		if ('comment' in object) mComment = object.comment;
		return self;
	}
	
	// -----------------------------
	// User interface interaction
	// -----------------------------

	self.reportChange = function() { mUserInterface.reportChange(); }

	self.showMessage = function(header,message) {
		mUserInterface.showMessage(header,message);
	}

	self.getName = function() {
		return mUserInterface.getTitle();
	}

	// ---------------------------------------------------------
	// Information requests by graph objects or their graphics
	// ---------------------------------------------------------

	self.getIcon = function(classname) {
		return mElementService.getIcon(classname);
	}

	self.getPropertiesNameList = function(classname) {
		return mElementService.getPropertiesNameList(classname);
	}

	self.getPropertyType = function(classname,property_name) {
		return mElementService.getPropertyType(classname,property_name);
	}

	self.getPropertyAttributes = function(classname,property_name) {
		return mElementService.getPropertyAttributes(classname,property_name);
	}

	self.showHelp = function(classname) {
		mElementService.showHelp(classname);
	}

	// -----------------------------
	// Nodes
	// -----------------------------

	// Creates a unique free ID for a new element in the given list 
	function getUnusedNumberID(elements) {
		var available = Array(elements.length).fill().map((x,i)=>(i+1));
		//for (var i=1; i<=elements.length; i++) available.push(i);
		available.push(elements.length+1);
		for (var i=0; i<elements.length; i++) {
			var index = available.indexOf(elements[i].getID());
			if (index>=0) available.splice(index,1);
		}
		return available[0];
	}

	self.findNode = function(id) {
		for (var i=0; i<mNodes.length; i++) {
			if (mNodes[i].getID()==id) return mNodes[i];
		}
		return null;
	}

	self.getNodes = function() { return mNodes; }

	self.addNode = function(classname, id, point) {
		if (id==null) id = getUnusedNumberID(mNodes);
		if (point==null) point = [-0.9,0.9];
		var newNode = IODA_GRAPH.createNode(self,classname,id,point);
		mNodes.push(newNode);
		mPanel.setNodePressed(newNode);
		self.clearPath();
		self.reportChange();
		return newNode;
	}

	self.removeNode = function(node) {
		var index = mNodes.indexOf(node);
		if (index<0) return false; // Not found
		mNodes.splice(index,1);
		node.getAllConnections().forEach(function(conn) {
			self.removeConnection(conn);
		});
		mPanel.setNodePressed(null);
		node.destroy();
		self.clearPath();
		self.reportChange();
		return true; // found and removed
	}

	/**
	 * What to do when a node is selected (by clicking on it)
	 * @param the node that has been pressed. null if none
	 */
	self.nodeSelected = function(node) {
		//if (node) node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_SELECTED);
		if (mNodeSelectedAction) mNodeSelectedAction(node); //showNodeProperties(node);
	}

	self.nodeUnselect = function(node) {
		//if (node) node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_NORMAL);
		if (mNodeUnselectedAction) mNodeUnselectedAction(node); //showNodeProperties(node);
	}

	/**
	 * What to do when a node is requested to run 
	 * (by double-clicking on it, for instance)
	 * @param the node that has been requested for action, null if none
	 */
	self.nodeAction = function(node) {
		if (mNodeAction) mNodeAction(node);
	}

	// -----------------------------
	// Connections
	// -----------------------------

	self.getConnections = function() { return mConnections; }

	self.addConnection = function(sourceNode,targetNode) {
		var id = getUnusedNumberID(mConnections);
		var newConnection = IODA_GRAPH.createConnection(self,id,sourceNode,targetNode);
		mConnections.push(newConnection);
		self.clearPath();
		self.reportChange();
		return newConnection;
	}

	self.removeConnection = function(connection) {
		var index = mConnections.indexOf(connection);
		if (index<0) {
			console.log("Connection "+connection.toString()+" NOT FOUND!");
			return false; // Not found
		}
		mConnections.splice(index,1);
		self.connectionSelected(null);
		connection.destroy();
		self.clearPath();
		self.reportChange();
		return true;
	}

	self.canConnect = function(sourceNode, targetNode) {
		if (sourceNode==targetNode) return false;
		return true; // No limits in the number of connections between nodes 
	};

	self.connectionSelected = function(connection) {
		if (mConnectionSelectedAction) mConnectionSelectedAction(connection);
	}

	self.connectionAction = function(connection) {
		if (mConnectionAction) mConnectionAction(connection);
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
		self.showPath(path);
		return path;
	}

	/**
	 Highlights a path
	 @param connectionPath : a list of connections forming a path
	 @param cyclePath : a list of connections forming an incorrect cycle, if any
	 */
	self.showPath = function(connectionPath) {
		connectionPath.forEach(function(connection) {
			var sourceNode = connection.getSourceNode();
			if (sourceNode.canBeCoded()) sourceNode.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_CAN_BE_CODED); 
			else sourceNode.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_CAN_NOT_BE_CODED);
			
			var targetNode = connection.getTargetNode();
			if (targetNode.canBeCoded()) targetNode.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_CAN_BE_CODED);
			else targetNode.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_CAN_NOT_BE_CODED);
			
			connection.setConnectionStatus(GRAPH_CONSTANTS.CONNECTION_STATUS_TRAVERSED);
		});
		mPanel.render();
	};
	
	self.clearPath = function() {
		mNodes.forEach(function(node) {
			node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_NORMAL);
		});
		mConnections.forEach(function(connection) {
			connection.setConnectionStatus(GRAPH_CONSTANTS.CONNECTION_STATUS_NORMAL);
		});
		mPanel.render();
	}

	// -----------------------------
	// Graphic visualization
	// -----------------------------
	
	self.getPanel = function() { return mPanel; }
	
	self.resized = function(width,height) { 
		mPanel.resized(width,height);
		//mPanel.render();
	};

	self.render = function() {
		mNodes.forEach(function(node) {
			node.render();
		});
		mConnections.forEach(function(connection) {
			connection.render();
		});
		mPanel.render(); 
	}

	// -----------------------------
	// Final start-up
	// -----------------------------
	
	mPanel = IODA_GRAPHICS.createPanel(self);

	return self;
}

