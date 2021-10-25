/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 *
 * This code is Open Source and is provided "as is".
*/

var IODA_DISPLAYED_OBJECTS = IODA_DISPLAYED_OBJECTS || {};

/**
 * Creates a single Graph object on a given <div> specified by its ID
 * The ID is needed for the underlying panel to gets its <div>
 */
IODA_DISPLAYED_OBJECTS.createGraph = function(mGraphPage,mID,mName,mTopLevel) {
//    console.log("Creating graph"+mID+" : "+mName);
	var self = {};
	var mNodes = [];
	var mConnections = [];

	// -----------------------------
	// Global utils
	// -----------------------------

	self.getTopLevel = function() { return mTopLevel; }
	
	self.showProperties = function(node) {
		mGraphPage.showProperties(self,node);
	};
	
	self.resized = function(width,height) {
		mPanel.resized(width,height);
	};
	
	self.activated = function() { mPanel.activated(); };
	
	self.destroy = function() { } // Do nothing
	
	self.reportChange = function() { mGraphPage.reportChange(); }
	
	self.getIcon = function(classname) {
		return sMainElementList.getIcon(classname);
	}
	
	// -----------------------------
	// Basic setters and getters
	// -----------------------------

	self.isGraph = true;

	self.getID = function() { return mID; }

	self.getName = function() { return mName; }

	self.setName = function(name) {
		if (mName!=name) {
			mName = name;
			self.reportChange();
		}
	}

	// -----------------------------
	// Nodes
	// -----------------------------

	function getUnusedID(elements) {
		var available = [];
		for (var i=1; i<=elements.length; i++) available.push(i);
		available.push(elements.length+1);
		for (i=0; i<elements.length; i++) {
			var index = available.indexOf(elements[i].getID());
			available.splice(index,1);
		}
		return available[0];
	}

	function findNode(id) {
		for (var i=0; i<mNodes.length; i++) {
			if (mNodes[i].getID()==id) return mNodes[i];
		}
		return null;
	}

	self.addNode = function(classname, point,id) {
		if (typeof id === "undefined") id = getUnusedID(mNodes);
		var newNode = IODA_GRAPH.createNode(self,id,classname,point);
		if (newNode.getGraphicNode()) { // effectively created
			mNodes.push(newNode);
			self.reportChange();
			return newNode;
		}
		return null;
	};

	self.removeNode = function(node) {
		var index = mNodes.indexOf(node);
		if (index<0) return false; // Not found
		node.removeGraphics();
		mNodes.splice(index,1);
		var conns = node.getInputConnections();
		for (var i=0; i<conns.length; i++) self.removeConnection(conns[i]);
		conns = node.getOutputConnections();
		for (i=0; i<conns.length; i++) self.removeConnection(conns[i]);
		mPanel.unselectGraphics(node.getGraphicNode());
		self.reportChange();
		return true; // found and removed
	};

	self.createPanelNode = function(classname) {
		mPanel.createNode(classname);
	};

	// -----------------------------
	// Connections
	// -----------------------------
	
	function findConnection(fromNode,toNode) {
		for (var i=0; i<mConnections.length; i++) {
			if (mConnections[i].connects(fromNode,toNode)) return mConnections[i];
		}
		return null;
	}

	self.getConnections = function() { return mConnections; }
	
	self.addConnection = function(fromNode,toNode) {
		var id = getUnusedID(mConnections);
		var newConnection = IODA_GRAPH.createConnection(self,id,fromNode,toNode);
		if (newConnection.getGraphicConnection()) {
			mConnections.push(newConnection);
			mPanel.clearPath();
			self.reportChange();
		}
	};

	self.removeConnection = function(connection) {
		var index = mConnections.indexOf(connection);
		if (index<0) {
			alert ("Connection not found : "+connection.getID());
			return false; // Not found
		}
		//alert ("Connection found : "+connection.getID());
		connection.destroy();
		mConnections.splice(index,1);
		mPanel.clearPath();
		self.reportChange();
		return true;
	};

	self.canConnect = function(fromNode, toNode) {
		if (fromNode==toNode) return false;
		if (toNode.getInputConnections().length>=toNode.getInterfaceAttribute('maximum_input')) return false;
		return findConnection(fromNode,toNode)==null;
	};

	// -----------------------------
	// Paths
	// -----------------------------
	
/*
	function listNodes(array) {
		var str = "";
		for (var i=0; i<array.length; i++) str += ", "+array[i].getID()+":"+array[i].getName();
		return str;
	}
*/

	self.showPathToNode = function(node,display) {
		var path = [node];
		var cycle = recursiveAddParents(node,path,[node]);
		if (cycle) {
			mPanel.showPath(cycle.pathToCycle,false); // false = NOT isCycle
			mPanel.showPath(cycle.cycle,true); // true = isCycle
			sShowMessage("Path Error","Path from "+node.getName()+" contains a cycle");
			return null;
		}
//		console.log ("Path = "+listNodes(path));
		if (display) mPanel.showPath(path,false); // false = NOT isCycle
		return path;
	};

	self.showHelp = function(node) {
		sShowHelp(node);
	}

	/**
	 * returns a dictionary with the information of the traversed graph 
	 * returns null if the graph is not ready  
	 */
	self.getDirectedGraph = function(finalNode) {
	  var i,j;
	  var path = self.showPathToNode(finalNode,false);
	  if (path==null) return null;
	  for (i=0; i<path.length; i++) {
	    if (!path[i].canBeCoded(true)) return null;
	  }
	  var orderedList = codeOrder(path);
	  //console.log("Code order is "+listNodes(orderedList));
	  var nodeList = [];
	  for (i=0; i<orderedList.length; i++) {
	    var node = orderedList[i];
	    var callList = [];
	    var connsIn = node.getInputConnections();
	    for (j=0; j<connsIn.length; j++) callList.push(connsIn[j].getFromNode().getID());
	
	    /*
	    var propValues = {};
	    var properties = node.getProperties();
	    for (j=0; j<properties.length; j++) {
	      var property = properties[j];
	      if (property.value && property.value.trim().length>0) propValues[property.name] = property.value;
	    }
	   */
	    nodeList.push({ id : node.getID(),
	      name : node.getName(),
	      type : node.getClassname(),
	      //code_file : sMainElementList.getCodeFile(node.getClassname()),
	      properties : node.getProperties(),
	      incoming : callList });
	  }
	  return { id : finalNode.getID(), name : finalNode.getName(), description : '', node_list : nodeList};
	};
	
	function codeOrder(path) {
	  var unorderedList = path.slice();
	  for (var i=0; i<unorderedList.length; i++)
	    unorderedList[i].untraverseInputConnections(); // initialize connections for this node
	  var orderedList = [];
	  var indexLeafNode = findLeafNodeIndex(unorderedList);
	  while (indexLeafNode>=0) {
	    var leafNode = unorderedList[indexLeafNode];
	    //console.log("Leaf node = "+leafNode.getName());
	    unorderedList.splice(indexLeafNode,1);
	    orderedList.push(leafNode);
	    leafNode.traverseOutputConnections();
	    indexLeafNode = findLeafNodeIndex(unorderedList);
	  }
	  return orderedList;
	}
	
	function findLeafNodeIndex(list) {
	  for (var i=0; i<list.length; i++) {
	    var node = list[i];
	    var connIn = node.getInputConnections();
	    var isLeaf = true;
	    for (var j=0; j<connIn.length; j++) {
	      if (!connIn[j].isTraversed()) {
	        isLeaf = false;
	        break;
	      }
	    }
	    if (isLeaf) return i;
	  }
	  return -1;
	}
	
	function recursiveAddParents(child,currentList,genealogy) {
	  var inputConns = child.getInputConnections();
	  for (var i=0; i<inputConns.length; i++) {
	    var parent = inputConns[i].getFromNode();
	    var index = genealogy.indexOf(parent);
	    if (index!=-1) {
	      if (index>0) return { pathToCycle : genealogy.splice(0,index), cycle : genealogy };
	      return { pathToCycle : [], cycle : genealogy };
	    }
	    if (currentList.indexOf(parent)<0) { // Only if not yet visited
	      currentList.push(parent);
	      var parentGenealogy = genealogy.concat([parent]);
	      var cycle = recursiveAddParents(parent,currentList,parentGenealogy)
	      if (cycle) return cycle;
	    }
	  }
	  return null;
	}

	// -----------------------------
	// Serialization
	// -----------------------------
	
	self.toObject = function(object) {
		if (typeof object === "undefined") object = {};
		if (!object.name) object.name = mName;
		if (!object.type) object.type = "Graph";
		object.nodes = [];
		object.connections = [];
		for (var i=0; i<mNodes.length; i++) object.nodes.push(mNodes[i].toObject());
		for (var j=0; j<mConnections.length; j++) object.connections.push(mConnections[j].toObject());
		return object;
	}
	
	self.fromObject = function(object) {
		var nodes = object.nodes;
		if (typeof nodes === "undefined") return self; // Nothing to read from
		for (var i=0; i<nodes.length; i++) {
			var node_json = nodes[i];
			var node = self.addNode(node_json.classname,node_json.position,node_json.id);
			node.fromObject(node_json);
		}
		var connections = object.connections;
		for (var j=0; j<connections.length; j++) {
			var connection = connections[j];
			var fromNode = findNode(connection.from);
			var toNode = findNode(connection.to);
			if (fromNode==null || toNode==null) {
				console.log("Reading error: At least one of the nodes ID does not exist: "+node.from,","+node.to);
			}
			else self.addConnection(fromNode,toNode);
		}
		return self;
	}
	
	// -----------------------------
	// Graphic visualization
	// -----------------------------
	
	self.getPanel = function() { return mPanel; }
	
	var mPanel = IODA_GRAPH.createPanel(self);
	
	return self;
} // end of createGraph

