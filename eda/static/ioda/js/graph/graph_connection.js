/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 *
 * This code is Open Source and is provided "as is".
*/

var IODA_GRAPH = IODA_GRAPH || {};

/**
 * Creates a (directed) Connection object betwween two nodes 
 * @param mGraph : the parent graph
 * @param mID : a unique integer number that identifies the connection
 * @param mSourceNode : the origin node
 * @param mTargetNode : the target node
 */
IODA_GRAPH.createConnection = function(mGraph,mID,mSourceNode,mTargetNode) {
	var self = {};
	/**
	 * A directed connection looks like an arrow. 
	 * A non-directed connection looks like a line 
	 *   (or a two-headed arrow)
	 * If not specified, a newly created connection 
	 *   is directed if the graph is directed.
	 */ 
	var mIsDirected = mGraph.isDirected();
	
	var mSourceProperty = null;
	var mTargetProperty = null;
	var mSourceTrigger = null;
	var mClearAfterRun = false;
	var mIsRequiredToRunNode = true;
	var mComment = "";

	// the connection status when simulating the graph
	var mStatus = IODA_GRAPH.Constants.CONNECTION_STATUS_NORMAL;
	// One of several possible display styles. See IODA_GRAPHICS.Constants
	var mDisplayStyle = 0;
	var mGraphicConnection;

	// --------------------------------------
	// Basic setters, getters, and utilities
	// --------------------------------------

	self.getGraph = function() { return mGraph; }

	self.getID = function() { return mID; }

	self.getSourceNode = function() { return mSourceNode; }

	self.getTargetNode = function() { return mTargetNode; }

	self.isDirected   = function() { return mIsDirected; }

	self.setDirected  = function(directed) { 
		mIsDirected = directed;
		mGraphicConnection.updateStyle();
	}

	self.getComment = function() { return mComment; }

	self.setComment = function(comment) {
		if (mComment!=comment) {
			mComment = comment;
			mGraph.reportChange();
		}
	}
	
	self.toString = function() { 
		return mSourceNode.getName()+" &#8594; "+mTargetNode.getName(); 
	}

	self.destroy = function() {
		mSourceNode.removeOutputConnection(self);
		mTargetNode.removeInputConnection(self);
		if (mTargetProperty!=null) mTargetNode.removeLinkToProperty(mTargetProperty,self);
		mGraphicConnection.removeGraphics();
	}

	// --------------------------------------
	// Properties linked
	// --------------------------------------

	self.getSourceProperty = function() {
		return mSourceProperty;
	}

	self.setSourceProperty = function(property_name) {
		if (property_name!==mSourceProperty) {
			mSourceProperty = property_name;
			mGraphicConnection.updateStyle();
		}
	}

	self.getTargetProperty = function() {
		return mTargetProperty;
	}

	self.setTargetProperty = function(property_name) {
		if (property_name!==mTargetProperty) {
			if (mTargetProperty!=null) mTargetNode.removeLinkToProperty(mTargetProperty,self);
			mTargetProperty = property_name;
			if (property_name!=null) mTargetNode.addLinkToProperty(mTargetProperty,self);
			mGraphicConnection.updateStyle();
		}
	}

	self.setClearLinkAfterRun = function(clear) {
		if (!clear) clear = false;
		if (clear!==mClearAfterRun) {
			mClearAfterRun = clear;
			mGraphicConnection.updateStyle();
			mGraphicConnection.updatePosition();
		}
	}

	self.getClearLinkAfterRun = function() {
		return mClearAfterRun;
	}

	self.setSourceTriggerBoolean = function(trigger) {
		if (trigger!==mSourceTrigger) {
			mSourceTrigger = trigger;
			mGraphicConnection.updateStyle();
		}
	}

	self.getSourceTriggerBoolean = function() {
		return mSourceTrigger;
	}

	self.setRequiredToRunNode = function(required) {
		if (required!=mIsRequiredToRunNode) {
			mIsRequiredToRunNode = required;
			mGraphicConnection.updateStyle();
		}
	}

	self.isRequiredToRunNode = function() {
		return mIsRequiredToRunNode;
	}

	self.getConnectionStatus   = function() { return mStatus; }

	self.setConnectionStatus  = function(status) {
		if (status!=mStatus) {
			mStatus = status; 
			mGraphicConnection.updateStyle();
		} 
	}

	// -----------------------------
	// Saving and reading
	// -----------------------------

	self.toObject = function() {
		var object = {};
		// ID does not need to be saved
		object.from = mSourceNode.getID();
		object.to = mTargetNode.getID();
		object.is_directed = mIsDirected;
		object.display_style = mDisplayStyle;
		if (mSourceTrigger)  object.source_trigger  = mSourceTrigger; 
		if (mSourceProperty) object.source_property = mSourceProperty; 
		if (mTargetProperty) object.target_property = mTargetProperty; 
		object.clear_after_run = mClearAfterRun;
		object.required_to_run = mIsRequiredToRunNode;
		object.comment = mComment;
		return object;
	}

	self.fromObject = function(object) {
		// from and to are read by the super (graph)
		if ('is_directed'     in object) mIsDirected = object.is_directed;
		if ('display_style'   in object) mDisplayStyle = object.display_style;
		if ('source_trigger'  in object) mSourceTrigger = object.source_trigger;
		if ('source_property' in object) mSourceProperty = object.source_property;
		if ('clear_link'      in object) mClearAfterRun = object.clear_link;
		if ('clear_after_run' in object) mClearAfterRun = object.clear_after_run;
		if ('required_to_run' in object) mIsRequiredToRunNode = object.required_to_run;
		// This node requires something more
		if ('target_property' in object) {
				mTargetProperty = object.target_property;
				if (mTargetProperty!=null) mTargetNode.addLinkToProperty(mTargetProperty,self);
		}
		if ('comment' in object) mComment = object.comment;
		self.render();
		return object;
	}

	// -----------------------------
	// Graphic visualization
	// -----------------------------

	self.getGraphicConnection = function() { 
		return mGraphicConnection; 
	}

	self.render = function() {
		mGraphicConnection.updateStyle();
		mGraphicConnection.updatePosition();
	}

	self.getDisplayStyle = function() {
		return mDisplayStyle;
	}

	self.setDisplayStyle = function(style) {
		if (style!=mDisplayStyle) {
			mDisplayStyle = style;
			mGraphicConnection.updateStyle();
		}
	}
	
	// -----------------------------
	// Final start-up
	// -----------------------------
	
	// The graphic element
	mGraphicConnection = IODA_GRAPHICS.createGraphicConnection(self);

	// Order is important in the next two follows
	mSourceNode.addOutputConnection(self);
	mTargetNode.addInputConnection(self);

	mGraphicConnection.updatePosition();
	mGraphicConnection.updateStyle();

	return self;
}

