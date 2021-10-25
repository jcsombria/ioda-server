/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 *
 * This code is Open Source and is provided "as is".
*/

var IODA_DISPLAYED_OBJECTS = IODA_DISPLAYED_OBJECTS || {};

/**
	* Decides in which part of the input node will a connection get in
	* 1 : left, 2: top, 3: right, 4: bottom
 */
IODA_DISPLAYED_OBJECTS.NodeEntryPoint = function (input, output) {
	var dx = output[0]-input[0], dy = output[1]-input[1];
	if (Math.abs(dx)>=Math.abs(dy)) { // Horizontal connection
		if (dx>=0) return 1;
		return 3;
	}
	if (dy>=0) return 4;
	return 2; 
};

/**
 * Creates a single Graph object on a given <div> specified by its ID
 */
IODA_DISPLAYED_OBJECTS.Graph = {

 /**
  * The ID is needed for the underlying panel to gets its <div>
  */
  createGraph : function(mGraphPage,mID,mName,mTopLevel) {

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
     // for (var i=0; i<mNodes.length; i++) mNodes[i].sortConnections();
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
    };

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
    // Nodes
    // -----------------------------

    function findNode(id) {
      for (var i=0; i<mNodes.length; i++) {
        if (mNodes[i].getID()==id) return mNodes[i];
      }
      return null;
    };

    self.addNode = function(classname, point,id) {
      if (typeof id === "undefined") id = getUnusedID(mNodes);
      var newNode = IODA_DISPLAYED_OBJECTS.Graph.createNode(self,id,classname,point);
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
    };

    self.getConnections = function() { return mConnections; }

    self.addConnection = function(fromNode,toNode) {
      var id = getUnusedID(mConnections);
      var newConnection = IODA_DISPLAYED_OBJECTS.Graph.createConnection(self,id,fromNode,toNode);
      if (newConnection.getGraphicConnection()) {
        mConnections.push(newConnection);
        mPanel.clearPath();
        self.reportChange();
      }
    };

//    self.removeConnectionBetweenNodes = function(fromNode,toNode) {
//      var connection = findConnection(fromNode,toNode);
//      if (!connection) return false; // Not found
//      return self.removeConnection(connection);
//    }

   self.removeConnection = function(connection) {
      var index = mConnections.indexOf(connection);
      if (index<0) return false; // Not found
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

    self.updateConnectionGraphics = function(node) {
      var i,j;
      node.sortConnections();
      var conns = node.getInputConnections();
      for (i=0; i<conns.length; i++) {
        conns[i].getFromNode().sortConnections();
        var origConns = conns[i].getFromNode().getOutputConnections();
        for (j=0; j<origConns.length; j++) mPanel.updateGraphicConnection(origConns[j]);
//        mPanel.updateGraphicConnection(conns[i]);
      }
      conns = node.getOutputConnections();
      for (i=0; i<conns.length; i++) {
        conns[i].getToNode().sortConnections();
        var targetConns = conns[i].getToNode().getInputConnections();
        for (j=0; j<targetConns.length; j++) mPanel.updateGraphicConnection(targetConns[j]);
      }
    };


		
    /**
     * Used to order connections, both graphically and for coding purposes
     * conn1 and conn2 are input connections of the same node
     */
		self.compareInputConnections = function(conn1,conn2) {
			var input = conn1.getToNode().getGraphicNode().getPosition();
			var output1 = conn1.getFromNode().getGraphicNode().getPosition();
			var output2 = conn2.getFromNode().getGraphicNode().getPosition();
			var entry1 = IODA_DISPLAYED_OBJECTS.NodeEntryPoint(input,output1);
			var entry2 = IODA_DISPLAYED_OBJECTS.NodeEntryPoint(input,output2);
			if (entry1!=entry2) return entry2-entry1;
			if (entry1==1 || entry==3) return output2[1]-output1[1]; // Horizontal connection 
			return output2[0]-output1[0]; // Vertical connection 
		};

    /**
     * Used to order connections, both graphically and for coding purposes
     * conn1 and conn2 are output connections from the same node
     */
    self.compareOutputConnections = function(conn1,conn2) {
			var output = conn1.getFromNode().getGraphicNode().getPosition();
      var input1 = conn1.getToNode().getGraphicNode().getPosition();
      var input2 = conn2.getToNode().getGraphicNode().getPosition();
			var entry1 = IODA_DISPLAYED_OBJECTS.NodeEntryPoint(input1,output);
			var entry2 = IODA_DISPLAYED_OBJECTS.NodeEntryPoint(input2,output);
			if (entry1!=entry2) return entry2-entry1;
			if (entry1==1 || entry==3) return input2[1]-input1[1]; // Horizontal connection 
			return input2[0]-input1[0]; // Vertical connection 
    };

    // -----------------------------
    // Paths
    // -----------------------------

    function listNodes(array) {
      var str = "";
      for (var i=0; i<array.length; i++) str += ", "+array[i].getID()+":"+array[i].getName();
      return str;
    }

    self.showPathToNode = function(node,display) {
      var path = [node];
      var cycle = recursiveAddParents(node,path,[node]);
      if (cycle) {
        mPanel.showPath(cycle.pathToCycle,false); // false = NOT isCycle
        mPanel.showPath(cycle.cycle,true); // true = isCycle
        sShowMessage("Path Error","Path from "+node.getName()+" contains a cycle");
        return null;
      }
//      console.log ("Path = "+listNodes(path));
      if (display) mPanel.showPath(path,false); // false = NOT isCycle
      return path;
    };

    self.showHelp = function(node) {
      sShowHelp(node);
    }

		/**
			returns a dictionary with the information of the traversed graph 
			returns null if the graph is not ready  
		 */
    self.getDirectedGraph = function(finalNode) {
      var i,j;
      var path = self.showPathToNode(finalNode,false);
      if (path==null) return null;
      for (i=0; i<path.length; i++) {
        if (!path[i].canBeCoded(true)) return null;
      }
      var orderedList = codeOrder(path);
//      console.log("Code order is "+listNodes(orderedList));
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
//          code_file : sMainElementList.getCodeFile(node.getClassname()),
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
//        console.log("Leaf node = "+leafNode.getName());
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
    // Utils
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
    };

    // -----------------------------
    // Graphic visualization
    // -----------------------------

    self.getPanel = function() { return mPanel; }

    var mPanel = IODA_DRAWING.Panel.createPanel(self);

    return self;
} // end of createGraph

,

  /**
   * @param mID : a unique integer number that identifies the node
   */
  createNode : function(mGraph,mID,mClassname,mPoint) {
    var self = {};
    var mName = "Node "+mID;
    var mOutputConnections = [];
    var mInputConnections = [];
    var mProperties = [];

    // -----------------------------
    // Basic setters and getters
    // -----------------------------

    self.isNode = true;

    self.getGraph = function() { return mGraph; }

    self.getID = function() { return mID; }

    self.getName = function() { return mName; }

    self.setName = function(name) {
      if (name && mName!=name) {
        mName = name;
        mGraph.getPanel().updateNodeName(self);
        mGraph.reportChange();
      }
    }

    self.getClassname = function() { return mClassname; }

    // -----------------------------
    // Connections to and from node
    // -----------------------------

    self.sortConnections = function () {
      mInputConnections.sort(mGraph.compareInputConnections);
      mOutputConnections.sort(mGraph.compareOutputConnections);
    }

    self.getInputConnections   = function () { return mInputConnections; }

    self.addInputConnection    = function (connection) { handleConnectionList(connection,true,true); }

    self.removeInputConnection = function (connection) { handleConnectionList(connection,true,false); }

    self.getOutputConnections   = function () { return mOutputConnections; }

    self.addOutputConnection    = function (connection) { handleConnectionList(connection,false,true); }

    self.removeOutputConnection = function (connection) { handleConnectionList(connection,false,false); }

    self.getConnectionRelativePosition = function(connection,isInput) {
      var list = isInput ? mInputConnections : mOutputConnections;
      var nConn = list.length;
      var index = list.indexOf(connection);
      var delta = 1.0/2;
      var first = (nConn % 2 === 0) ? (0.5-nConn/2) * delta : -(nConn-1)/2 * delta;
      return first + index*delta;
    }

    function handleConnectionList(connection, isInput, add) {
      var list = isInput ? mInputConnections : mOutputConnections;
      if (add) list.push(connection);
      else {
        var index = list.indexOf(connection);
        if (index>=0) list.splice(index,1);
      }
      list.sort(isInput ? mGraph.compareInputConnections : mGraph.compareOutputConnections);
      for (var j=0; j<list.length; j++) mGraph.getPanel().updateGraphicConnection(list[j]);
    }

    // -----------------------------
    // Code generation
    // -----------------------------

    self.untraverseInputConnections = function() {
      for (var i=0; i<mInputConnections.length; i++)
        mInputConnections[i].setTraversed(false);
    }

    self.traverseOutputConnections = function() {
      for (var i=0; i<mOutputConnections.length; i++)
        mOutputConnections[i].setTraversed(true);
    }

    /**
     * Checks if the node can be coded. That is, if it has correct
     * input and required parameters
     */
    self.canBeCoded = function(verbose) {
      var minimumInput = self.getInterfaceAttribute("minimum_input");
      if (mInputConnections.length<minimumInput) {
        if (verbose) sShowMessage("ERROR BEFORE CODING", "Error at node: '"+self.getName()+"'. Node must receive at least "+minimumInput+" input(s)");
        return false;
      }
      var maximumInput = self.getInterfaceAttribute("maximum_input");
      var shortInput =  mInputConnections.length<maximumInput;
      for (var i=0; i<mProperties.length; i++) {
        var property = mProperties[i];
        var required = self.getPropertyAttribute(property,"required");
        // console.log("Node "+ self.getName()+ " Property "+property.name+" is required = "+required);
        if (required!=null && property.value.trim().length<=0) {
          required = required.toUpperCase();
          if (required=="ALWAYS") {
            if (verbose) sShowMessage("ERROR BEFORE CODING",
               "Error at node: '"+self.getName()+"'. Must fill property '"+property.name+"'");
            return false;
          }
          if (shortInput && required=="SHORT_INPUT") {
            if (verbose) sShowMessage("ERROR BEFORE CODING",
              "Error at node: '"+self.getName()+"'. Must fill property '"+property.name+
                "', or provide "+ (maximumInput>1 ? maximumInput+" inputs" : " an input"));
            return false;
          }
        }
      }
      return true;
    }

    self.getInterfaceAttribute = function(attribute) {
      return sMainElementList.getInterfaceAttribute(mClassname,attribute);
    }

    self.getPropertyAttribute = function(property, attribute) {
      return sMainElementList.getPropertyAttribute(mClassname,property.name,attribute);
    }

    // -----------------------------
    // Saving and reading
    // -----------------------------

    self.toObject = function() {
      var object = {};
      object.id = mID;
      object.name = mName;
      object.classname = mClassname;
      object.position = mGraphicNode.getPosition();
      object.properties = mProperties;
      return object;
    }

    self.fromObject = function(object) {
      self.setName(object.name);
      if (object.properties) mProperties = object.properties.slice();
      // Add possible new properties (By edition of the master file
      var propNames = sMainElementList.getPropertiesName(mClassname);
      for (var i=0; i<propNames.length; i++) {
        var name = propNames[i];
        var found = false;
        for (var j=0; j<mProperties.length; j++) {
          if (mProperties[j].name==name) { found = true; break; }
        }
        if (!found) mProperties.push(newProperty(name))
      }
      return object;
    }

    // -----------------------------
    // Properties
    // -----------------------------

    function newProperty(name) {
      return { name : name,
        type : sMainElementList.getPropertyAttribute(mClassname,name,"type"),
        value : ""};
    }

   {
     var propNames = sMainElementList.getPropertiesName(mClassname);
     for (var i=0; i<propNames.length; i++) {
       var name = propNames[i];
       mProperties.push(newProperty(name));
     }
   }

   self.getProperties = function() { return mProperties; }

   self.setProperty = function(name,value) {
     var prop = findProperty(name);
     if (prop && prop!=prop.value) {
       prop.value = value;
       mGraph.reportChange();
     }
   }

   self.getProperty = function(name) {
     var prop = findProperty(name);
     if (prop) return prop.value;
     return null;
   }

   function findProperty(name) {
     for (var i=0; i<mProperties.length; i++) {
       var prop = mProperties[i];
       if (prop.name==name) return prop;
     }
     return "";
   }

    // -----------------------------
    // Graphic visualization
    // -----------------------------

    self.getGraphicNode = function() { return mGraphicNode; }

    self.removeGraphicNode = function() { mGraph.getPanel().removeGraphics(mGraphicNode); }

    var mGraphicNode = mGraph.getPanel().createGraphicNode(self,mPoint);

    return self;
  } // end of createNode

,

  /**
   * mID : a unique integer number that identifies the connection
   */
  createConnection : function(mGraph,mID,mFromNode,mToNode) {
    var self = {};

    var mTraversed = false; // Whether the connection has been traversed when following a path

    // -----------------------------
    // Basic setters and getters
    // -----------------------------

    self.getID = function() { return mID; }

    self.getFromNode = function() { return mFromNode; }

    self.getToNode   = function() { return mToNode; }

    self.destroy = function() {
      mFromNode.removeOutputConnection(self);
      mToNode.removeInputConnection(self);
			mGraphicConnection.remove();
    }

    // -----------------------------
    // Saving and reading
    // -----------------------------

    self.toObject = function() {
      var object = {};
      object.from = mFromNode.getID();
      object.to = mToNode.getID();
      return object;
    }

    self.toString = function() { return "("+mFromNode.getName()+", "+mToNode.getName()+")"; }

    // -----------------------------
    // Path coding utilities
    // -----------------------------

    self.isTraversed   = function() { return mTraversed; }

    self.setTraversed  = function(traversed) { mTraversed = traversed; }

    // -----------------------------
    // Node related utilities
    // -----------------------------

    self.connects = function(fromNode,toNode) {
      return fromNode==mFromNode && toNode==mToNode;
    };

    // -----------------------------
    // Graphic visualization
    // -----------------------------

    self.getGraphicConnection = function() { return mGraphicConnection; }

    // Order is important in what follows
    var mGraphicConnection = mGraph.getPanel().createGraphicConnection(self);

    mFromNode.addOutputConnection(self);
    mToNode.addInputConnection(self);

    mGraph.getPanel().updateGraphicConnection(self);

    return self;
  } // end of createConnection


};
