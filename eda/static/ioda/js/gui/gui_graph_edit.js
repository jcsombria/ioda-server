/*
 * Copyright (C) 2021 Francisco Esquembre 
 * This code is part of the Fusion IODA project
 */
/**
 * GUI tools
 * @module core
 */

var IODA_GUI = IODA_GUI || {};

/**
 * A user interface tab page with a graph
 * The user can edit the graph and also simulate its run time behaviour
 */
IODA_GUI.graphEditPage = function(mID, mTitle, mParent, mIsRunReplay) {
	const GRAPH_CONSTANTS = IODA_GRAPH.Constants;
	var self = IODA_GUI.tabbedPage(mID,mTitle);

	const super_saveObject = self.saveObject;
	const super_readObject = self.readObject;
	
	const mDisabledStr = mIsRunReplay ? ' disabled ' : '';

	// Created at the end
	var mGraph;
	var mRunControl;

	var mCommonDiv  = jQuery("<div/>", {
		class: "sTabRight h-100 d-flex flex-column mx-auto",
		style: "background: red; flex-grow:0; flex-basis:0;"}).appendTo(mParent);
		
	// -----------------------------
	// Setters and getters
	// -----------------------------
		 	
	self.getGraph = function() { return mGraph; }

	//self.getRunControl = function() { return mRunControl; }

	self.setResultsData = function(resultsData) {
      console.log(resultsData)
		self.setResourcesID(resultsData['resources']);
		mRunControl.setRunInformation(resultsData['graph'],resultsData['nodes']);
		self.displayRunInfo(null);
	}
	
	// -----------------------------
	// Serialization
	// -----------------------------

	self.saveObject = function() {
		var object = super_saveObject();
		object.graph = mGraph.toObject();
		object.run_control = mRunControl.toObject();
		return object;
	}

	self.readObject = function(object) {
		super_readObject(object);
		// Order is important Here!!!
		if ('run_control' in object) mRunControl.fromObject(object.run_control);
		else mRunControl.fromObject(object); // backwards compatibility
		if ('graph' in object) mGraph.fromObject(object.graph);
		else mGraph.fromObject(object);  // backwards compatibility
		self.showGraphOptions();
		if (mIsRunReplay) self.displayRunInfo(null);
	}

	// ------------------------------------------------
	// Interface expected by the graph mUserInterface 
	// ------------------------------------------------
	
	/**
	 * Let any interested listener that the graph changed 
	 */
	self.reportChange = function() {}

	self.showMessage = function(header,message) {
		sShowMessage(header,message);
	}

	// ------------------------------------------------
	// Common HTML
	// ------------------------------------------------

/*
	const mMIDDLE_HEADER_LINE = 
		'<div class="sTabRight_header bg-light border border-dark mt-1 p-2 d-flex flex-row" style="flex-grow:0; flex-basis:0">'+
			'<div class="sTabRight_header_title text-primary align-middle justify-content-center">#{name}</div>'+
		'</div>';
*/

	const mCHECK_FIELD = 
		'<div class="mp-2 mt-1 px-1">'+
			'<div class="form-check form-switch">'+ 
				'<input id="#{label}" class="form-check-input" type="checkbox" aria-label="#{label}_label" '+
						'onchange="sMainCommandCenter.sendCommand(\''+ mID+'\',\'#{command}\')" '+
						' #{checked} '+
						' #{extras} >'+
				'<label id="#{label}_label" for="#{label}" class="form-check-label text-dark">#{name}</label>'+
			'</div>'+
		'</div>';
	
	const mINFO_LINE = 
		'<div class="mp-2 px-1">'+
				'<label id="#{label}-label" for="#{label}" class="fw-light mt-2 mb-0 form-label text-dark">#{name}</label>'+
				'<input type="text" class="text-primary form-control" id="#{label}" aria-describedby="#{label}-label" '+
					'value="#{value}" disabled>'+
		'</div>';
		
	const mLINK_BUTTON = 
		'<div class="mp-2 px-1">'+
				'<label id="#{label}-label" for="#{label}" class="fw-light mt-2 mb-0 form-label text-dark">#{name}</label>'+
				'<div>'+
					'<button id="#{label}" class="btn btn-link" type="button" '+
						'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'link:#{link}\')">#{link}</button>'+
//			'<a href="#link" class="btn btn-info" role="button">#{name}</a>'
				'</div>'+
		'</div>';

				
	const mCOMMENT_LINE = 
		'<div class="mp-0 px-0">'+
				'<textarea class="text-primary form-control" id="#{label}" '+
					'oninput="sMainCommandCenter.sendCommand(\''+ mID+'\',\'#{command}\')" '+
//				'onblur="sMainCommandCenter.sendCommand(\''+ mID+'\',\'#{command}\')" '+
					'#{extras} >'+
					'#{value}'+
				'</textarea>'+
		'</div>';

	const mCOLLAPSABLE_DIV = 	
		'<button class="sTabRight_header border border-dark p-2 bg-light d-flex flex-row" '+
				'data-bs-toggle="collapse" data-bs-target="##{label}" aria-expanded="true" aria-controls="#{label}" '+
				'style="flex-grow:0; flex-basis:0">'+
			'<span class="sTabRight_header_title text-primary" style="flex-grow:1; text-align:left">#{name}</span>'+
			'<span class="container-fluid p2-2 justify-content-end" style="flex-grow:0; flex-basis:0">'+
				'<i class="bi bi-chevron-expand" style="font-size: 1rem;"></i>'+
			'</span>'+
		'</button>'+
		'<div class="d-flex flex-column" style="flex-grow:0; flex-basis:0;">'+
			'<div class="collapse show" id="#{label}" style="flex-grow:0; flex-basis:0;"></div>'+
		'</div>';

	const mCOLLAPSABLE_MIDDLE_DIV = 	
		'<button class="sTabRight_header border border-dark p-2 bg-light d-flex flex-row" '+
				'data-bs-toggle="collapse" data-bs-target="##{label}" aria-expanded="true" aria-controls="#{label}" '+
				'style="flex-grow:0; flex-basis:0">'+
			'<span class="sTabRight_header_title text-primary" style="flex-grow:1; text-align:left">#{name}</span>'+
			'<span class="container-fluid p2-2 justify-content-end" style="flex-grow:0; flex-basis:0">'+
				'<i class="bi bi-chevron-expand" style="font-size: 1rem;"></i>'+
			'</span>'+
		'</button>'+
		'<div class="d-flex flex-column overflow-scroll mb-1" style="flex-grow:1; flex-basis:0;">'+
			'<div class="collapse show h-100 overflow-scroll" id="#{label}" style="flex-grow:1;"></div>'+
		'</div>';

	// ------------------------------------------------
	// Editing graph display properties
	// ------------------------------------------------

	const mGRAPH_OPTIONS_HTML =
		mCOLLAPSABLE_DIV.replace( /#\{label\}/g, (mID+'-graph_options_div'))
			.replace( /#\{name\}/g, sMainRes.getString('Graph') )+
		
		(mIsRunReplay ? 
			mCOLLAPSABLE_MIDDLE_DIV.replace( /#\{label\}/g, (mID+'-graph_run_div'))
				.replace( /#\{name\}/g, sMainRes.getString('Runtime info') ) 
		 : 
			mCOLLAPSABLE_MIDDLE_DIV.replace( /#\{label\}/g, (mID+'-graph_run_div'))
				.replace( /#\{name\}/g, sMainRes.getString('Simulation options') ) 
		)+
		
		mCOLLAPSABLE_DIV.replace( /#\{label\}/g, (mID+'-graph_comment_div'))
			.replace( /#\{name\}/g, sMainRes.getString('Comment') )+

		// --- Footer
		'<footer class="border border-dark bg-light d-flex flex-row">'+
			'<div class="container-fluid p-0 justify-content-start" style="flex-grow:1">'+
				'<button class="btn btn-link p-0 text-decoration-none" type="button"'+
					'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'start\')">'+
					'<i class="bi bi-collection-play" style="color: red;"></i>'+
				'</button>'+
				'<button class="btn btn-link p-0 text-decoration-none" type="button" '+
					'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'step\')">'+
					'<i class="bi bi-skip-backward-btn" style="color: cornflowerblue;"></i>'+
				'</button>'+
				'<button class="btn btn-link p-0 text-decoration-none" type="button" '+
					'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'stop\')">'+
					'<i class="bi bi-stop-btn" style="color: DarkGreen;"></i>'+
				'</button>'+
			'</div>'+
			'<div id="'+ mID+'-graph_options_footer_right_div" '+
				'class="container-fluid p-2 justify-content-end" style="flex-grow:0; flex-basis:0">'+
			'</div>'+
			(mIsRunReplay ? '' : 
			'<div class="container-fluid px-2 d-flex flex-row justify-content-end" style="flex-grow:0; flex-basis:0">'+
				'<span class="border-start border-danger border-4"></span>'+
				'<button class="btn btn-link p-0 ms-1 text-decoration-none" type="button"'+
					'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'run_at_server\')">'+
					'<i class="bi bi-arrow-right-square-fill"  style="font-size: 2rem;"></i>'+
				'</button>'+
			'</div>')+
		'</footer>'; 
		

	var mGraphDiv  = jQuery("<div/>", {
		class: "sTabRight h-100 d-flex flex-column mx-auto",
		style: "flex-grow:1;",
		html: mGRAPH_OPTIONS_HTML}).appendTo(mCommonDiv);

	const mGRAPH_OPTION_LABEL = mID+"-graph_option-";

	self.getGraphOptionsDiv     = function() { return $('#'+ mID+'-graph_options_div'); }
	self.getGraphRunDiv         = function() { return $('#'+ mID+'-graph_run_div'); }
	self.getGraphFooterRightDiv = function() { return $('#'+ mID+'-graph_options_footer_right_div'); }

	// create mGraphDiv
	function createGraphInterface () { 
		var graphDiv = self.getGraphOptionsDiv();
		var commentDiv = $('#'+ mID+'-graph_comment_div');

		graphDiv.append(mCHECK_FIELD
		.replace( /#\{label\}/g, (mGRAPH_OPTION_LABEL+'node_labels') )
		.replace( /#\{name\}/g, sMainRes.getString('Show node labels') )
		.replace( /#\{command\}/g, 'node_labels' )
		.replace( /#\{extras\}/g, '')
		.replace( /#\{checked\}/g, mGraph.getShowNodeLabels() ? 'checked' : ''));
		graphDiv.append(mCHECK_FIELD
			.replace( /#\{label\}/g, (mGRAPH_OPTION_LABEL+'output_labels') )
			.replace( /#\{name\}/g, sMainRes.getString('Show output labels') )
			.replace( /#\{command\}/g, 'output_labels' )
			.replace( /#\{extras\}/g, '')
			.replace( /#\{checked\}/g, mGraph.getShowOutputLabels() ? 'checked' : '' ));
		graphDiv.append(mCHECK_FIELD
			.replace( /#\{label\}/g, (mGRAPH_OPTION_LABEL+'input_labels') )
			.replace( /#\{name\}/g, sMainRes.getString('Show input labels') )
			.replace( /#\{command\}/g, 'input_labels' )
			.replace( /#\{extras\}/g, '')
			.replace( /#\{checked\}/g, mGraph.getShowInputLabels() ? 'checked' : ''));
		graphDiv.append(mCHECK_FIELD
			.replace( /#\{label\}/g, (mGRAPH_OPTION_LABEL+'condition_labels') )
			.replace( /#\{name\}/g, sMainRes.getString('Show condition labels') )
			.replace( /#\{command\}/g, 'condition_labels' )
			.replace( /#\{extras\}/g, '')
			.replace( /#\{checked\}/g, mGraph.getShowConditionLabels() ? 'checked' : ''));
		graphDiv.append('<div class="h-divider"></div>');
		
		if (!mIsRunReplay) {
			var runDiv = self.getGraphRunDiv();
			runDiv.append(mCHECK_FIELD
				.replace( /#\{label\}/g, (mGRAPH_OPTION_LABEL+'simulate_conditionals') )
				.replace( /#\{name\}/g, sMainRes.getString('Simulate conditionals') )
				.replace( /#\{command\}/g, 'simulate_conditionals' )
				.replace( /#\{extras\}/g, '')
				.replace( /#\{checked\}/g, false ? 'checked' : ''));
			runDiv.append(mCHECK_FIELD
				.replace( /#\{label\}/g, (mGRAPH_OPTION_LABEL+'true_conditionals') )
				.replace( /#\{name\}/g, sMainRes.getString('Conditions are true/false') )
				.replace( /#\{command\}/g, 'true_conditionals' )
				.replace( /#\{extras\}/g, '')
				.replace( /#\{checked\}/g, false ? 'checked' : ''));
			runDiv.append('<div class="h-divider"></div>');
		}
		commentDiv.append(mCOMMENT_LINE
			.replace(/#\{label\}/g,(mID+'-graph-comment'))
			.replace(/#\{name\}/g, sMainRes.getString('Comment')  )
			.replace(/#\{command\}/g, 'comment')
			.replace(/#\{extras\}/g, mDisabledStr + 'rows="10" placeholder="'+sMainRes.getString('Optional comment here...')+'"')
			.replace(/#\{value\}/g, mGraph.getComment())
		);
	}
	
	self.fillGraphOptions = function() {
		$('#'+mGRAPH_OPTION_LABEL+'node_labels').prop('checked', mGraph.getShowNodeLabels());
		$('#'+mGRAPH_OPTION_LABEL+'output_labels').prop('checked', mGraph.getShowOutputLabels());
		$('#'+mGRAPH_OPTION_LABEL+'input_labels').prop('checked', mGraph.getShowInputLabels());
		$('#'+mGRAPH_OPTION_LABEL+'condition_labels').prop('checked', mGraph.getShowConditionLabels());
		if (!mIsRunReplay) {
			$('#'+mGRAPH_OPTION_LABEL+'simulate_conditionals').prop('checked', mRunControl.getSimulateConditionals());
			$('#'+mGRAPH_OPTION_LABEL+'true_conditionals').prop('checked', mRunControl.getSimulateTrueConditionals());
		}
		$('#'+mID+'-graph-comment').val(mGraph.getComment());
	}
	
	self.displayRunInfo = function(nodeInfo) {
		var runDiv = $('#'+ mID+'-graph_run_div')
		runDiv.empty();
		if (nodeInfo!=null) {
			var node = mGraph.findNode(nodeInfo.node);
			runDiv.append(mINFO_LINE.replace( /#\{label\}/g, (mID+'-run_name') )
				.replace( /#\{name\}/g, sMainRes.getString('Node') )
				.replace( /#\{value\}/g, node.getName() ));			
			runDiv.append(mINFO_LINE.replace( /#\{label\}/g, (mID+'-run_iteration') )
				.replace( /#\{name\}/g, sMainRes.getString('Iteration') )
				.replace( /#\{value\}/g, nodeInfo.iteration_string ));			
			runDiv.append(mINFO_LINE.replace( /#\{label\}/g, (mID+'-run_code') )
				.replace( /#\{name\}/g, sMainRes.getString('Result') )
				.replace( /#\{value\}/g, nodeInfo.code ));			
			runDiv.append(mINFO_LINE.replace( /#\{label\}/g, (mID+'-run_start') )
				.replace( /#\{name\}/g, sMainRes.getString('Started') )
				.replace( /#\{value\}/g, nodeInfo.start ));			
			runDiv.append(mINFO_LINE.replace( /#\{label\}/g, (mID+'-run_end') )
				.replace( /#\{name\}/g, sMainRes.getString('Ended') )
				.replace( /#\{value\}/g, nodeInfo.end ));			
			runDiv.append(mINFO_LINE.replace( /#\{label\}/g, (mID+'-run_lapsed') )
				.replace( /#\{name\}/g, sMainRes.getString('Lapsed') )
				.replace( /#\{value\}/g, nodeInfo.lapsed ));			
			runDiv.append(mLINK_BUTTON.replace( /#\{label\}/g, (mID+'-run_url') )
				.replace( /#\{name\}/g, sMainRes.getString('Output') )
				.replace( /#\{link\}/g, nodeInfo.output ));				
		}
		else {
			runDiv.append(mCOMMENT_LINE
				.replace(/#\{label\}/g,(mID+'-run_code'))
				.replace(/#\{name\}/g, sMainRes.getString('Graph result')  )
				.replace(/#\{command\}/g, 'none')
				.replace(/#\{extras\}/g, 'disabled rows="5" ')
				.replace(/#\{value\}/g, mRunControl.getRunGraphInfo()['code']));
		/*	runDiv.append(mINFO_LINE.replace( /#\{label\}/g, (mID+'-run_code') )
				.replace( /#\{name\}/g, sMainRes.getString('Graph result') )
				.replace( /#\{value\}/g, mRunControl.getRunGraphInfo().code));
				*/			
		}
	}
	
	self.showGraphOptions = function() {
		mCurrentNode = null;
		mCurrentConnection = null;

		self.fillGraphOptions();

		mGraphDiv.removeClass('d-none');
		mNodeDiv.addClass('d-none');
		mConnectionDiv.addClass('d-none');
	}

	self.graphCommand = function(command) {
		console.log (mID+" processing graph options command:"+command);
		if (command.startsWith('link:')) {
			var link = 'http://'+command.substring(5);
			window.open(sMainGetServerURL(link));
			return;
		}
		var label = mID+"-graph_option-";
		switch (command) {
			case 'delete' : 
				sMainConfirmationForm.show(function(){
					if (mCurrentConnection!=null) mGraph.removeConnection(mCurrentConnection); },
						mCurrentConnection.toString(), "Do you really want to delete this connection?", "Delete");
				break;
			case 'node_labels' :
				var show = document.getElementById(label+'node_labels').checked
				mGraph.setShowNodeLabels(show);
				break;
			case 'input_labels' :
				var show = document.getElementById(label+'input_labels').checked
				mGraph.setShowInputLabels(show);
				break;
			case 'output_labels' :
				var show = document.getElementById(label+'output_labels').checked
				mGraph.setShowOutputLabels(show);
				break;
			case 'condition_labels' :
				var show = document.getElementById(label+'condition_labels').checked
				mGraph.setShowConditionLabels(show);
				break;
			case 'simulate_conditionals' :
				var simulate = document.getElementById(label+'simulate_conditionals').checked
				mRunControl.setSimulateConditionals(simulate);
				break;
			case 'true_conditionals' :
				var simulateTrue = document.getElementById(label+'true_conditionals').checked
				mRunControl.setSimulateTrueConditionals(simulateTrue);
				break;

			case 'comment' : 
				mGraph.setComment($('#'+(mID+"-graph-comment")).val());
				break;

			case 'display_style' :
				var style = $('#'+label+'display_style').val();
				mGraph.setDisplayStyle(style);
				break;
			case 'start' : mRunControl.start(self);     break;
			case 'step'  : mRunControl.step(self);      break;
			case 'stop'  : mRunControl.stop(self,true); break;
				
			case 'run_at_server':
//				if (true) { mRunControl.showLastSimulationRun(); return; }
				if (mRunControl.isGraphIncomplete()) {
					sMainConfirmationForm.show(
						function() { sMainCommConnection.runGraph(mRunControl.getGraphRunData()); },
						mGraph.getName(), "The graph seems incomplete. Do you still want the server to run this graph?", "Run");
				}
				else sMainConfirmationForm.show(
						function() { sMainCommConnection.runGraph(mRunControl.getGraphRunData()); },
						mGraph.getName(), "The graph seems complete. Do you want the server to run this graph?", "Run");
				break;
				
			default :
				console.log (mID+" received unknown command:"+command);
				break;
		}
	} // end of graph options command 

	// ------------------------------------------------
	// Editing node properties 
	// ------------------------------------------------


	const mPROPERTIES_HTML =
		mCOLLAPSABLE_DIV.replace( /#\{label\}/g, (mID+'-class_and_name_div'))
			.replace( /#\{name\}/g, sMainRes.getString('Node') )+
		// --- Main

		mCOLLAPSABLE_MIDDLE_DIV.replace( /#\{label\}/g, (mID+'-properties_div'))
			.replace( /#\{name\}/g, sMainRes.getString('Properties') )+

/*
		'<div class="d-flex flex-column overflow-scroll mb-1" style="flex-grow:1; flex-basis:0;">'+
			'<div id="'+ mID+'-properties_div" class="h-100 overflow-scroll" style="flex-grow:1">'+
			'</div>'+
		'</div>'+
*/


		mCOLLAPSABLE_DIV.replace( /#\{label\}/g, (mID+'-node_comment_div'))
			.replace( /#\{name\}/g, sMainRes.getString('Comment') )+
		// --- Footer
		'<footer class="border border-dark bg-light d-flex flex-row">'+
			'<div class="container-fluid p-0 justify-content-start" style="flex-grow:1">'+
				'<button class="btn btn-link p-0 text-decoration-none" type="button"'+
					'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'info\')">'+
					'<i class="bi bi-info-square"></i>'+
				'</button>'+
			(mIsRunReplay ? 
				'<button class="btn btn-link p-0 text-decoration-none" type="button" '+
					'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'forward\')">'+
					'<i class="bi bi-skip-end-btn" style="color: cornflowerblue;"></i>'+
				'</button>'
				 :
				'<button class="btn btn-link p-0 text-decoration-none" type="button"'+
					'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'graph\')">'+
					'<i class="bi bi-diagram-2"></i>'+
				'</button>')+
			'</div>'+
			(mIsRunReplay ? '' :
			'<div class="container-fluid p2-2 justify-content-end" style="flex-grow:0; flex-basis:0">'+
				'<button class="btn btn-link p-0 text-decoration-none" type="button"'+
					'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'delete\')">'+
					'<i class="bi bi-x-square"></i>'+
				'</button>'+
			'</div>')+
		'</footer>';



	const mPROPERTY_LINE = 
		'<div class="mp-2 px-1">'+
				'<label id="#{label}-label" for="#{label}" class="fw-light mt-2 mb-0 form-label text-dark">#{name}</label>'+
				'<input type="text" class="text-primary form-control" id="#{label}" aria-describedby="#{label}-label" '+
				'onchange="sMainCommandCenter.sendCommand(\''+ mID+'\',\'#{command}\')" '+
				'value="#{value}" #{extras}>'+
		'</div>';

	const mLINKS_LINE = 
		'<div class="mp-2 px-1">'+
				'<label id="#{label}-label" for="#{label}" class="fw-light mt-2 mb-0 form-label text-dark">#{name}</label>'+
				'<input type="text" class="text-primary form-control" id="#{label}" aria-describedby="#{label}-label" '+
				'onchange="sMainCommandCenter.sendCommand(\''+ mID+'\',\'#{command}\')" '+
				'value="#{value}" disabled #{extras}>'+
		'</div>';
		
	const mSELECT_LINE = 
		'<div class="mp-2 px-1">'
	+		'<label id="#{label}-label" for="#{label}" class="fw-light mt-2 mb-0 form-label text-dark">#{name}</label>'
	+		'<select id="#{label}" class="text-primary form-select" aria-label="#{label}-label" '
	+			'onchange="sMainCommandCenter.sendCommand(\''+ mID+'\',\'#{command}\')" #{extras} >'
//	+				'<option selected><none></option>'
	+ '</select>'
	+'</div>';

	var mCurrentNode = null;

	var mNodeDiv  = jQuery("<div/>", {
		class: "sTabRight h-100 d-flex flex-column mx-auto d-none",
//		style: "flex-grow:0; flex-basis:0;", 
		style: "flex-grow:1;", 
		html: mPROPERTIES_HTML}).appendTo(mCommonDiv);

	var mPropertiesListDiv = $('#'+ mID+'-properties_div');
	var mClassAndNameDiv   = $('#'+ mID+'-class_and_name_div');
	var mCommentDiv        = $('#'+ mID+'-node_comment_div');
	
	self.showNodeProperties = function(node) {
		if (node==null) return self.showGraphOptions();
		if (!mRunControl.isRunning())node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_SELECTED);
		mCurrentNode = node;
		mCurrentConnection = null;

		mNodeDiv.removeClass('d-none');
		mGraphDiv.addClass('d-none');
		//mRunControl.stop();
		mConnectionDiv.addClass('d-none');

		mPropertiesListDiv.empty();
		mClassAndNameDiv.empty();
		mCommentDiv.empty();

		mClassAndNameDiv.append(mINFO_LINE.replace( /#\{label\}/g, (mID+'-classname') )
			.replace( /#\{name\}/g, sMainRes.getString('Class') )
			.replace( /#\{value\}/g, node.getClassname() ));
		mClassAndNameDiv.append(mPROPERTY_LINE.replace( /#\{label\}/g, (mID+'-name') )
			.replace( /#\{name\}/g, sMainRes.getString('Name') )
			.replace( /#\{command\}/g, 'name_change' )
			.replace( /#\{extras\}/g, mDisabledStr )
			.replace( /#\{value\}/g, node.getName() ));
		mClassAndNameDiv.append('<div class="h-divider"></div>');

		var label = mID+"-property-";
		var properties = node.getPropertiesWithAttribute('manual');
		node.getPropertiesWithAttribute('input').forEach(function(property) {
			if (properties.indexOf(property)<0) properties.push(property);
		});
		properties.sort(function (a, b) {
			return ('' + a.name.attr).localeCompare(b.name.attr);
		});
		
		//if (properties.length>0)
		//	mPropertiesListDiv.append(mMIDDLE_HEADER_LINE.replace( /#\{name\}/g, sMainRes.getString('Properties') ));

		// Only manual or input properties
		properties.forEach(function(property) {
			var value = property.value;
			if (node.getPropertyConnectionLinks(property)<=0
				&& node.isPropertyType(property,'OPTION')) {
				// The property requires one of a number of possible OPTIONS
				var options = node.getPropertyOptions(property);
				var optionFound = options.indexOf(value)>=0;

				var propertyHtml = mSELECT_LINE.replace(/#\{label\}/g,(label+property.name))
					.replace( /#\{name\}/g, property.name )
					.replace( /#\{command\}/g, 'property_change:'+ property.name);
				
				if (!optionFound && node.isPropertyAttribute(property,'required')) {
					propertyHtml = propertyHtml.replace( /#\{extras\}/g, mDisabledStr+'style="border: 1px solid red;"');
				}
				else propertyHtml = propertyHtml.replace( /#\{extras\}/g, mDisabledStr);
				mPropertiesListDiv.append(propertyHtml);
				
				var optionsSelect = $('#'+label+property.name);
				optionsSelect.empty();
				if (optionFound) optionsSelect.append('<option style="color=grey;">(none)</option>')
				else             optionsSelect.append('<option style="color=grey;" selected>(none)</option>')
				options.forEach(function(option) {
					if (option===value) optionsSelect.append('<option selected>'+option+'</option>');
					else                optionsSelect.append('<option>'+option+'</option>');
				});
			}
			else { // non-OPTION property
				if (value==null) value = "";
				value = value.trim();
				if (node.isPropertyType(property,"String")) {
				 value = value.replace(/"/g, "'" );
				}
				var connectionLinks = node.getPropertyConnectionLinks(property);

				if(node.isPropertyAttribute(property,'manual')) {
					var propertyHtml = mPROPERTY_LINE
						.replace(/#\{label\}/g,(label+property.name))
						.replace( /#\{name\}/g, property.name)
						.replace( /#\{command\}/g, 'property_change:'+ property.name)
						.replace( /#\{value\}/g, value );
						
					if (value.length==0 && connectionLinks.length<=0 && node.isPropertyAttribute(property,'required') ) 
						propertyHtml = propertyHtml.replace( /#\{extras\}/g, mDisabledStr+'style="border: 1px solid red;"');
					else propertyHtml = propertyHtml.replace( /#\{extras\}/g, mDisabledStr);
					
					mPropertiesListDiv.append(propertyHtml);
				}
				
				if(node.isPropertyAttribute(property,'input') && (connectionLinks.length>0 || !node.isPropertyAttribute(property,'manual')) ) {
					var propertyHtml = mLINKS_LINE
						.replace(/#\{label\}/g,(label+property.name+'-links'))
						.replace( /#\{name\}/g, property.name + ' '+ sMainRes.getString('(links)'))
						.replace( /#\{command\}/g, 'property_cannot_be_changed:'+ property.name);
					if (value.length==0 && connectionLinks.length<=0 && node.isPropertyAttribute(property,'required') ) 
						propertyHtml = propertyHtml.replace( /#\{extras\}/g, mDisabledStr+'style="border: 1px solid red;"');
					else 
						propertyHtml = propertyHtml.replace( /#\{extras\}/g, mDisabledStr)
					
					var linkValue;
					switch (connectionLinks.length) {
						case 0 : linkValue = ''; break;
						case 1 : 
							var conn = connectionLinks[0];
							linkValue = conn.getSourceProperty() + ' &#8592; ' + conn.getSourceNode().getName();
							break;
						default : linkValue = sMainRes.getString('(multiple links)');
					}
					propertyHtml = propertyHtml.replace( /#\{value\}/g,linkValue);
					mPropertiesListDiv.append(propertyHtml);
				}
			} // end of non OPTION property
			mPropertiesListDiv.append('<div class="h-divider"></div>');
		}); // end of properties.forEach

		mCommentDiv.append(mCOMMENT_LINE
			.replace(/#\{label\}/g,(mID+'-node-comment'))
			.replace(/#\{name\}/g, sMainRes.getString('Comment')  )
			.replace(/#\{command\}/g, 'comment')
			.replace(/#\{extras\}/g, mDisabledStr+'rows="6" placeholder="'+sMainRes.getString('Optional comment here...')+'"')
			.replace(/#\{value\}/g, node.getComment())
		);
	}
	
	function checkValue (value) {
		if (value.trim().length<=0) return null;
		if (value.startsWith('(') && value.endsWith(')') ) return null;
		return value;
	}

	self.nodeCommand = function(command) {
		if (command.startsWith('property_change:')) {
			var propertyName = command.substring(16);
			var value = checkValue($('#'+(mID+"-property-"+propertyName)).val());
			mCurrentNode.setProperty(propertyName,value);
			self.showNodeProperties(mCurrentNode);
			return;
		}
		switch (command) {
			case 'comment' : 
				mCurrentNode.setComment($('#'+(mID+"-node-comment")).val());
				break;
				
			case 'name_change' : 
				mCurrentNode.setName($('#'+(mID+'-name')).val());
				break;
			case 'close_properties' : 
				mNodeDiv.hide();
				break;
			case 'info' : 
				sMainElementList.showHelp(mCurrentNode.getClassname());
				break;
			case 'graph' : 
				mRunControl.showPathFromNode(mCurrentNode);
				break;
			case 'forward' : 
				mRunControl.forwardToNode(self,mCurrentNode.getID());
				break;
			case 'delete' : 
				sMainConfirmationForm.show(function(){
					if (mCurrentNode!=null) mGraph.removeNode(mCurrentNode); },
					mCurrentNode.getName(), "Do you really want to delete this node?", "Delete");
				break;
		}
	}
		
	// ------------------------------------------------
	// Editing connection link 
	// ------------------------------------------------

	const mCONNECTION_HTML =
		// --- Header
		mCOLLAPSABLE_DIV.replace( /#\{label\}/g, (mID+'-connection_options_div'))
			.replace( /#\{name\}/g, sMainRes.getString('Connection') )+
		
/*		// --- Main
		'<div class="d-flex flex-column overflow-scroll mb-1" style="flex-grow:1; flex-basis:0;">'+
			'<div id="'+ mID+'-connection_link_div" class="h-100 overflow-scroll" style="flex-grow:1">'+
			'</div>'+
		'</div>'+
*/
		mCOLLAPSABLE_MIDDLE_DIV.replace( /#\{label\}/g, (mID+'-connection_link_div'))
			.replace( /#\{name\}/g, sMainRes.getString('Link') )+

		mCOLLAPSABLE_DIV.replace( /#\{label\}/g, (mID+'-connection_display_div'))
			.replace( /#\{name\}/g, sMainRes.getString('Display') )+
		mCOLLAPSABLE_DIV.replace( /#\{label\}/g, (mID+'-connection_comment_div'))
			.replace( /#\{name\}/g, sMainRes.getString('Comment') )+

		// --- Footer
		'<footer class="border-top border-dark  bg-light d-flex flex-row">'+
			'<div class="container-fluid p-0 justify-content-start" style="flex-grow:1">'+
			'</div>'+
			(mIsRunReplay ? '' :
			'<div class="container-fluid p2-2 justify-content-end" style="flex-grow:0; flex-basis:0">'+
				'<button class="btn btn-link p-0 text-decoration-none" type="button"'+
					'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'delete\')">'+
					'<i class="bi bi-x-square"></i>'+
				'</button>'+
			'</div>')+
		'</footer>';

	const mCONNECTION_NAME_LINE = 
		'<div class="mp-2 px-1">'+
			'<label id="#{label}_label" for="#{label}_name" class="mt-2 mb-0 fw-light form-label text-dark">#{name}</label>'+
			'<input disabled type="text" class="form-control" id="#{label}_name" aria-describedby="#{label}-label" value="#{value}">'+
		'</div>';

	const mCONNECTION_LINE = 
		'<div class="mp-2 px-1">'+
			'<label id="#{label}_label" for="#{label}_name" class="mt-2 mb-0 fw-light form-label text-dark">#{name}</label>'+
			'<select id="#{label}" class="text-primary form-select" aria-label="#{label}_property_label" '+
				'onchange="sMainCommandCenter.sendCommand(\''+ mID+'\',\'#{command}\')"  #{extras} >'+
			'</select>'+
		'</div>';
		
	const mCONNECTION_TRIGGER =
		'<div class="mp-2 px-1">'+
			'<label id="#{label}_label" for="#{label}" class="mt-2 mb-0 fw-light form-label text-dark">#{name}</label>'+
			'<select id="#{label}" class="text-primary form-select" aria-label="#{label}_label" '+
				'onchange="sMainCommandCenter.sendCommand(\''+ mID+'\',\'#{command}\')"  #{extras} >'+
			'</select>'+
			//'<input type="text" id="#{label}" aria-describedby="#{label}_label" ' +
			//	'onchange="sMainCommandCenter.sendCommand(\''+ mID+'\',\'#{command}\')" >'+
		'</div>';

	const mCONNECTION_TYPE_CHECK =
		'<div class="mp-2 px-1">'+
				'<button class="text-dark btn btn-link text-decoration-none" type="button"'+
					'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'#{command}\')">'+
					'#{name}<i class="mx-2 #{icon}" style="font-size: 1rem;"></i>'+
				'</button>'+
		'</div>';


	function nameListFromConstants(constantsList) {
		var nameList = [];
		constantsList.forEach(function(constant) {
			nameList.push({ 'name': constant, 'display' : constant });
		})
		return nameList;
	}
		
		
	function nameListFrom(node, propertyList, addTrueFalse, isInput) {
		const suffix = isInput ? ' &#8592; '+node.getName() : ' &#8594; '+node.getName();
		var nameList = [];
		propertyList.forEach(function(property) {
			if (addTrueFalse) {
				nameList.push({ 'name': property.name+" = true",  'display' : property.name+" = true" +suffix });
				nameList.push({ 'name': property.name+" = false", 'display' : property.name+" = false"+suffix });
			}
			else nameList.push({ 'name': property.name, 'display' : property.name +suffix });
		})
		return nameList;
	}

	function extractPropertyFromLink (value) {
		if (value.startsWith('(') && value.endsWith(')') ) return null;
		for (var i=0; i<value.length; i++) {
			var code = value.charCodeAt(i);
			if (code==8592 || code ==8594) return value.substring(0,i).trim();
		}
		return value;
	}

	function fillSelect(select, value, optionList, missingValue) {
		var valueFound = false;
		select.empty();
		optionList.sort(function (option1, option2) {
			return ('' + option1.attr).localeCompare(option2.attr);
		})
		optionList.forEach(function(option) {
			var optionValue = option;
			var optionDisplay = option;
			if ('name' in option) {
				optionValue = option.name;
				optionDisplay = option.display;
			}
			if (optionValue==value) {
				valueFound = true;
				select.append('<option selected>'+optionDisplay+'</option>')
			}
			else select.append('<option>'+optionDisplay+'</option>')
		});
		if (missingValue) {
			if (valueFound) select.prepend('<option style="color=grey;">'+missingValue+'</option>')
			else            select.prepend('<option style="color=grey;" selected>'+missingValue+'</option>')
		}
	}

	var mCurrentConnection = null;
	
	var mConnectionDiv  = jQuery("<div/>", {
		class: "sTabRight h-100 d-flex flex-column mx-auto d-none",
		style: "flex-grow:1;", 
		html: mCONNECTION_HTML}).appendTo(mCommonDiv);

	var mConnectionOptionsDiv = $('#'+ mID+'-connection_options_div');
	var mConnectionLinkDiv    = $('#'+ mID+'-connection_link_div');
	var mConnectionDisplayDiv = $('#'+ mID+'-connection_display_div');
	var mConnectionCommentDiv = $('#'+ mID+'-connection_comment_div');
	
	var typeCheck = "ok";

	self.showConnectionLink = function(connection) {
		if (connection==null) return self.showGraphOptions();
		mCurrentConnection = connection;
		mCurrentNode = null;
		
		mConnectionDiv.removeClass('d-none');
		mGraphDiv.addClass('d-none');
		//mRunControl.stop();
		mNodeDiv.addClass('d-none');

		mConnectionOptionsDiv.empty();
		mConnectionLinkDiv.empty();
		mConnectionDisplayDiv.empty();
		mConnectionCommentDiv.empty();
		
		var label = mID+"-connection-";
		var sourceNode = connection.getSourceNode();
		var targetNode = connection.getTargetNode();

		mConnectionOptionsDiv.append(mCONNECTION_NAME_LINE
			.replace( /#\{label\}/g, (label+'name') )
			.replace( /#\{name\}/g, sMainRes.getString('From &#8594; To')) // sMainRes.getString('Source node') )
			.replace( /#\{value\}/g, connection.toString() ));

		mConnectionOptionsDiv.append(mCHECK_FIELD.replace( /#\{label\}/g, (label+'required') )
			.replace( /#\{name\}/g, sMainRes.getString('Required to run target node') )
			.replace( /#\{command\}/g, 'is_required' )
			.replace( /#\{checked\}/g, connection.isRequiredToRunNode() ? 'checked' : '')
			.replace( /#\{extras\}/g, mDisabledStr));

		//mConnectionOptionsDiv.append('<div class="h-divider mb-0"></div>');

		//mConnectionLinkDiv.append(mMIDDLE_HEADER_LINE.replace( /#\{name\}/g, sMainRes.getString('Link') ));

		mConnectionLinkDiv.append(mCONNECTION_LINE.replace( /#\{label\}/g, (label+'source') )
			.replace( /#\{name\}/g, sMainRes.getString('Source value')) // sMainRes.getString('Source node') )
			.replace( /#\{command\}/g, 'source_property' )
			.replace( /#\{value\}/g, sourceNode.getName() )
			.replace( /#\{extras\}/g, mDisabledStr ) );
		fillSelect($('#'+label+'source'), connection.getSourceProperty(), 
			nameListFrom(sourceNode,sourceNode.getPropertiesWithAttribute('output'),false,true), "(none)"); // is input

		mConnectionLinkDiv.append(mCONNECTION_LINE.replace( /#\{label\}/g, (label+'target') )
			.replace( /#\{name\}/g, sMainRes.getString('Target value') ) // sMainRes.getString('Target node') )
			.replace( /#\{command\}/g, 'target_property' )
			.replace( /#\{value\}/g, targetNode.getName() )
			.replace( /#\{extras\}/g, mDisabledStr ) );
		fillSelect($('#'+label+'target'), connection.getTargetProperty(), 
			nameListFrom(targetNode,targetNode.getPropertiesWithAttribute('input'),false,false), "(none)"); // is output);

		// mConnectionLinkDiv.append('<div class="h-divider"></div>');

		mConnectionLinkDiv.append(mCHECK_FIELD.replace( /#\{label\}/g, (label+'clear') )
			.replace( /#\{name\}/g, sMainRes.getString('Clear link after running') )
			.replace( /#\{command\}/g, 'clear_link' )
			.replace( /#\{checked\}/g, connection.getClearLinkAfterRun() ? 'checked' : '')
			.replace( /#\{extras\}/g, mDisabledStr ) );

		if (connection.getSourceProperty()!=null && connection.getTargetProperty()!=null) {
			var iconCheck = "bi bi-question-square";
			if (typeCheck==="ok") iconCheck = "text-success bi bi-check-square-fill";
			else if (typeCheck==="error") iconCheck = "text-danger bi bi-x-square-fill";
			else if (typeCheck==="warning") iconCheck = "text-warning bi bi-dash-square-fill";
	
			mConnectionLinkDiv.append(mCONNECTION_TYPE_CHECK.replace( /#\{label\}/g, (label+'type_check') )
				.replace( /#\{name\}/g, sMainRes.getString('Type check') )
				.replace( /#\{command\}/g, 'type_check' )
				.replace( /#\{icon\}/g, iconCheck) );
		}
		

		var triggerList = [];
		sourceNode.getPropertiesWithAttribute('output').forEach(function(property) {
			if (sourceNode.isPropertyType(property,"Boolean")) triggerList.push(property);
		});
		if (triggerList.length>0) { // Only if source has boolean outputs
			mConnectionOptionsDiv.append(mCONNECTION_TRIGGER.replace( /#\{label\}/g, (label+'trigger') )
				.replace( /#\{name\}/g, sMainRes.getString('Active when') )
				.replace( /#\{command\}/g, 'trigger' )
				.replace( /#\{extras\}/g, mDisabledStr) );
			fillSelect($('#'+label+'trigger'), connection.getSourceTriggerBoolean(), 
				nameListFrom(sourceNode,triggerList,true,true), "(always)"); // is input);

			mConnectionOptionsDiv.append('<div class="h-divider"></div>');
		}
		
		//mConnectionOptionsDiv.append('<div class="h-divider"></div>');
		//mConnectionDisplayDiv.append(mMIDDLE_HEADER_LINE.replace( /#\{name\}/g, sMainRes.getString('Display') ));

		mConnectionDisplayDiv.append(mCONNECTION_TRIGGER.replace( /#\{label\}/g, (label+'display_style') )
			.replace( /#\{name\}/g, sMainRes.getString('Display style') )
			.replace( /#\{command\}/g, 'display_style' )
			.replace( /#\{extras\}/g, '' ) );
		
		fillSelect($('#'+label+'display_style'), connection.getDisplayStyle(), 
			nameListFromConstants(IODA_GRAPHICS.Constants.CONNECTION_DISPLAY_STYLES), "(default)");

		//mConnectionOptionsDiv.append('<div class="h-divider"></div>');
		
		mConnectionCommentDiv.append(mCOMMENT_LINE
			.replace(/#\{label\}/g,(mID+'-connection-comment'))
			.replace(/#\{name\}/g, sMainRes.getString('Comment')  )
			.replace(/#\{command\}/g, 'comment')
			.replace(/#\{extras\}/g, mDisabledStr+'rows="6" placeholder="'+sMainRes.getString('Optional comment here...')+'"')
			.replace(/#\{value\}/g, connection.getComment())
		);

	}

	self.connectionCommand = function(command) {
		console.log (mID+" processing connection command:"+command);
		var label = mID+"-connection-";
		switch (command) {
			case 'delete' : 
				sMainConfirmationForm.show(function(){
					if (mCurrentConnection!=null) mGraph.removeConnection(mCurrentConnection); },
						mCurrentConnection.toString(), "Do you really want to delete this connection?", "Delete");
				break;
			case 'source_property' :
				var prop = extractPropertyFromLink($('#'+label+'source').val());
				mCurrentConnection.setSourceProperty(prop);
				self.showConnectionLink(mCurrentConnection);
				break;
			case 'target_property' :
				var prop = extractPropertyFromLink($('#'+label+'target').val());
				mCurrentConnection.setTargetProperty(prop);
				self.showConnectionLink(mCurrentConnection);
				break;
			case 'trigger' :
				var trigger = extractPropertyFromLink($('#'+label+'trigger').val());
				mCurrentConnection.setSourceTriggerBoolean(trigger);
				break;
			case 'display_style' :
				var style = $('#'+label+'display_style').val();
				mCurrentConnection.setDisplayStyle(style);
				break;

			case 'is_required' :
				var required = document.getElementById(label+'required').checked
				mCurrentConnection.setRequiredToRunNode(required);
				break;
			case 'clear_link' :
				var clearLink = document.getElementById(label+'clear').checked
				mCurrentConnection.setClearLinkAfterRun(clearLink);
				break;

			case 'type_check' :
				if      (typeCheck==='ok')      typeCheck = 'warning';
				else if (typeCheck==='warning') typeCheck = 'error';
				else if (typeCheck==='error')   typeCheck = 'ok';
				self.showConnectionLink(mCurrentConnection);
				break;
			
			case 'comment' : 
				mCurrentConnection.setComment($('#'+(mID+"-connection-comment")).val());
				break;
		}
	} // end of connection command 

	// --------------------------
	// Commands
	// --------------------------

	self.render = function() {
		mGraph.render(); 
	}
	
	self.resized = function() {
		mGraph.render();
	}
	
	self.getCurrentNode = function() { return mCurrentNode; }
	
	self.getCurrentConnection = function() { return mCurrentConnection; }
	
	self.command = function(command) {
		if (self.getCurrentNode()!=null) self.nodeCommand(command);
		else if (self.getCurrentConnection()!=null) self.connectionCommand(command);
		else self.graphCommand(command);
	}

	// --------------------------
	// Start-up
	// --------------------------
	
	sMainCommandCenter.registerObject(mID,self);
	
	mGraph = IODA_GRAPH.createGraph(self, sMainElementList, mID+"-graph", mParent[0]);
	$('#'+mID+"-graph-panel").css("flex-grow", "1");
	mParent.find('svg')['0'].setAttribute('width', '');
	
	mGraph.setNodeSelectedAction(function(node) {
		if (node) {
			if (!mRunControl.isRunning()) node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_SELECTED);
			self.showNodeProperties(node);
		} 
	});

	mGraph.setNodeUnselectedAction(function(node) {
		if (node && !mRunControl.isRunning()) node.setNodeStatus(GRAPH_CONSTANTS.NODE_STATUS_NORMAL);
		self.showGraphOptions();

	});

	mGraph.setNodeAction(function(node) {
		if (node) {
			//node.setStatus(GRAPH_CONSTANTS.NODE_STATUS_SELECTED);
			mRunControl.showPathFromNode(node);
		}
		else if (!mRunControl.isRunning()) mGraph.clearPath(); 
	});

	mGraph.setConnectionSelectedAction(function(connection) {
		self.showConnectionLink(connection);
	});

	mGraph.setConnectionAction(function(connection) {
		if (connection) mGraph.removeConnection(connection);
	});

	mRunControl	= mIsRunReplay ? IODA_GRAPH.runReplay(mGraph) :IODA_GRAPH.runControl(mGraph);

	createGraphInterface();
	
	return self;
}


