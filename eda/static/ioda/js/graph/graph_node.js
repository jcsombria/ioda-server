/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 *
 * This code is Open Source and is provided "as is".
*/

var IODA_GRAPH = IODA_GRAPH || {};

/**
 * Creates a Node object 
 * A node represents an action that can be done - this action is referred to
 * as "running the node".
 * Nodes can have parameters, a.k.a. 'properties', that can be set before running a node.
 * Some parameters are required. This means that, if not all required parameters
 * have been set, the node cannot be run (thus preventing the run of subsequent 
 * nodes).
 * Parameters can be set either manually (using setParameter()), or by means of
 * Connections, which set one parameter of the target node to one value 
 * of the output of the source node.
 * Output from one node consists of a choice of several possible parameters,
 * which a connection can select from by name.
 * @param mGraph : the parent graph
 * @param mClassname : the classname of the node
 * @param mID : a unique integer number that identifies the node
 * @param mPoint : A position for the node's graphics
 */
IODA_GRAPH.createNode = function(mGraph,mClassname,mID,mPoint) {
	const GRAPH_CONSTANTS = IODA_GRAPH.Constants;
	var self = {};
	// The name can be displayed next to the node
	var mName = "Node "+mID;
	var mStatus = GRAPH_CONSTANTS.NODE_STATUS_NORMAL; // Status is volatile: does not need to be saved 
	var mComment = "";
	
	var mProperties = []; // Only properties need to be (partially) saved and recovered
	var mInputConnections = [];
	var mOutputConnections = [];
	var mGraphicNode;
	
  // ----------------------------------
  // Basic setters, getters, and utils
  // ----------------------------------

	self.getGraph = function() { return mGraph; }

	self.getClassname = function() { return mClassname; }

	self.getID = function() { return mID; }

	self.getName = function() { return mName; }

	self.setName = function(name) {
		if (name && mName!=name) {
			mName = name;
			mGraphicNode.updateName(name);
			mGraph.reportChange();
		}
	}
	
	self.getComment = function() { return mComment; }

	self.setComment = function(comment) {
		if (mComment!=comment) {
			mComment = comment;
			mGraph.reportChange();
		}
	}

	self.setNodeStatus = function (status) {
		if (status!=mStatus) {
			mStatus = status;
			mGraphicNode.updateStyle();
		}
	}
	
	self.getNodeStatus = function () {
		return mStatus;
	}

	// Cleans memory and any associated graphic
	self.destroy = function() {
		mProperties = [];
		mOutputConnections = [];
		mInputConnections = [];
		mGraphicNode.removeGraphics();
	}

	// -----------------------------
	// Saving and reading
	// -----------------------------
	
	self.toObject = function() {
		var object = {};
		// ID must be saved (and read) because it is used by connections
		object.id = mID;
		object.classname = mClassname;
		object.position = mGraphicNode.getPosition();
		// These are not read back by the parent graph
		object.name = mName;
		object.properties = [];
		mProperties.forEach(function(property) {
			if (property.value!=null) 
				object.properties.push ({ name : property.name , value : property.value });
		});
		object.comment = mComment;
		return object;
	}
	
	self.fromObject = function(object) {
		// id, classname and position are read by the super (graph)
		// Not read by graph:
		mName = object.name;
		mGraphicNode.updateName(object.name);
		if ('properties' in object) {
			object.properties.forEach(function(property) {
				if (self.setProperty(property.name,property.value)==null) {
					console.log ("IODA NODE WARNING : Property <"+property.name+"> read for "+mName+" does not exist!");
				}
			});
		}
		if ('comment' in object) mComment = object.comment;
		return object;
	}

	// -----------------------------
	// Properties
	// -----------------------------

	// Creates and adds a new property to the node
	// The property holds classname information for the node,
	// which does not need to be saved 
	function addProperty(property_name, value) {
		var property = {
			name : property_name,
			type : mGraph.getPropertyType(mClassname,property_name),
			attributes : mGraph.getPropertyAttributes(mClassname,property_name),
			linked_by : [],
			value : value
		};
		mProperties.push(property);
	}

	function findProperty(name) {
		for (var i=0; i<mProperties.length; i++) {
			var property = mProperties[i];
			if (property.name===name) return property;
		}
		return null;
	}

	self.getProperties = function() { return mProperties; }

	self.setProperty = function(name,value) {
		var property = findProperty(name);
		if (property===null) return null;
		//property.linked_by = [];
		if (property!=property.value) {
			property.value = value;
			mGraph.reportChange();
		}
		return property;
	}

	self.getProperty = function(name) {
		var property = findProperty(name);
		if (property) return property.value;
		return null;
	}

	self.isPropertyType = function(property, type) {
		var types = property.type.split('|');
		if (type=='OPTION') {
			for (var i=0; i<types.length; i++) {
				if (types[i].startsWith('OPTION')) return true;
			} 
			return false;
		}
		return (types.indexOf(type)>=0);
	}

	self.getPropertyOptions = function(property) {
		var types = property.type.split('|');
		var options = null;
		for (var i=0; i<types.length; i++) {
			if (types[i].startsWith('OPTION')) {
				options = types[i].substring(6);
				break;
			}
		}
		if (!options) return null;
		var index = options.indexOf('[');
		if (index>=0) options = options.substring(index+1);
		index = options.lastIndexOf(']');
		if (index>=0) options = options.substring(0,index);
		var optionArray = options.split(',');
		for (var i=0; i<optionArray.length; i++)
			optionArray[i] = optionArray[i].trim();
		return optionArray;
	}

	self.isPropertyAttribute = function(property, attribute) {
		var attr = property.attributes.split('|');
		return (attr.indexOf(attribute)>=0);
	}

	self.getPropertiesWithAttribute = function(attribute) {
		var propertiesWithAttribute = [];
		mProperties.forEach(function(property) {
			var attrs = property.attributes.split('|');
			if (attrs.indexOf(attribute)>=0) propertiesWithAttribute.push(property);
		});
		return propertiesWithAttribute;
	}
	
	/**
	 * Used by connections to link properties
	 */
	self.addLinkToProperty = function(property_name,connection) {
		var property = findProperty(property_name);
		if (property===null) return null;
		var index = property.linked_by.indexOf(connection);
		if (index<0) property.linked_by.push(connection); // Not found -> add it
		mGraph.reportChange();
	}

	/**
	 * Used by connections to link properties
	 */
	self.removeLinkToProperty = function(property_name,connection) {
		var property = findProperty(property_name);
		if (property===null) return null;
		var index = property.linked_by.indexOf(connection);
		if (index>=0) {
			property.linked_by.splice(index,1);
			mGraph.reportChange();
		}
	}
	
	/**
	 * Used by gui to display a property as linked
	 */
	self.getPropertyConnectionLinks = function(property) {
		return property.linked_by;
	}

	self.isPropertyLinkedByConnection = function(property) {
		return property.linked_by.length>0;
	}

	// -----------------------------
	// Connections to and from node
	// -----------------------------
	
	self.getAllConnections = function() {
		return mInputConnections.concat(mOutputConnections);
	}
	
	self.getInputConnections = function () { return mInputConnections; }

	self.addInputConnection = function (connection) {
		mInputConnections.push(connection);
		mGraphicNode.redrawConnections(); // redraw everything that needs to be redrawn
	}

	self.removeInputConnection = function (connection) {
		var index = mInputConnections.indexOf(connection);
		if (index>=0) {
			mInputConnections.splice(index,1);
			mGraphicNode.redrawConnections(); // redraw everything that needs to be redrawn
		}
	}

	self.getOutputConnections = function () { return mOutputConnections; }

	self.addOutputConnection = function (connection) {
		mOutputConnections.push(connection);
		mGraphicNode.redrawConnections(); // redraw verything that needs to be redrawn
	}

	self.removeOutputConnection = function (connection) {
		var index = mOutputConnections.indexOf(connection);
		if (index>=0) {
			mOutputConnections.splice(index,1);
			mGraphicNode.redrawConnections(); // redraw verything that needs to be redrawn
		}
	}

	// -----------------------------
	// Simulation
	// -----------------------------


	/**
	 * Checks if a node is a start node 
	 * That is, it receives no (required) input connection 
	 */
	self.isStartNode = function() {
		for (var i=0; i<mInputConnections.length; i++) {
			var conn = mInputConnections[i];
			if (conn.isRequiredToRunNode()) return false;
		}
		return true;
	}
	
	/**
	 * Checks if the node can be coded. That is, if it has correct
	 * input and required parameters
	 */
	self.canBeCoded = function() {
		var requiredProperties = self.getPropertiesWithAttribute('required');
		for (var i=0; i<requiredProperties.length; i++) {
			var property = requiredProperties[i];
			if (property.linked_by.length==0) { // Not linked
				if (property.value==null) {
					console.log("Property "+property.name+" of node "+mName+" is required and set to "+ property.value);
					return false;
				}
			}
		}
		return true;
	}

	/**
	 * Checks if a node can be run. 
	 * That is, if can be coded and all its input connections 
	 * *** TO REQUIRED properties ***  
	 * have already been traversed
	 */
	self.canBeRun = function() {
		if (!self.canBeCoded()) return false;
		for (var i=0; i<mInputConnections.length; i++) {
			var conn = mInputConnections[i];
			if (conn.isRequiredToRunNode() && 
					conn.getConnectionStatus()===GRAPH_CONSTANTS.CONNECTION_STATUS_NORMAL) return false;
		}
		return true;
	}
	
	// -----------------------------
	// Graphic visualization
	// -----------------------------

	self.getGraphicNode = function() { return mGraphicNode; }
	
	self.render = function() {
		mGraphicNode.updateStyle();
	}
	
	// -----------------------------
	// Final start-up
	// -----------------------------

	// Read all properties
	mGraph.getPropertiesNameList(mClassname).forEach (function(property_name) { 
		addProperty(property_name,null);
	});
	
	mGraphicNode = IODA_GRAPHICS.createGraphicNode(self);
	if (mPoint) mGraphicNode.setPosition(mPoint);
	
	return self;

}
