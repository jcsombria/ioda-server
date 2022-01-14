/*
 * Copyright (C) 2021 Francisco Esquembre 
 * This code is part of the Fusion IODA project
 */
/**
 * GUI tools
 * @module core
 */
var IODA_GUI = IODA_GUI || {};

IODA_GUI.element_editor = function() {
	var self = {};
	var mLocalClipboard = [];

	/*
		helper function to fill the location select with the elements 
		(fully described in the elementList) within the given 
		selectedGroup, with a type different from the existingElementType
	*/
	function fillElementList(groupSelected, existingElementType, elementList) {
		if (groupSelected.elements.length<=0) { 
			$('#mElementEditorLocationAsIs').prop("checked", true);
			$("#mElementEditorLocation input[type='radio']").prop("disabled", true);
			$('#mElementEditorLocationList').html("");
			return; 
		}
		$("#mElementEditorLocation input[type='radio']").prop("disabled", false);
		$("#mElementEditorLocationList").prop("disabled", false);
		var optionsHTML = "";
		var found=false;
		var lastType=null;
		groupSelected.elements.forEach(function(type) {
			var element = elementList.elements[type];
			if (element==null) return;
			if (existingElementType==null || existingElementType!=type) {
				optionsHTML += '<option value="'+type+'">'+element.name+'</option>';	
				lastType = type;
	    }
			else found = true;
		});
		if (optionsHTML.length<=0) {
			$('#mElementEditorLocationAsIs').prop("checked", true);
			//$("#mElementEditorLocation input[type='radio']").prop("checked", false);	does not work
			$("#mElementEditorLocation input[type='radio']").prop("disabled", true);				
		}
		$('#mElementEditorLocationList').html(optionsHTML);
		if (found) $('#mElementEditorLocationAsIs').prop("checked", true);
		else { 
			$('#mElementEditorLocationAfter').prop("checked", true);
			$('#mElementEditorLocationAsIs').prop("disabled", true);
		}	
		if (lastType!=null) $('#mElementEditorLocationList option[value='+lastType+']').attr("selected", true);
	};

	/*
		Helper function to get a select with the list of groups. 
		If elementType is in one of them, this groups will be initially selected
	 */
	function getGroupsHTML(existingUserGroups, elementType) {
		var html = 
			//'<div class="input-group mb-3">'+
			//	'<span class="input-group-text" id="mElementEditorGroupsLabel">'+sMainRes.getString("In group")+'</span>'+
		  	'<select class="form-select" id="mElementEditorGroupsList">';
			existingUserGroups.forEach(function(group,index) {
				var selected = false;
				if (elementType!=null) selected = group.elements.includes(elementType);
				else selected = (index==0);
				html += '<option '+ (selected ? ' selected ' : '') + 'value="'+group.name+'">'+group.name+'</option>';
			});
		html += '</select>'
			//+ '</div>';		
		return html;
	}

	/*
		Helper function to get a select with the list of groups. 
		If elementType is in one of them, this groups will be initially selected
	 */
	function getLocationHTML(elementType) {
		var html = 
			//'<div >'+
			//	'<label class="form-label">'+sMainRes.getString("Place it")+'</label>'+
			//	getGroupsHTML(existingUserGroups, elementType)+
				'<div class="input-group-text" id="mElementEditorLocation">';
		if (elementType!=null) html += 
			  	'<span class="form-check form-check-inline">'+
			  		'<input class="form-check-input" type="radio" checked '+
			 				'name="mElementEditorLocationOptions" id="mElementEditorLocationAsIs" value="as_is">'+
			  		'<label class="form-check-label" for="mElementEditorLocationAsIs">'+sMainRes.getString("As is")+'</label>'+
			  	'</span>';
		html += 
			  	'<span class="form-check form-check-inline">'+
			  		'<input class="form-check-input" type="radio" '+
			 				'name="mElementEditorLocationOptions" id="mElementEditorLocationBefore" value="before">'+
			  		'<label class="form-check-label" for="mElementEditorLocationBefore">'+sMainRes.getString("Before")+'</label>'+
			  	'</span>'+
			  	'<span class="form-check form-check-inline">'+
			  		'<input class="form-check-input" type="radio" ' + (elementType!=null ? ' checked ' : '')+
			 			  'name="mElementEditorLocationOptions" id="mElementEditorLocationAfter" value="after">'+
			  		'<label class="form-check-label" for="mElementEditorLocationAfter">'+sMainRes.getString("After")+'</label>'+
			  	'</span>'+
		  	'<select class="form-select" id="mElementEditorLocationList">';
		html += ''+
					'</select>'+
				//'</div>'+
			'</div>';
		return html;
	}

	// ------------------------------------------------------------------
	// Helper functions for dealing with the properties table
	// ------------------------------------------------------------------
	
	function isAttribute(attribute,type) {
		var types = attribute.split('|');
		return (types.indexOf(type)>=0);
	}

	function createOnePropertyLine(property,disabledTAG) {
		if (property==null) property = { 'name' : '', 'local_name' : '', 'type' : '', 'attributes' : ''};
		const attr = property['attributes'];
		return ''+
			'<tr>'+
				'<td><input type="checkbox" '+disabledTAG+'/></td>'+
        '<td><input class="col-12" type="text" value="'+property['name']+'" '+disabledTAG+'/></td>'+
        '<td><input class="col-12" type="text" value="'+property['local_name']+'" '+disabledTAG+'/></td>'+
        '<td><input class="col-12" type="text" value="'+property['type']+'" '+disabledTAG+'/></td>'+
				'<td><input type="checkbox" '+ (isAttribute(attr,'required') ? 'checked' : '')+disabledTAG+'/></td>'+
				'<td><input type="checkbox" '+ (isAttribute(attr,'manual')   ? 'checked' : '')+disabledTAG+'/></td>'+
				'<td><input type="checkbox" '+ (isAttribute(attr,'input')    ? 'checked' : '')+disabledTAG+'/></td>'+
				'<td><input type="checkbox" '+ (isAttribute(attr,'output')   ? 'checked' : '')+disabledTAG+'/></td>'+
		'</tr>';
	}
			
	function getPropertyFromRow(row) {
		var name = row.cells[1].children[0].value;
		if (name.trim().length<=0) return null;
		var property =  { 'name' : name };
		property['local_name'] = row.cells[2].children[0].value;
		property['type']       = row.cells[3].children[0].value;
		var attr = '';
		if (row.cells[4].children[0].checked) attr += 'required|';
		if (row.cells[5].children[0].checked) attr += 'manual|';
		if (row.cells[6].children[0].checked) attr += 'input|';
		if (row.cells[7].children[0].checked) attr += 'output|';
		if (attr.endsWith('|')) attr = attr.slice(0,-1);
		property['attributes'] = attr;
		return property;
	}

	function getProperties(tBody) {
		var properties = [];
		for (var i = 0, row; row = tBody.rows[i]; i++) {
			var prop = getPropertyFromRow(row);
			if (prop!=null) properties.push(prop);
		}
		return properties;
	}
	
	function propertiesMenuAction(table, action) {
		var tBody = table.getElementsByTagName('tbody')[0];
		var selection = [];
		for (var i = 0, row; row = tBody.rows[i]; i++) {
			if (row.cells[0].children[0].checked) selection.push(i);
		};
		var index;
		switch (action) {
			case "InsertBefore" :
				index = (selection.length>0) ? selection[0] : 0;
				if (mLocalClipboard.length>0) {
					for (var i=0; i<mLocalClipboard.length; i++) {
						tBody.insertRow(index).innerHTML = mLocalClipboard[i];	
					}
				}
				else tBody.insertRow(index).innerHTML = createOnePropertyLine(null);
				break;
			case "InsertAfter" :
				index = (selection.length>0) ? selection[selection.length-1]+1 : tBody.rows.length;
				if (mLocalClipboard.length>0) {
					for (var i=0; i<mLocalClipboard.length; i++) {
						tBody.insertRow(index).innerHTML = mLocalClipboard[i];	
					}
				}
				else tBody.insertRow(index).innerHTML = createOnePropertyLine(null);
				break;
			case "Cut" : case "Copy" :
				mLocalClipboard = [];
				for (var i=selection.length-1; i>=0; i--) {	
					mLocalClipboard.push(tBody.rows[selection[i]].innerHTML);
					if (action=="Cut") tBody.deleteRow(selection[i]);
				}
				break;	
			case "Delete" :
				for (var i=selection.length-1; i>=0; i--) {	
					tBody.deleteRow(selection[i]);
				}
				break;	
		}
	}
	
	self.showEditor = function(mElementType, mProjectElementList, mUserElementList, mListener, mIsUserElement) {
		const isNewElement = (mElementType==null);
		const elementToEdit = isNewElement ? null : 
						(mIsUserElement ? mUserElementList.elements[mElementType] : mProjectElementList.elements[mElementType]);	
		
		const existingUserGroups = mUserElementList.groups;
		const elementTypeForLocation = (mIsUserElement ? mElementType : null)
		const canBeEdited = true || mIsUserElement;
		const disabledTAG = (canBeEdited ? '' : ' disabled ');

		var BASIC_HTML = isNewElement ?  
			'<div class="input-group mb-3 mt-3">'+
				'<span class="input-group-text" id="mElementEditorNameLabel">'+sMainRes.getString("Name")+'</span>'+
				'<input type="text" class="form-control" id="mElementEditorNameField" '+ 
					'placeholder="Element name here" aria-label="Element name" aria-describedby="mElementEditorNameLabel">'+
			'</div>'+
			'<div class="input-group mb-3 mt-3">'+
				'<span class="input-group-text" id="mElementEditorDescriptionLabel">'+sMainRes.getString("Description")+'</span>'+
				'<input type="text" class="form-control" id="mElementEditorDescriptionField" '+
					'placeholder="Element description here" aria-label="Element description" aria-describedby="mElementEditorDescriptionLabel">'+
			'</div>'+
			'<div class="input-group mb-0">' +
				'<label class="input-group-text" for="mElementEditorIconField" class="form-label">'+sMainRes.getString("Image")+'</label>'+
				'<label class="input-group-text bg-white" for="mElementEditorIconField" id="mElementEditorIconButton">'+
					'<img id="mElementEditorIconImage" width="128" height="128" '+
					'>'+
				'</label>'+
			'</div>'+
			'<div class="input-group mb-3 mt-0">'+
				'<input class="form-control" accept="image/*"  id="mElementEditorIconField" type="file">'+
			'</div>'+ 
			'<div class="input-group mb-0 mElementEditorLocationDiv">'+
				'<span class="input-group-text">'+sMainRes.getString("Location")+'</span>'+
				getGroupsHTML(existingUserGroups, null)+
			'</div>'+	
			'<div class="input-group mt-0 mb-3 mElementEditorLocationDiv">'+
				getLocationHTML(null) +
			'</div>'
		:
			'<div class="input-group mb-3 mt-3">'+
				'<span class="input-group-text" id="mElementEditorNameLabel">'+sMainRes.getString("Name")+'</span>'+
				'<input type="text" class="form-control" id="mElementEditorNameField" '+ disabledTAG +
					' value="'+elementToEdit.name+'" ' +
					'placeholder="Element name here" aria-label="Element name" aria-describedby="mElementEditorNameLabel">'+
			'</div>'+
			'<div class="input-group mb-3 mt-3">'+
				'<span class="input-group-text" id="mElementEditorDescriptionLabel">'+sMainRes.getString("Description")+'</span>'+
				'<input type="text" class="form-control" id="mElementEditorDescriptionField" '+ disabledTAG +
					' value="'+elementToEdit.description+'" ' +
					'placeholder="Element description here" aria-label="Element description" aria-describedby="mElementEditorDescriptionLabel">'+
			'</div>'+
			'<div class="input-group '+(canBeEdited ? 'mb-0' : 'mb-3')+'">'+
				'<label class="input-group-text" for="mElementEditorIconField" class="form-label">'+sMainRes.getString("Image")+'</label>'+
				'<label class="input-group-text bg-white" for="mElementEditorIconField" id="mElementEditorIconButton">'+
					'<img id="mElementEditorIconImage" width="128" height="128" '+
						(elementToEdit.image ? ' src="'+sMainGetServerURL(elementToEdit.image)+'" ' : '') +'>'+
				'</label>'+
			'</div>'+
			(canBeEdited ? 
			'<div class="input-group mb-3 mt-0">'+
				'<input class="form-control" accept="image/*"  id="mElementEditorIconField" type="file">'+
			'</div>' 
			: '') +
			(mIsUserElement ? '':
				'<div class="form-check mb-3">'+
				  '<input class="form-check-input" type="checkbox" value="" '+
				 		' name="mElementEditorSaveAsNew" id="mElementEditorSaveAsNew">'+
				  '<label class="form-check-label" for="mElementEditorSaveAsNew">'+sMainRes.getString("Save as a new user element")+'</label>'+
				'</div>'
			)+
			'<div class="input-group mb-0 mElementEditorLocationDiv">'+
				'<span class="input-group-text">'+sMainRes.getString("Location")+'</span>'+
				getGroupsHTML(existingUserGroups, elementTypeForLocation)+
			'</div>'+	
			'<div class="input-group mt-0 mb-3 mElementEditorLocationDiv">'+
				getLocationHTML(elementTypeForLocation) +
			'</div>'+	
			(mIsUserElement ? 
			'<div class="form-check mb-3">'+
			  '<input class="form-check-input" type="checkbox" value="" '+
			 		' name="mElementEditorSaveAsNew" id="mElementEditorSaveAsNew">'+
			  '<label class="form-check-label" for="mElementEditorSaveAsNew">'+sMainRes.getString("Save as a new user element")+'</label>'+
			'</div>'+
			'<div class="input-group mb-3">'+
				'<button type="button" class="w-100 btn btn-danger" data-final_action="Delete">'+sMainRes.getString("Delete element")+'</button>'+
			'</div>' 
			: '')
		;

		var USAGE_HTML =
			'<div mt-2 >'+
				'Usage of element'+
			'</div>'
			;
			
		var PROPERTIES_HTML =
			'<div>'+
				'<div id="mElementEditorPropertiesEditor">'+// style="min-height:'+MIN_HEIGHT+'px; max-height:'+MIN_HEIGHT+'px;">'+
					'<table id="mElementEditorPropertiesTable" class="table table-sm small" >'+ //  style="overflow-y: auto;max-height:'+MIN_HEIGHT+'px;"'+
						'<thead class="table-primary">'+
							'<tr>'+
								'<th scope="col">'+
									'<div class="dropdown">'+
										'<button '+
											'class="btn btn-link text-decoration-none dropdown-toggle" '+
											'style="padding:0px 5px 0px 0px; border:0px; "'+
											'type="button" '+ disabledTAG +
											'id="mElementEditorPropertiesTableOptions" '+
											'data-bs-toggle="dropdown" '+
											'aria-expanded="false">'+
										'</button>'+
										'<ul class="dropdown-menu" '+
											'aria-labelledby="mElementEditorPropertiesTableOptions">'+
											'<li class="dropdown-item mElementEditorPropertiesTableOption" data-action="InsertBefore">'+sMainRes.getString("Insert before")+'</li>'+
											'<li class="dropdown-item mElementEditorPropertiesTableOption" data-action="InsertAfter" >'+sMainRes.getString("Insert after") +'</li>'+
											'<li><hr class="dropdown-divider"></li>'+
											'<li class="dropdown-item mElementEditorPropertiesTableOption" data-action="Copy"        >'+sMainRes.getString("Copy")   +'</li>'+
											'<li class="dropdown-item mElementEditorPropertiesTableOption" data-action="Cut"         >'+sMainRes.getString("Cut")    +'</li>'+
											'<li><hr class="dropdown-divider"></li>'+
											'<li class="dropdown-item mElementEditorPropertiesTableOption" data-action="Delete"      >'+sMainRes.getString("Delete") +'</li>'+
										'</ul>'+
									'</div>'+
								'</th>'+
								'<th scope="col">'+sMainRes.getString("Property")+'</th>'+
								'<th scope="col">'+sMainRes.getString("Label")+'</th>'+
								'<th scope="col">'+sMainRes.getString("Type")+'</th>'+
								'<th scope="col">'+sMainRes.getString("R")+'</th>'+
								'<th scope="col">'+sMainRes.getString("M")+'</th>'+
								'<th scope="col">'+sMainRes.getString("I ")+'</th>'+
								'<th scope="col">'+sMainRes.getString("O")+'</th>'+
							'</tr>'+
						'</thead>'+
						'<tbody id="mElementEditorPropertiesTableBody">'
		;
		if (!isNewElement) {
			for (var index in elementToEdit['properties']) PROPERTIES_HTML += createOnePropertyLine(elementToEdit['properties'][index],disabledTAG);
		};
		
		PROPERTIES_HTML +=
						'</tbody>'+
					'</table>'+
				'</div>'+
			'</div>'
			;

		var CODE_HTML =
			'<div>'+
				'<div class="input-group mb-3 mt-3">'+
					'<span class="input-group-text" id="mElementEditorProgrammingLanguageLabel">'+sMainRes.getString("Programming language")+'</span>'+
				  '<select class="form-select" id="mElementEditorProgrammingLanguageList" '+disabledTAG+'>'+
						'<option value="python">Python</option>'+
						'<option value="c_cpp">C-C++</option>'+
						'<option value="fortran">Fortran</option>'+
						'<option value="matlab">Matlab</option>'+
					'</select>'+
				'</div>'+
				'<div id="mElementEditorCodeEditor" class="ace" style="min-height:1000px;" '+
				'	data-language="'+(isNewElement ? 'python' : elementToEdit.language)+'" '+
				'>'+
					(isNewElement ? '' : elementToEdit.code)+
				'</div>'+
			'</div>'
			;

		var HELP_HTML = (canBeEdited ? 
			'<div>'+ 
				'<textarea id="mElementEditorHelpEditor" class="sun-editor-editable">'+
					(isNewElement ? '' : elementToEdit.help) +
				'</textarea>'+
			'</div>'
			:
			'<div mt-2 id="mElementEditorHelpViewer">'+ //'style="min-height:'+(MIN_HEIGHT+70)+'px;">'+
					elementToEdit.help +
			'</div>'
			);

		const MODAL_HTML =   
			'<div class="modal-dialog modal-fullscreen modal-dialog-centered modal-dialog-scrollable">'+
				'<div id="mElementEditorContent" class="modal-content">'+ //(mOptions.properties_html==null ? '' : ' style="min-height:600px"')+'>'+
					'<div class="modal-header">'+
						'<h5 class="modal-title">'+ sMainRes.getString('Edit element')+'</h5>'+
						'<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>'+
					'</div>'+
					'<div class="modal-body">'+
						'<ul class="nav nav-tabs" id="mElementEditorTabs" role="tablist">'+
			  			'<li class="nav-item" role="presentation">'+
       					'<button class="nav-link active" id="mElementEditorBasicTab" '+
			 				  	'data-bs-toggle="tab" data-bs-target="#mElementEditorBasicDiv" '+ 
       					  'type="button" role="tab" aria-controls="mElementEditorBasicDiv" aria-selected="true">'+
										sMainRes.getString('Basic')+
       					'  </button>'+
      				'</li>'+
							(isNewElement ? '' : 
			  			'<li class="nav-item" role="presentation">'+
       					'<button class="nav-link" id="mElementEditorUsageTab" '+
			 				  	'data-bs-toggle="tab" data-bs-target="#mElementEditorUsageDiv" '+ 
       					  'type="button" role="tab" aria-controls="mElementEditorUsageDiv" aria-selected="true">'+
										sMainRes.getString('Usage')+
       					'  </button>'+
      				'</li>')+
			  			'<li class="nav-item" role="presentation">'+
       					'<button class="nav-link" id="mElementEditorPropertiesTab" '+
			 				  	'data-bs-toggle="tab" data-bs-target="#mElementEditorPropertiesDiv" '+ 
       					  'type="button" role="tab" aria-controls="mElementEditorPropertiesDiv" aria-selected="true">'+
										sMainRes.getString('Properties')+
       					'  </button>'+
      				'</li>'+
			  			'<li class="nav-item" role="presentation">'+
       					'<button class="nav-link" id="mElementEditorCodeTab" '+
			 				  	'data-bs-toggle="tab" data-bs-target="#mElementEditorCodeDiv" '+ 
       					  'type="button" role="tab" aria-controls="mElementEditorCodeDiv" aria-selected="true">'+
										sMainRes.getString('Code')+
       					'  </button>'+
      				'</li>'+
			  			'<li class="nav-item" role="presentation">'+
       					'<button class="nav-link" id="mElementEditorHelpTab" '+
			 				  	'data-bs-toggle="tab" data-bs-target="#mElementEditorHelpDiv" '+ 
       					  'type="button" role="tab" aria-controls="mElementEditorHelpDiv" aria-selected="true">'+
										sMainRes.getString('Help')+
       					'  </button>'+
      				'</li>'+
       			'</ul>'+
			 			'<div class="tab-content" id="mElementEditorTabsContent">'+
			 		  	'<div class="tab-pane fade show active" id="mElementEditorBasicDiv" '+
			 			  	'role="tabpanel" aria-labelledby="mElementEditorBasicTab">'+
				 				BASIC_HTML+
			 		  	'</div>'+
							(isNewElement ? '' : 
			 		  	'<div class="tab-pane fade show" id="mElementEditorUsageDiv" '+
			 			   'role="tabpanel" aria-labelledby="mElementEditorUsageTab">'+
								USAGE_HTML+
			 		  	'</div>')+
			 		  	'<div class="tab-pane fade show" id="mElementEditorPropertiesDiv" '+
			 			   'role="tabpanel" aria-labelledby="mElementEditorPropertiesTab">'+
								PROPERTIES_HTML+
			 		  	'</div>'+
			 		  	'<div class="tab-pane fade show" id="mElementEditorCodeDiv" '+
			 			   'role="tabpanel" aria-labelledby="mElementEditorCodeTab">'+
								CODE_HTML+
			 		  	'</div>'+
			 		  	'<div class="tab-pane fade show" id="mElementEditorHelpDiv" '+
			 			   'role="tabpanel" aria-labelledby="mElementEditorHelpTab">'+
								HELP_HTML+
			 		  	'</div>'+
						'</div>'+
					'</div>'+
					'<div class="modal-footer">'+
						'<button type="button" class="btn btn-secondary" data-final_action="Close">'+sMainRes.getString("Close")+'</button>'+
						'<button type="button" class="btn btn-primary"   data-final_action="Apply">'+sMainRes.getString("Apply")+'</button>'+
					'</div>'+
				'</div>'+
			'</div>';
			 
		$('#sMainElementEditorModal').html(MODAL_HTML);
		var modal = new bootstrap.Modal(document.getElementById('sMainElementEditorModal'));
		var aceEditor=null, helpEditor=null;

		// -----------------------
		// Now set all the events
		// -----------------------
		
		// --- Events and configuration for the basic tab
		
		$('#mElementEditorIconField').on('change', function(event) {
			$('#mElementEditorIconImage').attr("src",URL.createObjectURL(event.target.files[0]));
		});

		$('#mElementEditorGroupsList').on('change', function(){
			var groupName = $('#mElementEditorGroupsList option:selected').val();
			for (var i=0; i<existingUserGroups.length; i++) {
				if (existingUserGroups[i].name==groupName) { 
					fillElementList(existingUserGroups[i], elementTypeForLocation, mUserElementList); 
					break; 
				}
			}
		});

		if (!isNewElement && mIsUserElement) {
			for (var i=0; i<existingUserGroups.length; i++) {
				if (existingUserGroups[i].elements.includes(mElementType)) { 
					fillElementList(existingUserGroups[i], mElementType, mUserElementList);
					break;
				}	
			}
		}
		else {
			var groupName = $('#mElementEditorGroupsList option:selected').val();
			for (var i=0; i<existingUserGroups.length; i++) {
				if (existingUserGroups[i].name == groupName) { 
					fillElementList(existingUserGroups[i], elementTypeForLocation, mUserElementList);
					break;
				}
			}
		}

		if (!canBeEdited) { 
			$('.mElementEditorLocationDiv').hide();
			$('#mElementEditorSaveAsNew').on('change', function(){
				const checked = $('#mElementEditorSaveAsNew').is(":checked");
				if (checked) $('.mElementEditorLocationDiv').show();
				else $('.mElementEditorLocationDiv').hide();
			});
		}	

	  $('#mElementEditorContent button').click(function(event) {
			const action = event.currentTarget.dataset.final_action;
			if (!action) return;
			switch(action) {
				case 'Delete' : 
					modal.hide();
					mListener('Delete', { 'is_project_element' : !mIsUserElement });
					break;
				case 'Close' : 
					modal.hide(); 
					break;
				case 'Apply' : 
					var name = $('#mElementEditorNameField').val().trim();
					if (name.length<=0) {
						sMainMessageForm.show('Error','Element name not specified','Ok');
						return;
					}
					modal.hide(); 
					var options = { }
					options['is_project_element'] = !mIsUserElement;
					options['name'] = name;
					options['description'] = $('#mElementEditorDescriptionField').val();
					
					options['duplicate'] = false;
					if ($('#mElementEditorSaveAsNew').length) {
						options['duplicate'] = $('#mElementEditorSaveAsNew').is(":checked");
					} 
					
					options['in_group'] = $('#mElementEditorGroupsList option:selected').val();
					var locationChecked = $('input[name=mElementEditorLocationOptions]:checked');
					options['relative_position'] = (locationChecked.length>0) ?  locationChecked.val() : 'as_is';
					var objectSelected = $('#mElementEditorLocationList option:selected');
				  options['relative_object'] = (objectSelected.length>0) ?  objectSelected.val() : '';

					options['properties'] = getProperties(document.getElementById('mElementEditorPropertiesTableBody'));
					options['language'] = $('#mElementEditorProgrammingLanguageList option:selected').val();
					options['code']     = aceEditor.getValue();
					if (canBeEdited) options['help'] = helpEditor.getContents();
					else 						 options['help'] = $('#mElementEditorHelpViewer').html();

					options['base64Icon']  ='';
					if (canBeEdited && $('#mElementEditorIconField').val().trim().length>0) 
						options['base64Icon'] = IODA_GUI.getBase64("mElementEditorIconImage");					

					mListener(action,options);
					break;
			}
		});	

		// --- Events and configuration for the properties tab

		$('.mElementEditorPropertiesTableOption').click(function(event) {
			propertiesMenuAction(event.target.closest('table'),event.target.dataset.action); 
		});

		// --- Events and configuration for the code tab


		$('#mElementEditorProgrammingLanguageList option[value="'+language+'"]').attr('selected', true);

		$('#mElementEditorProgrammingLanguageList').on('change', function(){
			var language = $('#mElementEditorProgrammingLanguageList option:selected').val();
			aceEditor.session.setMode("ace/mode/"+language);
		}); 
	
		var language = $('#mElementEditorCodeEditor').data('language');

		aceEditor = ace.edit("mElementEditorCodeEditor");
		aceEditor.setTheme("ace/theme/xcode");
		aceEditor.session.setMode("ace/mode/"+language);
		aceEditor.resize();
		aceEditor.setReadOnly(!canBeEdited);


		// --- Events and configuration for the help tab
		if (canBeEdited) helpEditor = SUNEDITOR.create(document.getElementById('mElementEditorHelpEditor'),{
			// All of the plugins are loaded in the "window.SUNEDITOR" object in dist/suneditor.min.js file
			// Insert options
			// Language global object (default: en)
			//height: 490,	
			buttonList: [
	        ['undo', 'redo'],
	       
	        ['bold', 'underline', 'italic', ':t-More Text-default.more_text', 'strike', 'subscript', 'superscript' ],
	        ['formatBlock', 'list', 'fontColor', 'horizontalRule', ':p-More Paragraph-default.more_paragraph', 'font', 'fontSize', 'hiliteColor', 'textStyle', 'align', 'lineHeight',  'paragraphStyle', 'blockquote'],
	                    
	        ['removeFormat'],
	       // '/', // Line break
	        ['outdent', 'indent'],
	        ['link', 'image', ':r-More Rich-default.more_plus', 'table', 'video', 'audio' /** ,'math' */], // You must add the 'katex' library at options to use the 'math' plugin.
	        ['codeView', ':v-View-text.View','fullScreen', 'showBlocks',  'preview']
	    ]
		});

		// --- Done. Show the modal

		modal.show();
	}

	// -------------------------------------------------------
	// Final initialization
	// -------------------------------------------------------

	return self;
}

 
 
