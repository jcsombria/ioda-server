/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 *
 * This code is Open Source and is provided "as is".
*/

var IODA_GRAPH = IODA_GRAPH || {};

/**
 * Creates a single Graph object on a given <div> specified by its ID
 * mID : a unique integer number that identifies the connection
 */
IODA_GRAPH.createConnection = function(mGraph,mID,mFromNode,mToNode) {
	var self = {};
	/** 
	 * In which zone of the toNode (final node) will the connection get in
	 * 1 : left, 2: top, 3: right, 4: bottom
	 */
	var mInputZone = 1; 
	// Whether the connection has been traversed when following a path
	var mTraversed = false;
	// The graphic element
	var mGraphicConnection;
		
	self.destroy = function() {
		mFromNode.removeOutputConnection(self);
		mToNode.removeInputConnection(self);
		mGraphicConnection.remove();
	}

	// -----------------------------
	// Basic setters and getters
	// -----------------------------

	self.getID = function() { return mID; }

	self.getFromNode = function() { return mFromNode; }

	self.getToNode = function() { return mToNode; }

	// -----------------------------
	// Input zone
	// -----------------------------

	self.getInputZone = function() { return mInputZone; }

	self.getOutputZone = function() { 
		switch(mInputZone) {
			case 1 : return 3;	
			case 2 : return 4;
			case 3 : return 1;
			case 4 : return 2;
		} 
		return 0;
	}

	self.verbose = function () {
		console.log ("Conn "+mID+" : iZ="+self.getInputZone()+", oZ="+self.getOutputZone())
	}
	
	/**
	 * Decides in which part of the toNode (final node) will the connection get in
	 * 	1 : left, 2: top, 3: right, 4: bottom
	 */
	self.updateInputZone = function() {
		var toPos   = mToNode.getGraphicNode().getPosition();
		var fromPos = mFromNode.getGraphicNode().getPosition();
		var dx = toPos[0]-fromPos[0], dy = toPos[1]-fromPos[1];
		if (Math.abs(dx)>=Math.abs(dy)) { // Horizontal connection
			if (dx>=0) mInputZone = 1;
			else mInputZone = 3;
		}
		else {
			if (dy>=0) mInputZone = 4;
			else mInputZone =  2; 
		}
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
	mGraphicConnection = mGraph.getPanel().createGraphicConnection(self);

	mFromNode.addOutputConnection(self);
	mToNode.addInputConnection(self);

	mGraph.getPanel().updateGraphicConnection(self);

	return self;
}; // end of createConnection

