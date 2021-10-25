/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 *
 * This code is Open Source and is provided "as is".
*/

var IODA_GRAPH = IODA_GRAPH || {};

/**
 * Creates a single Node object 
 * @param mID : a unique integer number that identifies the node
 */
IODA_GRAPH.createNode = function(mGraph,mID,mClassname,mPoint) {

	var self = {};
	var mName = "Node "+mID;
	var mOutputConnections = [];
	var mInputConnections = [];
	var mAllConnections = []; // Used only temporarily to sort and place lines
	var mProperties = [];
	var mGraphicNode; // defined at the end
	
  // -----------------------------
  // Basic setters and getters
  // -----------------------------

	self.isNode = true;

	self.getGraph = function() { return mGraph; }

	self.getID = function() { return mID; }

	self.getClassname = function() { return mClassname; }

	self.getName = function() { return mName; }

	self.setName = function(name) {
		if (name && mName!=name) {
		mName = name;
		mGraph.getPanel().updateNodeName(self);
		mGraph.reportChange();
		}
	}

	// -----------------------------
	// Connections to and from node
	// -----------------------------

	function handleConnectionList(connection, isInput, add) {
		var list = isInput ? mInputConnections : mOutputConnections;
		if (add) list.push(connection);
		else {
			var index = list.indexOf(connection);
			if (index>=0) list.splice(index,1);
		}
		self.redrawConnections(); // redraw verything that needs to be redrawn
	}

	self.getInputConnections   = function () { return mInputConnections; }

	self.addInputConnection    = function (connection) {
		handleConnectionList(connection,true,true);
	}

	self.removeInputConnection = function (connection) {
		handleConnectionList(connection,true,false);
	}

	self.getOutputConnections   = function () { return mOutputConnections; }

	self.addOutputConnection    = function (connection) {
		handleConnectionList(connection,false,true);
	}

	self.removeOutputConnection = function (connection) {
		handleConnectionList(connection,false,false);
	}

	// -----------------------------
	// Ordering and drawing connections 
	// -----------------------------

	function findZone(conn) { 
		return (self==conn.getToNode()) ? conn.getInputZone() : conn.getOutputZone(); 
	}
	
	function findPos(conn)  { 
		return (self==conn.getToNode()) ? 
			conn.getFromNode().getGraphicNode().getPosition() :
			conn.getToNode().getGraphicNode().getPosition(); 
	}

	/**
	 * Used to order connections  graphically
	 * conn1 and conn2 are output connections of the same node
	 */
	function compareConnections(conn1,conn2) {
		var zone1 = findZone(conn1), zone2 = findZone(conn2);
		if (zone1!=zone2) return zone2-zone1;
		var pos1 = findPos(conn1), pos2 = findPos(conn2);
		if (zone1==1 || zone1==3) return pos2[1]-pos1[1]; // Horizontal connection 
		return pos1[0]-pos2[0]; // Vertical connection 
	}
	
	self.redrawConnections = function () {
		mAllConnections = mInputConnections.concat(mOutputConnections);
		mAllConnections.forEach (function(conn) { conn.updateInputZone(); });
		mAllConnections.sort(compareConnections);
		mAllConnections.forEach (function(conn) { mGraph.getPanel().updateGraphicConnection(conn); });
	}

	self.updateConnectionGraphics = function() {
		self.redrawConnections();
		self.getInputConnections().forEach (function(inConn) { 
			inConn.getFromNode().redrawConnections();
		});
		self.getOutputConnections().forEach (function(outConn) { 
			outConn.getToNode().redrawConnections();
		});
	};
	
	self.getConnectionRelativePosition = function(connection) {
		var zone = (connection.getToNode()==self) ? connection.getInputZone() : connection.getOutputZone();
		var sublist=[];
		if (mAllConnections.filter) {
			sublist = mAllConnections.filter(conn => 
				((conn.getToNode()==self) ? conn.getInputZone() : conn.getOutputZone())==zone);
		}
		else {
			//console.log("do_node warning: Browser does not support Array.filter!");
			for (var i=0; i<mAllConnections.length; i++) {
				var conn = mAllConnections[i];
				if (((conn.getToNode()==self) ? conn.getInputZone() : conn.getOutputZone())==zone) sublist.push(conn);
			}
		} 
		var nConn = sublist.length;
		var index = sublist.indexOf(connection);
		var delta = 1.0/2;
		var first = (nConn % 2 === 0) ? (0.5-nConn/2) * delta : -(nConn-1)/2 * delta;
		// if (self.getID()==4) console.log("Conn "+connection.getID()+" is # "+index+"/"+nConn+" of zone "+zone+ " of node "+self.getID()+" = "+(first + index*delta));
		return first + index*delta;
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
		var propNames = sMainElementList.getPropertiesNames(mClassname);
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
		return {
			name : name,
			type : sMainElementList.getPropertyAttribute(mClassname,name,"type"),
			value : ""
		};
	}

	{
	var propNames = sMainElementList.getPropertiesNames(mClassname);
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

	mGraphicNode = mGraph.getPanel().createGraphicNode(self,mPoint);

	return self;

}; // end of createNode
