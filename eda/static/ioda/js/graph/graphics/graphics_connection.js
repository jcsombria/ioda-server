/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 *
 * This code is Open Source and is provided "as is".
*/

var IODA_GRAPHICS = IODA_GRAPHICS || {};

/**
 * Graphic ejsS support for a graph connection
 * mConection : a Graph Connection 
 */
IODA_GRAPHICS.createGraphicConnection = function(mConnection) {
	const GRAPH_CONS = IODA_GRAPH.Constants;
	const CONSTANTS = IODA_GRAPHICS.Constants;
	const mGraph = mConnection.getGraph();
	const mView  = mGraph.getPanel().getView();
	const mDrawingPanel = mGraph.getPanel().getDrawingPanel();
	 
	var self = {};
	
	// ------------------------------
	// Interaction
	// ------------------------------

	function connectionEnter() {
		const width = CONSTANTS.CONNECTION_HIGHLIGHT_WIDTH;
		mFullArrow.setProperties({ "LineColor":CONSTANTS.CONNECTION_HOVER_COLOR, "LineWidth":width });
		mHalfArrow.setProperties({ "LineColor":CONSTANTS.CONNECTION_HOVER_COLOR, "LineWidth":width });
		mView._render();
	}
	
	function connectionExit() {
		self.updateStyle();
	}
	
	function connectionRelease() {
		mGraph.connectionSelected(mConnection);
	}

	function connectionDoubleClick() {
		mGraph.connectionAction(mConnection);
	}

	// ------------------------------
	// View elements
	// ------------------------------

	var mFullArrow = mView._addElement(EJSS_DRAWING2D.arrow,
		// Give it a unique name as view element (although we do not use names)
		mGraph.getID()+"-conn-"+mConnection.getID(), 
		mDrawingPanel);
	mFullArrow.setProperties({
		"SplineType": EJSS_DRAWING2D.Arrow.SPLINE_END,
		"LineColor" : CONSTANTS.CONNECTION_COLOR_NORMAL, 
		"LineWidth" : CONSTANTS.CONNECTION_NORMAL_WIDTH,
//		"MarkMiddle" : EJSS_DRAWING2D.Arrow.RECTANGLE, 
//		"MarkMiddleDiameter" : CONSTANTS.CONNECTION_MARK_SIZE,
		"MarkStart" : EJSS_DRAWING2D.Arrow.RECTANGLE, 
		"MarkStartDiameter" : CONSTANTS.CONNECTION_MARK_SIZE,
		"EnabledPosition" : EJSS_DRAWING2D.InteractionTarget.ENABLED_NO_MOVE,
		"OnEnter" : connectionEnter, 
		"OnExit" : connectionExit, 
		"OnRelease" : connectionRelease, 
		"OnDoubleClick" : connectionDoubleClick
	});
	if (!mConnection.isDirected()) 
			mFullArrow.setProperty("MarkEnd",EJSS_DRAWING2D.Arrow.NONE);

	const mHalfArrow = mView._addElement(EJSS_DRAWING2D.arrow,
		// Give it a unique name as view element (although we do not use names)
		mGraph.getID()+"-conn_half-"+mConnection.getID(),
		mDrawingPanel);
	mHalfArrow.setProperties({
		"SplineType": EJSS_DRAWING2D.Arrow.SPLINE_START,
		"LineColor" : CONSTANTS.CONNECTION_START_COLOR, 
		"LineWidth" : CONSTANTS.CONNECTION_START_WIDTH,
		"MarkEnd" : EJSS_DRAWING2D.Arrow.NONE, 
		"EnabledPosition" : EJSS_DRAWING2D.InteractionTarget.ENABLED_NONE,
		"Attributes" : { "stroke-dasharray":"5", "stroke-dashoffset" : "0" }
	});

	var mSourceLabel = mView._addElement(EJSS_DRAWING2D.text,
		mGraph.getID()+"-conn_source_text-"+mConnection.getID(),
		mDrawingPanel);
	mSourceLabel.setProperties({ 
		"Visibility" : false, 
		"FillColor" : CONSTANTS.CONNECTION_START_COLOR, 
		"RelativePosition": "CENTER",
		"FontSize" : CONSTANTS.CONNECTION_FONT_SIZE,
		"Text" : ""
	});

	var mTargetLabel = mView._addElement(EJSS_DRAWING2D.text,
		mGraph.getID()+"-conn_target_text-"+mConnection.getID(),
		mDrawingPanel);
	mTargetLabel.setProperties({ 
		"Visibility" : false, 
		"FillColor" : CONSTANTS.CONNECTION_COLOR_NORMAL, 
		"RelativePosition": "CENTER",
		"FontSize" : CONSTANTS.CONNECTION_FONT_SIZE,
		"Text" : ""
	});
	
	var mMiddleLabel = mView._addElement(EJSS_DRAWING2D.text,
		mGraph.getID()+"-conn_middle_text-"+mConnection.getID(),
		mDrawingPanel);
	mMiddleLabel.setProperties({ 
		"Visibility" : false, 
		"FillColor" : CONSTANTS.CONNECTION_CONDITION_COLOR, 
		"RelativePosition": "CENTER",
		"FontSize" : CONSTANTS.CONNECTION_FONT_SIZE,
		"Text" : ""
	});

	/**
	 * Removes the graphics of this graphic connection
	 */
	self.removeGraphics = function() { 
		mDrawingPanel.removeElement(mFullArrow);
		mDrawingPanel.removeElement(mHalfArrow);
		mDrawingPanel.removeElement(mSourceLabel);
		mDrawingPanel.removeElement(mTargetLabel);
		mDrawingPanel.removeElement(mMiddleLabel);
		mView._render();
	}

	// ------------------------------
	// Draw the graphic connection
	// ------------------------------

	self.updateStyle = function() {
		if (mConnection.isDirected()) {
			if (mConnection.getClearLinkAfterRun()) 
				mFullArrow.setProperty("MarkEnd",EJSS_DRAWING2D.Arrow.ANGLE);
			else 
				mFullArrow.setProperty("MarkEnd",EJSS_DRAWING2D.Arrow.TRIANGLE);
		}
		else {
			mFullArrow.setProperty("MarkEnd",EJSS_DRAWING2D.Arrow.NONE);
		}
		
		const displayStyleIndex = CONSTANTS.CONNECTION_DISPLAY_STYLES.indexOf(mConnection.getDisplayStyle());
		const isPrimary = displayStyleIndex<=0;
		
		const sourceText = mConnection.getSourceProperty();
		if (isPrimary && sourceText && mGraph.getShowOutputLabels()) {
			mSourceLabel.setProperties({ "Visibility" : true, "Text" : sourceText });
		}
		else mSourceLabel.setProperty("Visibility", false);
		
		const targetText = mConnection.getTargetProperty();
		if (isPrimary && targetText && mGraph.getShowInputLabels()) {
			mTargetLabel.setProperties({ "Visibility" : true, "Text" : targetText });
		}
		else mTargetLabel.setProperty("Visibility", false);
		
		var lineColor = CONSTANTS.CONNECTION_COLOR_NORMAL;
		var middleText = mConnection.getSourceTriggerBoolean();
		if (isPrimary && middleText) {
			if (middleText.endsWith("= true")) {
				middleText = "True";
				lineColor = CONSTANTS.CONNECTION_TRUE_COLOR;
			}
			else {
				middleText = "False";
				lineColor = CONSTANTS.CONNECTION_FALSE_COLOR;
			}
			mMiddleLabel.setProperties({ 
				"Visibility" : mGraph.getShowConditionLabels(), 
				"Text" : middleText
			});
		}
		else mMiddleLabel.setProperty("Visibility", false);

		switch (displayStyleIndex) {
			case 2: // 'hidden'
				mFullArrow.setProperties({ "Visibility" : false }); 
				mHalfArrow.setProperties({ "Visibility" : false }); 
				break; 
			case 1: // 'secondary'
				mFullArrow.setProperties({ "Visibility" : true, 
					"LineColor" : CONSTANTS.CONNECTION_SECONDARY_COLOR,
					"LineWidth": CONSTANTS.CONNECTION_SECONDARY_WIDTH }); 
				mHalfArrow.setProperties({ "Visibility" : true, 
					"LineColor" : CONSTANTS.CONNECTION_SECONDARY_COLOR, 
					"LineWidth": CONSTANTS.CONNECTION_SECONDARY_WIDTH }); 
				break; 
			case 0: // 'primary'
			default: 
				mFullArrow.setProperties({ "Visibility" : true, 
					"LineColor" : lineColor,
					"LineWidth": CONSTANTS.CONNECTION_NORMAL_WIDTH }); 
				mHalfArrow.setProperties({ "Visibility" : true, 
					"LineColor" : CONSTANTS.CONNECTION_START_COLOR, 
					"LineWidth": CONSTANTS.CONNECTION_START_WIDTH }); 
				break; 
		}
		switch(mConnection.getConnectionStatus()) {
			default:
			case GRAPH_CONS.CONNECTION_STATUS_NORMAL:
				break; // do nothing
			case GRAPH_CONS.CONNECTION_STATUS_RUN:
				mFullArrow.setProperties({ "Visibility" : true, 
					"LineColor" : CONSTANTS.CONNECTION_COLOR_RUN,
					"LineWidth": CONSTANTS.CONNECTION_NORMAL_WIDTH }); 
				break;
			case GRAPH_CONS.CONNECTION_STATUS_TRAVERSED:
				mFullArrow.setProperties({ "Visibility" : true, 
					"LineColor" : CONSTANTS.CONNECTION_COLOR_TRAVERSED,
					"LineWidth": CONSTANTS.CONNECTION_NORMAL_WIDTH }); 
				break;
			case GRAPH_CONS.CONNECTION_STATUS_TRAVERSED_BUT_WAITING:
				mFullArrow.setProperties({ "Visibility" : true, 
					"LineColor" : CONSTANTS.CONNECTION_COLOR_TRAVERSED_BUT_WAITING,
					"LineWidth": CONSTANTS.CONNECTION_NORMAL_WIDTH }); 
				break;
		}
		if (mConnection.isRequiredToRunNode()) {
			mFullArrow.setProperty("Attributes", { "stroke-dasharray":"0" });
			mHalfArrow.setProperty("Attributes", { "stroke-dasharray":"5", "stroke-dashoffset" : "0" });
		}
		else {
			mFullArrow.setProperty("Attributes", { "stroke-dasharray":"2", "stroke-dashoffset" : "0" });
			mHalfArrow.setProperty("Attributes", { "stroke-dasharray":"5", "stroke-dashoffset" : "0"  });
		}

		mView._render();
	}

	var fontRealSize = mDrawingPanel.toPanelMod([CONSTANTS.CONNECTION_FONT_SIZE,CONSTANTS.CONNECTION_FONT_SIZE]);
	
	function horizontal(dx,dy) {
		mFullArrow.setProperty("SplineType", EJSS_DRAWING2D.Arrow.SPLINE_END_HORIZONTAL);
		mHalfArrow.setProperty("SplineType", EJSS_DRAWING2D.Arrow.SPLINE_START_HORIZONTAL);
		if (dx>0) { // goes to the right
			if (dy>0) { // goes right-up
				mSourceLabel.setProperty("RelativePosition", "SOUTH");
				mTargetLabel.setProperty("RelativePosition", "NORTH");
			}
			else { // goes right-down or just right
				mSourceLabel.setProperty("RelativePosition", "NORTH");
				mTargetLabel.setProperty("RelativePosition", "SOUTH");
			}
		}
		else { // goes to the left
			if (dy>0) { // goes left-up
				mSourceLabel.setProperty("RelativePosition", "SOUTH");
				mTargetLabel.setProperty("RelativePosition", "NORTH");
			}
			else { // goes left-down or just left
				mSourceLabel.setProperty("RelativePosition", "NORTH");
				mTargetLabel.setProperty("RelativePosition", "SOUTH");
			}
		}
		mMiddleLabel.setProperty("RelativePosition", "CENTER");
		fontRealSize = mDrawingPanel.toPanelMod([0,CONSTANTS.CONNECTION_FONT_SIZE]);
	}
	
	function vertical(dx,dy) {
		mFullArrow.setProperty("SplineType", EJSS_DRAWING2D.Arrow.SPLINE_END_VERTICAL);
		mHalfArrow.setProperty("SplineType", EJSS_DRAWING2D.Arrow.SPLINE_START_VERTICAL);
		if (dx>0) { // goes to the right
			if (dy>0) { // goes right-up
				mSourceLabel.setProperty("RelativePosition", "WEST");
				mTargetLabel.setProperty("RelativePosition", "EAST");
			}
			else { // goes right-down or just right
				mSourceLabel.setProperty("RelativePosition", "WEST");
				mTargetLabel.setProperty("RelativePosition", "EAST");
			}
		}
		else { // goes to the left
			if (dy>0) { // goes left-up
				mSourceLabel.setProperty("RelativePosition", "EAST");
				mTargetLabel.setProperty("RelativePosition", "WEST");
			}
			else { // goes left-down or just left
				mSourceLabel.setProperty("RelativePosition", "EAST");
				mTargetLabel.setProperty("RelativePosition", "WEST");
			}
		}
		mMiddleLabel.setProperty("RelativePosition", "WEST");
		fontRealSize = mDrawingPanel.toPanelMod([CONSTANTS.CONNECTION_FONT_SIZE,0]);
	}

	function position(fromPoint, toPoint) {
		const size = [toPoint[0]-fromPoint[0],toPoint[1]-fromPoint[1]];
		mFullArrow.setPosition(fromPoint);
		mFullArrow.setSize(size);
		mHalfArrow.setPosition(fromPoint);
		mHalfArrow.setSize(size);
		const sourcePoint = [fromPoint[0]+size[0]*0.15,fromPoint[1]+size[1]*0.15];
		mSourceLabel.setPosition(sourcePoint);
		const targetPoint = [fromPoint[0]+size[0]*0.85,fromPoint[1]+size[1]*0.85];
		mTargetLabel.setPosition(targetPoint);
		const middlePoint = [fromPoint[0]+size[0]*0.5+fontRealSize[0],fromPoint[1]+size[1]*0.5+fontRealSize[1]];
		mMiddleLabel.setPosition(middlePoint);
	}

	// ------------------------------------------
	// Input zone (in the context of the graph) 
	// ------------------------------------------

	/** 
	 * In which zone of the toNode (final node) will the connection get in
	 * 1 : left, 2: top, 3: right, 4: bottom
	 */
	var mInputZone = 1; // Very volatile

	self.getInputZone = function() { return mInputZone; };

	self.getOutputZone = function() { 
		switch(mInputZone) {
			case 1 : return 3;	
			case 2 : return 4;
			case 3 : return 1;
			case 4 : return 2;
		} 
		return 0;
	};

	/**
	 * Decides in which part of the toNode (final node) will the connection get in
	 * 	1 : left, 2: top, 3: right, 4: bottom
	 */
	self.updateInputZone = function() {
		var toPos   = mConnection.getTargetNode().getGraphicNode().getPosition();
		var fromPos = mConnection.getSourceNode().getGraphicNode().getPosition();
		var dx = toPos[0]-fromPos[0], dy = toPos[1]-fromPos[1];
		if (Math.abs(dx)>=Math.abs(dy)) { // Horizontal connection
			if (dx>=0) mInputZone = 1;
			else mInputZone = 3;
		}
		else {
			if (dy>=0) mInputZone = 4;
			else mInputZone =  2; 
		}
	};
	
	// ----------------------------------------------
	// Update position (in the context of the graph)
	// ----------------------------------------------

	self.updatePosition = function () {
		const RADIUS = CONSTANTS.NODE_IMAGE_SIZE/2.0;

		var fromGraphicNode = mConnection.getSourceNode().getGraphicNode();
		var toGraphicNode   = mConnection.getTargetNode().getGraphicNode();
		
		var fromPoint = fromGraphicNode.getPosition();
		var toPoint   = toGraphicNode.getPosition();
	
		var outRelPos = fromGraphicNode.getConnectionRelativePosition(mConnection);
		var inRelPos  = toGraphicNode.getConnectionRelativePosition(mConnection);
	
		var dx = toPoint[0]-fromPoint[0];
		var dy = toPoint[1]-fromPoint[1];

		var sep = mDrawingPanel.toPanelMod([RADIUS*1.2,RADIUS*1.2]);

		if (Math.abs(dx)>=Math.abs(dy)) { // Horizontal connection
			horizontal(dx,dy);
			var inDisplY  = mDrawingPanel.toPanelMod([0,inRelPos *RADIUS])[1];
			var outDisplY = mDrawingPanel.toPanelMod([0,outRelPos*RADIUS])[1];
			var extra = mConnection.getClearLinkAfterRun() ? 0 : sep[0]/3.0;
			if (dx>=0) { fromPoint[0] += sep[0]; toPoint[0] -= (sep[0]+extra); } 
			else       { fromPoint[0] -= sep[0]; toPoint[0] += (sep[0]+extra); } 
			fromPoint[1] += outDisplY; 
			toPoint[1] += inDisplY;
		}
		else { // Vertical connection
			vertical(dx,dy);
			var inDisplX  = mDrawingPanel.toPanelMod([0,inRelPos *RADIUS])[1];
			var outDisplX = mDrawingPanel.toPanelMod([0,outRelPos*RADIUS])[1];
			fromPoint[0] += outDisplX; 
			toPoint[0]   += inDisplX;
			var extra = mConnection.getClearLinkAfterRun() ? 0 : sep[1]/3.0;
			if (dy>=0) { fromPoint[1] -= sep[1]; toPoint[1] += (sep[1]+extra); }
			else       { fromPoint[1] += sep[1]; toPoint[1] -= (sep[1]+extra); }
			if (mGraph.getShowNodeLabels()) {
				if (self.getInputZone() ==4) toPoint[1]   += sep[1];
				if (self.getOutputZone()==4) fromPoint[1] += sep[1];
			}
		}
		position(fromPoint,toPoint);
		mView._render();
	};

	return self;
};
