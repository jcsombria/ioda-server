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
IODA_GUI.graphEditPage = function(mID, mTitle, mParent) {
	const GRAPH_CONSTANTS = IODA_GRAPH.Constants;
	var self = IODA_GUI.graphBasic(mID,mTitle,mParent, true); // true = editable
	
	// ------------------------------------------------
	// Editing graph display properties
	// ------------------------------------------------

	const graphEditOptionLabel = mID+"-edit_graph_option-";

	const mGRAPH_RUN_SERVER_HTML =
		'<span class="border-start border-danger border-4"></span>'+
		'<button class="btn btn-link p-0 ms-1 text-decoration-none" type="button"'+
			'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'run_at_server\')">'+
			'<i class="bi bi-arrow-right-square-fill"  style="font-size: 2rem;"></i>'+
		'</button>';

	(function() {
		self.getGraphFooterRightDiv().append(mGRAPH_RUN_SERVER_HTML);

		self.getGraphOptionsDiv().append(IODA_GUI.GRAPH.Constants.CHECK_FIELD
			.replace( /#\{label\}/g, (graphEditOptionLabel+'simulate_conditionals') )
			.replace( /#\{name\}/g, sMainRes.getString('Simulate conditionals') )
			.replace( /#\{command\}/g, 'simulate_conditionals' )
			.replace( /#\{extras\}/g, '')
			.replace( /#\{checked\}/g, self.getRunControl().getSimulateConditionals() ? 'checked' : ''));
		self.getGraphOptionsDiv().append(IODA_GUI.GRAPH.Constants.CHECK_FIELD
			.replace( /#\{label\}/g, (graphEditOptionLabel+'true_conditionals') )
			.replace( /#\{name\}/g, sMainRes.getString('Conditions are true/false') )
			.replace( /#\{command\}/g, 'true_conditionals' )
			.replace( /#\{extras\}/g, '')
			.replace( /#\{checked\}/g, self.getRunControl().getSimulateTrueConditionals() ? 'checked' : ''));
		self.getGraphOptionsDiv().append('<div class="h-divider"></div>');
	})();

	var super_fillGraphOptions = self.fillGraphOptions;

	self.fillGraphOptions = function() {
		$('#'+graphEditOptionLabel+'simulate_conditionals').prop('checked', self.getRunControl().getSimulateConditionals());
		$('#'+graphEditOptionLabel+'true_conditionals').prop('checked', self.getRunControl().getSimulateTrueConditionals());
		super_fillGraphOptions();
	}

	var super_graphCommand  = self.graphCommand;

	self.graphCommand = function(command) {
		switch (command) {
			case 'simulate_conditionals' :
				mRunControl.setSimulateConditionals($('#'+graphEditOptionLabel+command).prop('checked'));
				break;
			case 'true_conditionals' :
				mRunControl.setSimulateTrueConditionals($('#'+graphEditOptionLabel+command).prop('checked'));
				break;

			case 'run_at_server':
				mRunControl.showLastSimulationRun();
				return;
				if (mRunControl.isGraphIncomplete()) {
					sMainConfirmationForm.show(
						function() { sMainCommConnection.runGraph(mRunControl.getGraphRunData()); },
						mGraph.getName(), "The graph seems incomplete. Do you still want the server to run this graph?", "Run");
				}
				else sMainConfirmationForm.show(
						function() { sMainCommConnection.runGraph(mRunControl.getGraphRunData()); },
						mGraph.getName(), "The graph seems complete. Do you want the server to run this graph?", "Run");
				break;
				
			default : super_graphCommand(command); break;
		}
	} // end of graph options command 

	// ------------------------------------------------
	// Editing node properties 
	// ------------------------------------------------

	const mPROPERTIES_HTML =
		// --- Properties / Connections
		'<div class="sTabRight_header border border-dark bg-light p-2 d-flex flex-row" style="flex-grow:0; flex-basis:0">'+
			'<div class="sTabRight_header_title text-primary align-middle justify-content-center">'+
				sMainRes.getString('Node')+
			'</div>'+
		'</div>'+
		'<div class="d-flex flex-column" style="flex-grow:0; flex-basis:0;">'+
			'<div id="'+ mID+'-class_and_name_div" class="h-100" style="flex-grow:0; flex-basis:0;">'+
			'</div>'+
		'</div>'+
		// --- Main
		'<div class="d-flex flex-column overflow-scroll mb-1" style="flex-grow:1; flex-basis:0;">'+
			'<div id="'+ mID+'-properties_div" class="h-100 overflow-scroll" style="flex-grow:1">'+
			'</div>'+
		'</div>'+
		'<div class="sTabRight_header border border-dark p-2 bg-light d-flex flex-row" style="flex-grow:0; flex-basis:0">'+
			'<div class="sTabRight_header_title text-primary align-middle justify-content-center">'+
				sMainRes.getString('Comment')+
			'</div>'+
		'</div>'+
		'<div class="d-flex flex-column" style="flex-grow:0; flex-basis:0;">'+
			'<div id="'+ mID+'-node_comment_div" class="h-100" style="flex-grow:0; flex-basis:0;">'+
			'</div>'+
		'</div>'+
		// --- Footer
		'<footer class="border border-dark bg-light d-flex flex-row">'+
			'<div class="container-fluid p-0 justify-content-start" style="flex-grow:1">'+
				'<button class="btn btn-link p-0 text-decoration-none" type="button"'+
					'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'info\')">'+
					'<i class="bi bi-info-square"></i>'+
				'</button>'+
			(mIsRunReplay ? '' :
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

	const mINFO_LINE = 
		'<div class="mp-2 px-1">'+
				'<label id="#{label}-label" for="#{label}" class="fw-light mt-2 mb-0 form-label text-dark">#{name}</label>'+
				'<input type="text" class="text-primary form-control" id="#{label}" aria-describedby="#{label}-label" '+
				'value="#{value}" disabled>'+
		'</div>';

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

	var mPropertiesDiv  = jQuery("<div/>", {
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

		mPropertiesDiv.removeClass('d-none');
		mGraphDiv.addClass('d-none');
		//mRunControl.stop();
		mConnectionLinkDiv.addClass('d-none');

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
		//mPropertiesListDiv.append('<div class="h-divider"></div>');

		var label = mID+"-property-";
		var properties = node.getPropertiesWithAttribute('manual');
		node.getPropertiesWithAttribute('input').forEach(function(property) {
			if (properties.indexOf(property)<0) properties.push(property);
		});
		properties.sort(function (a, b) {
			return ('' + a.name.attr).localeCompare(b.name.attr);
		});
		
		if (properties.length>0)
			mPropertiesListDiv.append(mMIDDLE_HEADER_LINE.replace( /#\{name\}/g, sMainRes.getString('Properties') ));

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
				mPropertiesDiv.hide();
				break;
			case 'info' : 
				sMainElementList.showHelp(mCurrentNode.getClassname());
				break;
			case 'graph' : 
				mRunControl.showPathFromNode(mCurrentNode);
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
		'<div class="sTabRight_header border border-dark bg-light p-2 d-flex flex-row" style="flex-grow:0; flex-basis:0">'+
			'<div class="sTabRight_header_title text-primary align-middle justify-content-center">'+
				sMainRes.getString('Connection')+
			'</div>'+
		'</div>'+
		// --- Main
		'<div class="d-flex flex-column overflow-scroll" style="flex-grow:1; flex-basis:0;">'+
			'<div id="'+ mID+'-connection_options_div" class="h-100 overflow-scroll" style="flex-grow:1">'+
			'</div>'+
		'</div>'+
		'<div class="sTabRight_header border border-dark bg-light p-2 d-flex flex-row" style="flex-grow:0; flex-basis:0">'+
			'<div class="sTabRight_header_title text-primary align-middle justify-content-center">'+
				sMainRes.getString('Comment')+
			'</div>'+
		'</div>'+
		'<div class="d-flex flex-column" style="flex-grow:0; flex-basis:0;">'+
			'<div id="'+ mID+'-connection_comment_div" class="h-100" style="flex-grow:0; flex-basis:0;">'+
			'</div>'+
		'</div>'+
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
	
	var mConnectionLinkDiv  = jQuery("<div/>", {
		class: "sTabRight h-100 d-flex flex-column mx-auto d-none",
		style: "flex-grow:1;", 
		html: mCONNECTION_HTML}).appendTo(mCommonDiv);

	var mConnectionOptionsDiv = $('#'+ mID+'-connection_options_div');
	var mConnectionCommentDiv = $('#'+ mID+'-connection_comment_div');
	
	var typeCheck = "ok";

	self.showConnectionLink = function(connection) {
		if (connection==null) return self.showGraphOptions();
		mCurrentConnection = connection;
		mCurrentNode = null;
		
		mConnectionLinkDiv.removeClass('d-none');
		mGraphDiv.addClass('d-none');
		//mRunControl.stop();
		mPropertiesDiv.addClass('d-none');

		mConnectionOptionsDiv.empty();
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

		mConnectionOptionsDiv.append(mMIDDLE_HEADER_LINE.replace( /#\{name\}/g, sMainRes.getString('Link') ));

		mConnectionOptionsDiv.append(mCONNECTION_LINE.replace( /#\{label\}/g, (label+'source') )
			.replace( /#\{name\}/g, sMainRes.getString('Source value')) // sMainRes.getString('Source node') )
			.replace( /#\{command\}/g, 'source_property' )
			.replace( /#\{value\}/g, sourceNode.getName() )
			.replace( /#\{extras\}/g, mDisabledStr ) );
		fillSelect($('#'+label+'source'), connection.getSourceProperty(), 
			nameListFrom(sourceNode,sourceNode.getPropertiesWithAttribute('output'),false,true), "(none)"); // is input

		mConnectionOptionsDiv.append(mCONNECTION_LINE.replace( /#\{label\}/g, (label+'target') )
			.replace( /#\{name\}/g, sMainRes.getString('Target value') ) // sMainRes.getString('Target node') )
			.replace( /#\{command\}/g, 'target_property' )
			.replace( /#\{value\}/g, targetNode.getName() )
			.replace( /#\{extras\}/g, mDisabledStr ) );
		fillSelect($('#'+label+'target'), connection.getTargetProperty(), 
			nameListFrom(targetNode,targetNode.getPropertiesWithAttribute('input'),false,false), "(none)"); // is output);

		// mConnectionOptionsDiv.append('<div class="h-divider"></div>');

		mConnectionOptionsDiv.append(mCHECK_FIELD.replace( /#\{label\}/g, (label+'clear') )
			.replace( /#\{name\}/g, sMainRes.getString('Clear link after running') )
			.replace( /#\{command\}/g, 'clear_link' )
			.replace( /#\{checked\}/g, connection.getClearLinkAfterRun() ? 'checked' : '')
			.replace( /#\{extras\}/g, mDisabledStr ) );

		if (connection.getSourceProperty()!=null && connection.getTargetProperty()!=null) {
			var iconCheck = "bi bi-question-square";
			if (typeCheck==="ok") iconCheck = "text-success bi bi-check-square-fill";
			else if (typeCheck==="error") iconCheck = "text-danger bi bi-x-square-fill";
			else if (typeCheck==="warning") iconCheck = "text-warning bi bi-dash-square-fill";
	
			mConnectionOptionsDiv.append(mCONNECTION_TYPE_CHECK.replace( /#\{label\}/g, (label+'type_check') )
				.replace( /#\{name\}/g, sMainRes.getString('Type check') )
				.replace( /#\{command\}/g, 'type_check' )
				.replace( /#\{icon\}/g, iconCheck) );
		}
		
		//mConnectionOptionsDiv.append('<div class="h-divider"></div>');
		mConnectionOptionsDiv.append(mMIDDLE_HEADER_LINE.replace( /#\{name\}/g, sMainRes.getString('Display') ));

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
		
		mConnectionOptionsDiv.append(mCONNECTION_TRIGGER.replace( /#\{label\}/g, (label+'display_style') )
			.replace( /#\{name\}/g, sMainRes.getString('Display style') )
			.replace( /#\{command\}/g, 'display_style' )
			.replace( /#\{extras\}/g, '' ) );
		
		fillSelect($('#'+label+'display_style'), connection.getDisplayStyle(), 
			nameListFromConstants(IODA_GRAPHICS.Constants.CONNECTION_DISPLAY_STYLES), "(default)");

		mConnectionOptionsDiv.append('<div class="h-divider"></div>');
		
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
		else self.graphOptionsCommand(command);
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

	if (!mIsRunReplay) mRunControl = IODA_GRAPH.runControl(mGraph);
	
	return self;
}


