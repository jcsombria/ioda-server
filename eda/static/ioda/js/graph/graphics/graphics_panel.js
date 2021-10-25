/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 *
 * This code is Open Source and is provided "as is".
*/

var IODA_GRAPHICS = IODA_GRAPHICS || {};

/**
 * Graphic ejsS support for a graph panel
 * mGraph : the Graph to draw 
 */
IODA_GRAPHICS.createPanel = function(mGraph) {
	const CONSTANTS = IODA_GRAPHICS.Constants;
	const mID = mGraph.getID();

	var self = {};
	
	// --------------------------------------
	// Create the view and the drawing panel
	// --------------------------------------

	var mView = mGraph.getTopLevel() ?  EJSS_CORE.createView(mGraph.getTopLevel()) : EJSS_CORE.createView(mID);
	
	var mDrawingPanel= mView._addElement(EJSS_DRAWING2D.drawingPanel, 
		// Give it a unique name as view element (although we do not use names)
		mID+"-panel", mView._getTopLevelElement());

	mDrawingPanel.setProperties({
		"ClassName" : "ioda-panel",
		"Width":"100%",
		"Height":"100%",
		//"Title" : mID,
		"DrawLines":false,
		"SquareAspect":false,
		"ShowAreaRectangle":false,
		"Enabled":true, 
		"OnMove" : movedOnPanel,
		"OnPress" : pressedOnPanel,
		"OnDrag" : draggedOnPanel,
		"OnRelease" : releasedOnPanel,
		"OnDoubleClick" : doubleClickOnPanel,
		"Bounds":[-1.0,1.0,-1.0,1.0]
	});

	self.getView = function() { return mView; };

	self.getDrawingPanel = function() { return mDrawingPanel; }

	// --- Drag and drop

	mDrawingPanel.getGraphics().getDOMElement().ondragover = function(evt) {
		evt.preventDefault();
	};

	mDrawingPanel.getGraphics().getDOMElement().ondrop = function(evt) {
		evt.preventDefault();
		var classname = evt.dataTransfer.getData("text");
		var rect = mDrawingPanel.getGraphics().getDOMElement().getBoundingClientRect();
		var point = mDrawingPanel.toPanelPosition([evt.clientX-rect.left,evt.clientY-rect.top]);
		mGraph.addNode(classname, null, point); // null -> no given node id
	};

	// --- Called when the browser is resized
	self.resized = function(width,height) {
		var graphics = mDrawingPanel.getGraphics();
		console.log("Panel = "+graphics.getWidth()+" x "+graphics.getHeight());
		console.log("Resize to  = "+width+" x "+height);
		if (width==graphics.getWidth() && height==graphics.getHeight() ) return; // Ignore for performance
		console.log("Resizing it to  = "+width+" x "+height);
		mDrawingPanel.setProperties({ "Width" : width, "Height" : height});
		// redraw all connections
		mGraph.getConnections().forEach (function(connection) {
			connection.getGraphicConnection().updatePosition();
		}); 
		mView._render();
	}

	self.render = function() {
//		var graphics = mDrawingPanel.getGraphics();
//		console.log("Rendering at size:"+graphics.getWidth()+","+graphics.getHeight());
		setTimeout(function() { mView._render(); }, 500);
		mView._render();
	}
	
	// ------------------------------
	// Shadow effects
	// ------------------------------

	var mHighlightBigShadow = mView._addElement(EJSS_DRAWING2D.shape,
		mID+"-shadow-big",
		mDrawingPanel);
	mHighlightBigShadow.setProperties({
		"Size":[CONSTANTS.NODE_IMAGE_SIZE,CONSTANTS.NODE_IMAGE_SIZE],
		"PixelSize" : true,
		"DrawLines" : false,
		"Visibility" : false
	});
	
	var mHighlightSmallShadow = mView._addElement(EJSS_DRAWING2D.shape,
		mID+"-shadow-small",
		mDrawingPanel);
	mHighlightSmallShadow.setProperties({
		"Size":[CONSTANTS.NODE_IMAGE_SIZE,CONSTANTS.NODE_IMAGE_SIZE],
		"PixelSize" : true,
		"DrawLines" : false,
		"Visibility" : false
	});

	function hideElements() {
		for (var i = 0; i<arguments.length; i++) 
			arguments[i].setProperty("Visibility",false);
	}

	function placeShadow(shadowElement,graphicNode,color) {
		var factor = (shadowElement==mHighlightSmallShadow) ?  1.5 : 2;
		shadowElement.setProperties({
			"Visibility" : true,
			"FillColor" : color,
			"Position": graphicNode.getPosition(),
			"Size" : [graphicNode.getSizeX()*factor, graphicNode.getSizeY()*factor]
		});
	}

	// Hover on an node
	function hoverNode(node,isClose) {
		if (node) {
			var graphicNode = node.getGraphicNode();
			placeShadow(mHighlightSmallShadow,graphicNode,CONSTANTS.NODE_SHADOW_SMALL_COLOR);
			if (isClose) hideElements(mHighlightBigShadow);
			else placeShadow(mHighlightBigShadow,graphicNode,CONSTANTS.NODE_SHADOW_BIG_COLOR);
		}
		else hideElements(mHighlightSmallShadow,mHighlightBigShadow);
		mView._render();
	}
	
	// ------------------------------
	// Testing connections
	// ------------------------------
	
	var mConnectionShadow = mView._addElement(EJSS_DRAWING2D.shape,
		mID+"-shadow-target",
		mDrawingPanel);
	mConnectionShadow.setProperties({
		"Size":[CONSTANTS.NODE_IMAGE_SIZE,CONSTANTS.NODE_IMAGE_SIZE],
		"PixelSize" : true,
		"DrawLines" : false,
		"Visibility" : false
	});
	
	var mConnectionLine = mView._addElement(
		EJSS_DRAWING2D.arrow,
		mID+"-test_connection",
		mDrawingPanel);
	mConnectionLine.setProperties({
		"LineColor" : CONSTANTS.CONNECTION_TEST_CONNECTION_COLOR,
		"LineWidth" : CONSTANTS.CONNECTION_NORMAL_WIDTH,
		"MarkEnd" : EJSS_DRAWING2D.Arrow.NONE,
		"Visibility" : false,
		"SplineType" : EJSS_DRAWING2D.Arrow.SPLINE_CUBIC,
		"Attributes" : { "stroke-dasharray" : "5" }
	});

	function positionConnection(fromPoint, toPoint) {
		mConnectionLine.setProperties({ 
			"Visibility" : true, 
			"Position" : fromPoint,
			"Size" : [toPoint[0]-fromPoint[0],toPoint[1]-fromPoint[1]]
		});
	}
	
	// Test connection to point
	function testConnection(point) {
		positionConnection(mNodeSelected.getGraphicNode().getPosition(),point);
		var searchInfo = findNodeAt(point);
		if (searchInfo) {
			var graphicNode = searchInfo.node.getGraphicNode();
			if (mGraph.canConnect(mNodeSelected,searchInfo.node))
				placeShadow(mConnectionShadow,graphicNode,CONSTANTS.NODE_SHADOW_CONNECTING_COLOR);
			else
				placeShadow(mConnectionShadow,graphicNode,CONSTANTS.NODE_SHADOW_NO_CONNECTION_COLOR);
		}
		else hideElements(mConnectionShadow);
		mView._render();		
	}

	// ------------------------------
	// Panel interaction
	// ------------------------------

	// Interaction variables
	var mMoving = false;
	var mNodeSelected = null;

	const BIG_DISTANCE   = CONSTANTS.NODE_IMAGE_SIZE;
	const SMALL_DISTANCE = CONSTANTS.NODE_IMAGE_SIZE/2;
	
	function findNodeAt(point) {
		point = mDrawingPanel.toPixelPosition(point);
		var allNodes = mGraph.getNodes();
		for (var i=0; i<allNodes.length; i++) {
			var node = allNodes[i];
			var pos = node.getGraphicNode().getPixelPosition();
			var dx = Math.abs(pos[0]-point[0]);
			var dy = Math.abs(pos[1]-point[1]);
			if (dx<BIG_DISTANCE && dy<BIG_DISTANCE) {
				return { node: node, is_close: (dx<SMALL_DISTANCE && dy<SMALL_DISTANCE)} ;
			}
		}
		return null;
	}
	
	function movedOnPanel(point) {
		var searchInfo = findNodeAt(point);
		if (searchInfo) {
			hoverNode(searchInfo.node,searchInfo.is_close);
		}
		else hoverNode(null);
	}
	
	function pressedOnPanel(point) {
		var searchInfo = findNodeAt(point);
		if (searchInfo) {
			self.setNodePressed(searchInfo.node);
			mMoving = searchInfo.is_close;
			var graphicNode = searchInfo.node.getGraphicNode();
			if (mMoving) {
				placeShadow(mHighlightSmallShadow,graphicNode,CONSTANTS.NODE_SHADOW_SELECTED_COLOR);
				hideElements(mHighlightBigShadow);
			}
			else placeShadow(mHighlightBigShadow,graphicNode,CONSTANTS.NODE_SHADOW_CONNECTING_COLOR);
		}
		else {
			self.setNodePressed(null);
			hideElements(mHighlightSmallShadow,mHighlightBigShadow);
		}
		mView._render();
	}
	
	function draggedOnPanel(point) {
		if (!mNodeSelected) return;
		if (mMoving) {
			mHighlightSmallShadow.setPosition(point);
			mNodeSelected.getGraphicNode().setPosition(point);
			mNodeSelected.getGraphicNode().redrawAllConnectionsAffected();
			mView._render();
		}
		else if (mGraph.canCreateConnections()) testConnection(point);
	}

	function releasedOnPanel(rectangle) {
		//console.log ("Released on "+rectangle);
		mMoving = false;
		var point = [rectangle[1], rectangle[3]];
		if (mNodeSelected && !mMoving) { // i.e. connecting
			if (!mGraph.canCreateConnections()) return;
			var searchInfo = findNodeAt(point);
			if (searchInfo) {
				if (mGraph.canConnect(mNodeSelected,searchInfo.node)) {
					var connection = mGraph.addConnection(mNodeSelected,searchInfo.node);
					mGraph.connectionSelected(connection);
				}
			}
			hideElements(mConnectionShadow,mConnectionLine);
		}
		else {
			movedOnPanel(point);
		}
		mView._render();		
	}

	function doubleClickOnPanel(point) {
		var searchInfo = findNodeAt(point);
		if (searchInfo) nodeAction(searchInfo.node);
		else nodeAction(null);
	}

	// -----------------------------
	// Nodes
	// -----------------------------

	// A graphic node was pressed
	self.setNodePressed = function(node) {
		mGraph.nodeUnselect(mNodeSelected);
		mNodeSelected = node;
		mGraph.nodeAction(null);
		mGraph.nodeSelected(node);
		mView._render();
	}

	function nodeAction(node) {
		mGraph.nodeUnselect(mNodeSelected);
		mNodeSelected = node;
		mGraph.nodeSelected(null);
		mGraph.nodeAction(node);
		mView._render();
	}

	// -----------------------------
	// TODO Paths
	// -----------------------------

	// -----------------------------
	// Final initialization
	// -----------------------------
	
	mView._render();
	return self;

};
