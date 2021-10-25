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
IODA_GRAPH.createPanel = function(mGraph) {
	const sIMAGE_SIZE = 32;
	const sSHADOW_SIZE = 64;
	const sCOLOR_SHADOW = "rgba(255,215,0,0.5)"; //"rgba(255,255,255,0.5)";
	const sCOLOR_SHADOW_SMALL = "rgba(150,150,150,0.5)";
	const sCOLOR_SHADOW_BIG = "LightGrey";
	const sCOLOR_SHADOW_SELECTED = "White";
	const sCOLOR_SHADOW_CONNECTING = "rgb(128,192,255)";
	const sCOLOR_SHADOW_NO_CONNECTION = "Red";
	const sCOLOR_PATH = "rgba(150,215,150,0.5)";
	const sCOLOR_CYCLE = "rgba(255,0,0,0.5)";
	const sLINE_COLOR = "Blue";
	const sLINE_START_COLOR = "White";
	const sLINE_HOVER_COLOR = "Orange";
	const sLINE_PATH = "Green";
	const sLINE_CYCLE = "Red";
	const sLINE_TEST_CONNECTION = "Black";

	var self = {};

	var mID = mGraph.getID();
	var mView = mGraph.getTopLevel() ?  EJSS_CORE.createView(mGraph.getTopLevel()) : EJSS_CORE.createView(mID);
	var mDrawingPanel= mView._addElement(EJSS_DRAWING2D.drawingPanel, mID+"-panel",mView._getTopLevelElement());

	// ------------------------------
	// Configure the drawing panel
	// ------------------------------
	
	mDrawingPanel.setProperties({
		"ClassName" : "analysis-panel",
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
	
	mDrawingPanel.getGraphics().getDOMElement().ondragover = function(evt) {
		evt.preventDefault();
	};
	
	mDrawingPanel.getGraphics().getDOMElement().ondrop = function(evt) {
		evt.preventDefault();
		var classname = evt.dataTransfer.getData("text");
		var rect = mDrawingPanel.getGraphics().getDOMElement().getBoundingClientRect();
		var point = mDrawingPanel.toPanelPosition([evt.clientX-rect.left,evt.clientY-rect.top]);
		var node = mGraph.addNode(classname,point);
		showPropertyEditorFor(node.getGraphicNode());
	};

	self.createNode = function(classname) {
		var node = mGraph.addNode(classname,[-0.9,0.9]);
		showPropertyEditorFor(node.getGraphicNode());
	};
	
	function showPropertyEditorFor(group) {
		self.clearPath();
		mGroupAtPropertyEditor = group;
		mGraph.showProperties(group ? group.node : null);
		if (group) {
			group.shadow.setProperties({ "FillColor" : sCOLOR_SHADOW, "Visibility":true});
		}
		mView._render();
	};

	// ------------------------------
	// Selection shadows and line for making the connections
	// ------------------------------
	
	var mShadowTarget = mView._addElement(EJSS_DRAWING2D.shape,mID+"-shadow-target",mDrawingPanel);
	mShadowTarget.setProperties({
		"Size":[sIMAGE_SIZE,sIMAGE_SIZE],
		"PixelSize" : true,
		"DrawLines" : false,
		"Visibility" : false
	});
	
	var mShadowBig = mView._addElement(EJSS_DRAWING2D.shape,mID+"-shadow-big",mDrawingPanel);
	mShadowBig.setProperties({
		"Size":[sIMAGE_SIZE,sIMAGE_SIZE],
		"PixelSize" : true,
		"DrawLines" : false,
		"Visibility" : false
	});
	
	var mShadowSmall = mView._addElement(EJSS_DRAWING2D.shape,mID+"-shadow-small",mDrawingPanel);
	mShadowSmall.setProperties({
		"Size":[sIMAGE_SIZE,sIMAGE_SIZE],
		"PixelSize" : true,
		"DrawLines" : false,
		"Visibility" : false
	});
	
	var mConnectionLine = mView._addElement(EJSS_DRAWING2D.arrow,mID+"-connection",mDrawingPanel);
	mConnectionLine.setProperties({
		"LineColor" : sLINE_TEST_CONNECTION,
		"LineWidth" : 2,
		"MarkEnd" : EJSS_DRAWING2D.Arrow.NONE,
		"Visibility" : false,
		"SplineType" : EJSS_DRAWING2D.Arrow.SPLINE_CUBIC,
		"Attributes" : { "stroke-dasharray" : "5" } //"5, 5, 1, 5" }
	});
	
	// ------------------------------
	// Resize and panel interaction
	// ------------------------------

	// Interaction variables
	var mMoving = false;
	var mGroupSelected = null;
	var mGroupAtPropertyEditor = null;

	// Used by Graph when removing a node
	self.unselectGraphics = function(group) {
		if (group===mGroupSelected) {
			mGroupSelected = null;
			mMoving = false;
		}
		if (group===mGroupAtPropertyEditor) mGroupAtPropertyEditor = null;
	}

	// Called by Tabs when a page is displayed
	self.activated = function() {
		if (mGroupAtPropertyEditor) mGraph.showProperties(mGroupAtPropertyEditor.node);
		else mGraph.showProperties(null);
	};

	// Called when the browser is resized
	self.resized = function(width,height) {
		var graphics = mDrawingPanel.getGraphics();
		if (width==graphics.getWidth() && height==graphics.getHeight() ) {
			return; // Ignore for performance
		}
		mDrawingPanel.setProperties({ "Width" : width, "Height" : height});
		// redraw all connections
		mGraph.getConnections().forEach (function(connection) {
			positionConnection(connection);
		}); 
		mView._render();
	};

	function movedOnPanel(point) {
	  var searchInfo = findGroupAt(point);
	  if (searchInfo) {
	    placeShadow(mShadowSmall,searchInfo.group,sCOLOR_SHADOW_SMALL);
	    if (searchInfo.close) hideElements(mShadowBig);
	    else placeShadow(mShadowBig,searchInfo.group,sCOLOR_SHADOW_BIG);
	  }
	  else hideElements(mShadowSmall,mShadowBig);
	  mView._render();
	};
	
	function pressedOnPanel(point) {
	  var searchInfo = findGroupAt(point);
	  if (searchInfo) {
	    mMoving = searchInfo.close;
	    mGroupSelected = searchInfo.group;
	    showPropertyEditorFor(searchInfo.group);
	    if (mMoving) {
	      placeShadow(mShadowSmall,searchInfo.group,sCOLOR_SHADOW_SELECTED);
	      hideElements(mShadowBig);
	    }
	    else placeShadow(mShadowBig,searchInfo.group,sCOLOR_SHADOW_CONNECTING);
	  }
	  else {
	    mGroupSelected = null;
	    hideElements(mShadowSmall,mShadowBig);
	    showPropertyEditorFor(null);
	  }
	  mView._render();
	};
	
	function draggedOnPanel(point) {
	  if (!mGroupSelected) return;
	  if (mMoving) {
	    mGroupSelected.setProperty("Position", point);
	    mShadowSmall.setProperty("Position", point);
	    mGroupSelected.node.updateConnectionGraphics();
	  }
	  else {
	    placeConnection(mGroupSelected.getPosition(),point);
	    var searchInfo = findGroupAt(point);
	    if (searchInfo) {
	      if (mGraph.canConnect(mGroupSelected.node,searchInfo.group.node))
	        placeShadow(mShadowTarget,searchInfo.group,sCOLOR_SHADOW_CONNECTING);
	      else
	        placeShadow(mShadowTarget,searchInfo.group,sCOLOR_SHADOW_NO_CONNECTION);
	    }
	    else hideElements(mShadowTarget);
	  }
	  mView._render();
	};
	
	function releasedOnPanel(rectangle) {
	  //console.log ("Released on "+rectangle[1]+","+rectangle[3]);
	  var point = [rectangle[1], rectangle[3]];
	  if (mGroupSelected && !mMoving) { // i.e. connecting
	    var searchInfo = findGroupAt(point);
	    if (searchInfo) {
	      if (mGraph.canConnect(mGroupSelected.node,searchInfo.group.node)) {
	        mGraph.addConnection(mGroupSelected.node,searchInfo.group.node);
	        showPropertyEditorFor(searchInfo.group.node.getGraphicNode());
	      }
	    }
	  }
	  hideElements(mShadowTarget,mConnectionLine);
	  movedOnPanel(point);
	};
	
	function doubleClickOnPanel(point) {
	  var searchInfo = findGroupAt(point);
	  if (searchInfo) {
	    mGraph.showPathToNode(searchInfo.group.node,true);
	  }
	  else self.clearPath();
	};
	
	
	function findGroupAt(point) {
	  point = mDrawingPanel.toPixelPosition(point);
	  var distBig   = sIMAGE_SIZE;
	  var distSmall = sIMAGE_SIZE/2;
	  var graphicNodes = getNodesGraphics();
	  for (var i=0; i<graphicNodes.length; i++) {
	    var element = graphicNodes[i];
	    var pos = element.getPixelPosition();
	    var dx = Math.abs(pos[0]-point[0]), dy = Math.abs(pos[1]-point[1]);
	    if (dx<distBig && dy<distBig) {
	      return { group: element, close: (dx<distSmall && dy<distSmall)} ;
	    }
	  }
	  return null;
	};
	
	// -----------------------------
	// Nodes
	// -----------------------------

	self.createGraphicNode = function(node, point) {
		var icon = mGraph.getIcon(node.getClassname());
		if (icon==null) {
			alert("Icon not found for this element!\n"+node.getClassname());
			return null;
		}
		var group = mView._addElement(EJSS_DRAWING2D.group,mID+"-node_group-"+node.getID(),mDrawingPanel);
		group.setProperties({ "Position":point });
	
		group.shadow = mView._addElement(EJSS_DRAWING2D.shape,mID+"-node_shadow-"+node.getID(),group);
		group.shadow.setProperties({ 
			"PixelSize" : true, 
			"Size":[sSHADOW_SIZE,sSHADOW_SIZE],
			"ShapeType" : "ROUND_RECTANGLE",
			"FillColor" : sCOLOR_SHADOW,
			"DrawLines" : false,
			"Visibility" : false 
		});
	
		group.image = mView._addElement(EJSS_DRAWING2D.image,mID+"-node-"+node.getID(),group);
		group.image.setProperties({ 
			"PixelSize" : true,
			"Size":[sIMAGE_SIZE,sIMAGE_SIZE],
			"ImageUrl" : icon
		});
	
		group.text = mView._addElement(EJSS_DRAWING2D.text,mID+"-node_text-"+node.getID(),group);
		group.text.setProperties({ 
			"PixelPosition" : true, 
			"RelativePosition": "SOUTH",
			"Position":[0,-sIMAGE_SIZE+2],
			"FontSize" : 12,
			"Text" : node.getName()
		});
	
		group.node = node;
		movedOnPanel(point);
		return group;
	};
	
	self.updateNodeName = function(node) {
		node.getGraphicNode().text.setProperty("Text", node.getName());
		mView._render();
	};

	// -----------------------------
	// Connections
	// -----------------------------
	
	self.createGraphicConnection = function(mConnection) {
		var graphicConnection = {};
	
		var mMainElement = mView._addElement(EJSS_DRAWING2D.arrow,mID+"-conn-"+mConnection.getID(),mDrawingPanel);
		mMainElement.setProperties({
			"SplineType": EJSS_DRAWING2D.Arrow.SPLINE_CUBIC,
			"LineColor" : sLINE_COLOR, 
			"LineWidth" : 2,
			"MarkMiddle" : EJSS_DRAWING2D.Arrow.RECTANGLE, 
			"MarkMiddleDiameter" : sIMAGE_SIZE/6,
			"EnabledPosition" : EJSS_DRAWING2D.InteractionTarget.ENABLED_NO_MOVE,
			"OnEnter" : connectionEnter, 
			"OnExit" : connectionExit, 
			"OnDoubleClick" : connectionDoubleClick
		});
		mMainElement.setProperty("SplineType", EJSS_DRAWING2D.Arrow.SPLINE_CUBIC);
		mMainElement.setCustomObject(graphicConnection);
	
		var mElementStart = mView._addElement(EJSS_DRAWING2D.arrow,mID+"-conn-start-"+mConnection.getID(),mDrawingPanel);
		mElementStart.setProperties({
			"SplineType": EJSS_DRAWING2D.Arrow.SPLINE_START,
			"LineColor" : sLINE_START_COLOR, 
			"LineWidth" : 2,
			"MarkEnd" : EJSS_DRAWING2D.Arrow.NONE, 
			"EnabledPosition" : EJSS_DRAWING2D.InteractionTarget.ENABLED_NONE,
			"Attributes" : { "stroke-dasharray":"5", "stroke-dashoffset" : "-5" }
		});
		//mElementStart.getStyle().setAttributes({ "stroke-dasharray":"5", "stroke-dashoffset" : "-5" });
	
		//const TO_DEGREES = 180.0/Math.PI;
	
		graphicConnection.setHorizontal = function () {
			mMainElement.setProperty ("SplineType", EJSS_DRAWING2D.Arrow.SPLINE_CUBIC_HORIZONTAL);
			mElementStart.setProperty("SplineType", EJSS_DRAWING2D.Arrow.SPLINE_START_HORIZONTAL);
		}
		
		graphicConnection.setVertical = function () {
			mMainElement.setProperty ("SplineType", EJSS_DRAWING2D.Arrow.SPLINE_CUBIC_VERTICAL);
			mElementStart.setProperty("SplineType", EJSS_DRAWING2D.Arrow.SPLINE_START_VERTICAL);
		}
	
		graphicConnection.position = function (fromPoint, toPoint) {
			var size = [toPoint[0]-fromPoint[0],toPoint[1]-fromPoint[1]];
			mMainElement.setProperties({ "Position": fromPoint, "Size": size });
			mElementStart.setProperties({ "Position": fromPoint, "Size": size });
		}
	
		graphicConnection.remove = function() { 
	  	self.removeGraphics(mMainElement);
	  	self.removeGraphics(mElementStart);
		}
		
		graphicConnection.decorate = function (color, width) {
			mMainElement.setProperty("LineColor",color);
			mMainElement.setProperty("LineWidth",width);
			if (color==sLINE_COLOR) 
				color = sLINE_START_COLOR;
			//mElementStart.setProperty("LineColor",color);
			mElementStart.setProperty("LineWidth",width);
			mView._render();
		}
		graphicConnection.getConnection = function () {
			return mConnection;
		}
		
		return graphicConnection;
	};
	
	self.updateGraphicConnection = function (connection) {
		positionConnection(connection);
	}
	
	function positionConnection(connection) {
		var radius = sIMAGE_SIZE/2 + 1;
		var sep = mDrawingPanel.toPanelMod([radius,radius]);
		var fromPoint = connection.getFromNode().getGraphicNode().getPosition();
		var toPoint   = connection.getToNode().getGraphicNode().getPosition();
	
		var inRelPos  = connection.getToNode().getConnectionRelativePosition(connection);
		var outRelPos = connection.getFromNode().getConnectionRelativePosition(connection);
	
		var dx = toPoint[0]-fromPoint[0];
		var dy = toPoint[1]-fromPoint[1];
		if (Math.abs(dx)>=Math.abs(dy)) { // Horizontal connection
			connection.getGraphicConnection().setHorizontal();
			var inDisplY  = mDrawingPanel.toPanelMod([0,inRelPos*sIMAGE_SIZE/2])[1];
			var outDisplY = mDrawingPanel.toPanelMod([0,outRelPos*sIMAGE_SIZE/2])[1];
			if (dx>=0) { fromPoint[0] += sep[0];    toPoint[0] -= sep[0]; }
			else       { fromPoint[0] -= sep[0];    toPoint[0] += sep[0]; }
			fromPoint[1] += outDisplY; 
			toPoint[1] += inDisplY;
		}
		else { // Verticalconnection
			connection.getGraphicConnection().setVertical();
			var inDisplX  = mDrawingPanel.toPanelMod([inRelPos*sIMAGE_SIZE/2,0])[0];
			var outDisplX = mDrawingPanel.toPanelMod([outRelPos*sIMAGE_SIZE/2,0])[0];
			fromPoint[0] += outDisplX; 
			toPoint[0]   += inDisplX;
			if (dy>=0) { fromPoint[1] -= sep[1];    toPoint[1] += sep[1]; }
			else       { fromPoint[1] += sep[1];    toPoint[1] -= sep[1]; }
		}

//      if (connection.getToNode().getName()=="Node-2")
//        console.log ("Relative pos of conn "+ connection.getFromNode().getName()+" - "+
//            connection.getToNode().getName()+"=  "+relPos+" = "+displY);
/*
      var dif = toPoint[0]-fromPoint[0];
      if (dif>2*sep[0]) { fromPoint[0] += sep[0]; toPoint[0] -= sep[0]; }
      else if (dif<-2*sep[0]) { fromPoint[0] -= sep[0]; toPoint[0] += sep[0]; }
      else { // align vertically
       if (fromPoint[1]<=toPoint[1]) { fromPoint[1] -= sep[1]; toPoint[1] += sep[1]; }
       else { fromPoint[1] += sep[1]; toPoint[1] -= sep[1]; }
      }
*/
		connection.getGraphicConnection().position(fromPoint,toPoint);
		mView._render();
	};

	var mConnectionCurrentColor = sLINE_COLOR;
	
	function connectionEnter(info) {
		mConnectionCurrentColor = info.element.getProperty("LineColor");
		var graphicConnection = info.element.getCustomObject();
		graphicConnection.decorate(sLINE_HOVER_COLOR,4);
		//graphicConnection.getConnection().verbose();
	};
	
	function connectionExit(info) {
		var graphicConnection = info.element.getCustomObject();
		graphicConnection.decorate(mConnectionCurrentColor,2);
	};
	
	function connectionDoubleClick(info) {
		//alert ("Renove Connection : "+info.element.getCustomObject().getConnection());
		mGraph.removeConnection(info.element.getCustomObject().getConnection());
		mConnectionCurrentColor = sLINE_COLOR;
	};
	
	function colorConnections(connections,color) {
		if (connections==null) connections = mGraph.getConnections();
		connections.forEach(function(conn) {
			conn.getGraphicConnection().decorate(color,2);
		});
//		for (var i=0; i<connections.length; i++) {
//			connections[i].getGraphicConnection().decorate(color,2);
//		}
	};

	// -----------------------------
	// Paths
	// -----------------------------
	
	self.showPath = function(nodePath, isCycle) {
	  var lineColor =  isCycle ? sLINE_CYCLE : sLINE_PATH;
	  for (var i=0; i<nodePath.length; i++) {
	    var node = nodePath[i];
	    var nodeColor;
	    if (isCycle) nodeColor = sCOLOR_CYCLE;
	    else nodeColor = node.canBeCoded(true) ?  sCOLOR_PATH : sCOLOR_CYCLE;
	    node.getGraphicNode().shadow.setProperties({ "Visibility":true, "FillColor" : nodeColor });
	    colorConnections(node.getInputConnections(),lineColor);
	  }
	  mView._render();
	};
	
	self.clearPath = function() {
	  var graphicNodes = getNodesGraphics();
	  for (var i=0; i<graphicNodes.length; i++) {
	    graphicNodes[i].shadow.setProperty("Visibility",false);
	  }
	  colorConnections(null,sLINE_COLOR);
	  mGraph.showProperties(null);
	  mView._render();
	}
	
	// -----------------------------
	// Utils
	// -----------------------------
	
	// Used by Graph when removing a Node or Connection
	self.removeGraphics = function (element) {
	  mDrawingPanel.removeElement(element);
	  if (element.image) mDrawingPanel.removeElement(element.image);
	  if (element.shadow) mDrawingPanel.removeElement(element.shadow);
	  if (element.text) mDrawingPanel.removeElement(element.text);
	  mView._render();
	};
	
	function getNodesGraphics() {
	  var groups = [];
	  var elements = mDrawingPanel.getElements();
	  for (var i=0; i<elements.length; i++) if (elements[i].isGroup()) groups.push(elements[i]);
	  return groups;
	}
	
	function hideElements() {
	  for (var i = 0; i < arguments.length; i++) arguments[i].setProperty("Visibility",false);
	};
	
	function placeShadow(shadowElement,group,color) {
	  var factor = shadowElement==mShadowSmall ?  1.5 : 2;
	  shadowElement.setProperties({ "Visibility" : true, "FillColor" : color,
	    "Position": group.getPosition(),
	    "Size" : [group.image.getSizeX()*factor, group.image.getSizeY()*factor] });
	};
	
	function placeConnection(fromPoint, toPoint) {
	  mConnectionLine.setProperties({ "Visibility" : true, "Position" : fromPoint,
	   "Size" : [toPoint[0]-fromPoint[0],toPoint[1]-fromPoint[1]] });
	}
	
	// -----------------------------
	// Final initialization
	// -----------------------------
	
	mView._render();
	return self;

};
