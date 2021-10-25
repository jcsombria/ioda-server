/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 *
 * This code is Open Source and is provided "as is".
*/

var IODA_GRAPHICS = IODA_GRAPHICS || {};

/**
 * Graphic ejsS support for a graph node
 * mNode : a Graph node 
 */
IODA_GRAPHICS.createGraphicNode = function(mNode) {
	const GRAPH_CONS = IODA_GRAPH.Constants;
	const CONSTANTS = IODA_GRAPHICS.Constants;
	const mGraph = mNode.getGraph();
	const mView  = mGraph.getPanel().getView();
	const mDrawingPanel = mGraph.getPanel().getDrawingPanel();
	 
	var self = {};

	// ------------------------------
	// View elements
	// ------------------------------
	
	var mGroup = mView._addElement(EJSS_DRAWING2D.group,
		mGraph.getID()+"-node-group-"+mNode.getID(),
		mDrawingPanel);
	mGroup.setCustomObject(self);

	var mShadow = mView._addElement(EJSS_DRAWING2D.shape,
		mGraph.getID()+"-node-shadow-"+mNode.getID(),
		mGroup);
	mShadow.setProperties({
		"PixelSize" : true, 
		"Size":[CONSTANTS.NODE_SHADOW_SIZE,CONSTANTS.NODE_SHADOW_SIZE],
		"ShapeType" : "ROUND_RECTANGLE",
		"FillColor" : CONSTANTS.NODE_SHADOW_COLOR,
		"DrawLines" : false,
		"Visibility" : false 
	});

	var mImage;
	
	if (mGraph.getIcon(mNode.getClassname())==null) {
		console.log("Icon not found for this element!\n"+mNode.getClassname());
		mImage = mView._addElement(EJSS_DRAWING2D.shape,
			mGraph.getID()+"-node-image-"+mNode.getID(),
			mGroup);
		mImage.setProperties({ 
			"PixelSize" : true,
			"Size":[CONSTANTS.NODE_IMAGE_SIZE,CONSTANTS.NODE_IMAGE_SIZE],
			"ShapeType" : EJSS_DRAWING2D.Shape.ROUND_RECTANGLE
		});
	}
	else {
		mImage = mView._addElement(EJSS_DRAWING2D.image,
			mGraph.getID()+"-node-image-"+mNode.getID(),
			mGroup);
		mImage.setProperties({ 
			"PixelSize" : true,
			"Size":[CONSTANTS.NODE_IMAGE_SIZE,CONSTANTS.NODE_IMAGE_SIZE],
			"ImageUrl" : mGraph.getIcon(mNode.getClassname())
		});
	}

	var mText = mView._addElement(EJSS_DRAWING2D.text,
		mGraph.getID()+"-node_text-"+mNode.getID(),
		mGroup);
	mText.setProperties({ 
		"PixelPosition" : true, 
		"RelativePosition": "SOUTH",
		"FillColor": CONSTANTS.NODE_FONT_COLOR,
		"Position":[0,-CONSTANTS.NODE_IMAGE_SIZE+2],
		"FontSize" : CONSTANTS.NODE_FONT_SIZE,
		"Text" : mNode.getName()
	});

	/**
	 * Removes the graphics of this node
	 */
	self.removeGraphics = function(render) { 
		mDrawingPanel.removeElement(mGroup);
		mDrawingPanel.removeElement(mShadow);
		mDrawingPanel.removeElement(mImage);
		mDrawingPanel.removeElement(mText);
		if (render) mView._render();
	};
	
	// ------------------------------
	// Draw the graphic node
	// ------------------------------
	
	self.updateName = function() {
		mText.setText(mNode.getName());
		mView._render();
	}
	
	self.setPosition = function(point) {
		mGroup.setPosition(point);
	}
	
	self.getPosition = function() {
		return mGroup.getPosition();
	}
	
	self.getPixelPosition = function() {
		return mGroup.getPixelPosition();
	}
	
	self.getSizeX = function() {
		return mImage.getSizeX();
	}
	
	self.getSizeY = function() {
		return mImage.getSizeY();
	}

	self.updateStyle= function() {
		if (mGraph.getShowNodeLabels()) mText.setProperty("Visibility",true);
		else mText.setProperty("Visibility",false);
		
		var color = null;
		switch (mNode.getNodeStatus()) {
			case GRAPH_CONS.NODE_STATUS_SELECTED               : color = CONSTANTS.NODE_COLOR_SELECTED;         break;
			case GRAPH_CONS.NODE_STATUS_CAN_BE_CODED           : color = CONSTANTS.NODE_COLOR_CAN_BE_CODED;     break;
			case GRAPH_CONS.NODE_STATUS_CAN_NOT_BE_CODED       : color = CONSTANTS.NODE_COLOR_CAN_NOT_BE_CODED; break;
			case GRAPH_CONS.NODE_STATUS_READY_TO_RUN           : color = CONSTANTS.NODE_COLOR_READY_TO_RUN;     break;
			case GRAPH_CONS.NODE_STATUS_WAITING_FOR_CONNECTION : color = CONSTANTS.NODE_COLOR_WAITING_FOR_CONNECTION; break;
			case GRAPH_CONS.NODE_STATUS_RUN                    : color = CONSTANTS.NODE_COLOR_RUN;              break;
		}
		if (color==null) mShadow.setProperty("Visibility",false);
		else mShadow.setProperties({ "FillColor" : color,  "Visibility":true });
		mView._render();		
	}
	
	// ---------------------------------
	// Ordering and drawing connections 
	// ---------------------------------

	var mAllConnections = []; // Used only temporarily to sort and place lines

	function findZone(connection) {
		if (mNode==connection.getTargetNode()) return connection.getGraphicConnection().getInputZone();
		return connection.getGraphicConnection().getOutputZone();
	}
	
	function findOtherEndPosition(connection)  { 
		if (mNode==connection.getTargetNode()) 
			return connection.getSourceNode().getGraphicNode().getPixelPosition();
		else
			return connection.getTargetNode().getGraphicNode().getPixelPosition(); 
	}

	/**
	 * Used to order connections  graphically
	 * conn1 and conn2 are output connections of the same node
	 */
	function compareConnections(conn1,conn2) {
		var zone1 = findZone(conn1), zone2 = findZone(conn2);
		if (zone1!=zone2) return zone2-zone1;
		var pos1 = findOtherEndPosition(conn1), pos2 = findOtherEndPosition(conn2);
		switch (zone1) {
			default: 
			case 1 : return pos2[1]-pos1[1]; 
			case 3 : return pos1[1]-pos2[1]; 
			case 2 : return pos1[0]-pos2[0]; 
			case 4 : return pos2[0]-pos1[0];  
		}
	}
	
	/**
	 Redraws all connections to and from this node
	 */
	self.redrawConnections = function() {
		mAllConnections = mNode.getAllConnections();
		mAllConnections.forEach (function(connection) { 
			connection.getGraphicConnection().updateInputZone(); 
		});
		mAllConnections.sort(compareConnections);
		mAllConnections.forEach (function(connection) { 
			connection.getGraphicConnection().updatePosition(); 
		});
	}

	/**
	 Redraws all connections of this node
	 and of all nodes connected to this one
	 */
	self.redrawAllConnectionsAffected = function() {
		self.redrawConnections();
		mNode.getInputConnections().forEach (function(inputConnection) { 
			inputConnection.getSourceNode().getGraphicNode().redrawConnections();
		});
		mNode.getOutputConnections().forEach (function(outputConnection) { 
			outputConnection.getTargetNode().getGraphicNode().redrawConnections();
		});
	};
	
	/**
	 Finds the relative position of a given connection,
	 respective to the other connections (in the same zone)
	 */
	self.getConnectionRelativePosition = function(connection) {
		var zone = (connection.getTargetNode()==mNode) ? 
			connection.getGraphicConnection().getInputZone() : 
			connection.getGraphicConnection().getOutputZone();
		var sublist=[];
		if (mAllConnections.filter) {
			sublist = mAllConnections.filter(conn => 
				((conn.getTargetNode()==mNode) ? 
					conn.getGraphicConnection().getInputZone() : 
					conn.getGraphicConnection().getOutputZone())==zone);
		}
		else {
			//console.log("do_node warning: Browser does not support Array.filter!");
			for (var i=0; i<mAllConnections.length; i++) {
				var conn = mAllConnections[i];
				if (((conn.getTargetNode()==mNode) ? 
					conn.getGraphicConnection().getInputZone() : 
					conn.getGraphicConnection().getOutputZone())==zone) sublist.push(conn);
			}
		} 
		var nConn = sublist.length;
		var index = sublist.indexOf(connection);
		// if (isInput) index = nConn-1-index;
		var delta = 1.0/2;
		if (zone==1 || zone==2) {
			var first = (nConn % 2 === 0) ? -(0.5-nConn/2) * delta : (nConn-1)/2 * delta;
			// if (self.getID()==4) console.log("Conn "+connection.getID()+" is # "+index+"/"+nConn+" of zone "+zone+ " of node "+self.getID()+" = "+(first + index*delta));
			return first - index*delta;
		}
		var first = (nConn % 2 === 0) ? (0.5-nConn/2) * delta : -(nConn-1)/2 * delta;
		// if (self.getID()==4) console.log("Conn "+connection.getID()+" is # "+index+"/"+nConn+" of zone "+zone+ " of node "+self.getID()+" = "+(first + index*delta));
		return first + index*delta;
	}

	// -----------------------------
	// Final start-up
	// -----------------------------

	mView._render();
	return self;

};
