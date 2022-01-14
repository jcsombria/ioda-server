/*
 * Copyright (C) 2021 Francisco Esquembre 
 * This code is part of the Fusion IODA project
 */
/**
 * GUI tools
 * @module core
 */
var IODA_GUI = IODA_GUI || {};

			// --- Drag utility
IODA_GUI.elements_dragFunction = function(ev) {
	ev.dataTransfer.setData("text", ev.target.dataset.drag_info);
}
	
IODA_GUI.elements = function() {
	var self = {};
	const mID = "sElements";

	var mProjectElementList, mUserElementList;
	var mAllElements;

	var mElementEditor = IODA_GUI.element_editor();

	var mMainPanel  = jQuery("<div/>" , { 
		class: "sTabLeft d-flex flex-column", 
		style:"flex-grow:1"
	});

	var mMenuDiv  = jQuery("<div/>", {
		class: "sTabLeft h-100 d-flex flex-column mx-auto",
		style: "flex-grow:1;"}).appendTo(mMainPanel);


	// -----------------------------
	// Setters and getters
	// -----------------------------
	
	self.getMainPanel = function() {
		return mMainPanel;
	}
	
	self.setElements = function(projectElementList,userElementList) {
		mProjectElementList = projectElementList;
		mUserElementList    = userElementList;
		refreshElements();
	}

	self.setProjectElements = function(projectElementList) {
		mProjectElementList    = projectElementList;
		refreshElements();
	}

	self.setUserElements = function(userElementList) {
		mUserElementList    = userElementList;
		refreshElements();
	}

	// --- Element info by classname

	self.getName = function(classname) {
		var element = mAllElements[classname];
		if (element==null) return "Unknown";
		return element['name'];
	}

	self.getDescription = function(classname) {
		var element = mAllElements[classname];
		if (element==null || element['description']==null) return "(Not provided)";
		return element['description'];
	}

	self.getIcon = function(classname) {
		var element = mAllElements[classname];
		if (element==null || element['image']==null) return null;
		return sMainGetServerURL(element['image']);
	}

	self.showHelp = function(classname) {
			showElementPanel(classname);
	}

	// --- Element properties

	function getProperties(classname) {
		var element = mAllElements[classname];
		if (element==null || element['properties']==null) return [];
		return element['properties'];
	}
	
	function defaultPropertyType(type) {
		if (type!=null) return type;
		return "ANY";
	}
	 
	function defaultPropertyAttributes(attr) {
		if (attr!=null) return attr;
		return "";
	}

	self.getPropertiesNameList = function(classname) {
		var names = [];
		getProperties(classname).forEach(function(property) {
			names.push(property['name']);
		});
		return names;
	}

	self.getPropertyType = function(classname,propertyName) {
		var properties = getProperties(classname);
		for(var i=0; i<properties.length; i++) {
			var property = properties[i];
			if (property['name']===propertyName) 
				return defaultPropertyType(property['type']);
		}
		return null;
	}

	self.getPropertyAttributes = function(classname,propertyName) {
		var properties = getProperties(classname);
		for(var i=0; i<properties.length; i++) {
			var property = properties[i];
			if (property['name']===propertyName) 
				return defaultPropertyAttributes(property['attributes']);
		}
		return null;
	}

	// -----------------------------
	// User elements
	// -----------------------------

	function findUserGroup(groupName) {
		if (groupName==null) return null;
		const groups = mUserElementList.groups;
		for (var i=0; i<groups.length; i++) {
			var group = groups[i];
			if (group.name==groupName) return group;
		}
		return null;
	}
	
	function htmlForGroup(label, nameHtml,elementsHtml,isUserGroup) {
		return ''+
		  '<button id="'+label+'-button" '+
			'  class=" border border-dark p-2  d-flex flex-row '+ // (isUserGroup ? 'ps-0' : '')+
			    (isUserGroup ? ' sTabLeft_user_header" ' :  ' bg-light" ') + //' sTabLeft_header" ') +
			'  data-expandable="'+label+'" '+
			//'  data-group="'+ (isUserGroup ? groupName : '') +'" '+
			'  style="flex-grow:0; flex-basis:0;">'+
			  //editButtonHtml +
			'  <span class="sTabLeft_header_title text-primary" style="flex-grow:1; text-align:left">'+nameHtml+'</span>'+
			'  <span class="container-fluid p-0 m-0 p2-2 justify-content-end" style="flex-grow:0; flex-basis:0">'+
			'    <i class="bi bi-chevron-expand" style="font-size: 1rem;"></i>'+
			'  </span>'+
		  '</button>'+
		  '<div class="d-flex flex-column overflow-scroll" style="flex-grow:0; flex-basis:0;">'+
			'  <div class="collapse h-100 overflow-scroll" id="'+label+'" style="flex-grow:0;flex-basis:0;">'+
				   elementsHtml +
			'  </div>'+
		  '</div>';
	}

	function htmlEditionButtons(elementType,isUserElement) {
		return ''
			+'<button class="mElementsEditElement justify-content-start btn btn-link text-decoration-none p-0" type="button" '
			+  ' data-type="'+elementType+'" '
			+  ' data-user_element="'+isUserElement+'" ' 
			+  '>'
			+  (isUserElement ? '<i class="bi bi-file-code pb-1" style="font-size: 1.25rem; color: blue;"></i>' 
				 								: '<i class="bi bi-info-square pb-1" style="font-size: 1.0rem; color: blue;"></i>'
				 ) 
			+'</button>';
	}

	function htmlForElement(elementType, elementInfo, isUserElement) {
//		var editionButtonsHtml = isUserElement ? htmlEditionButtons(elementType) : "";
//		var divMargins = isUserElement ? "ms-0" : "ms-1";
		var editionButtonsHtml = htmlEditionButtons(elementType,isUserElement);
		var divMargins = "ms-0";
		return '' 
			+'<div>'
			+	'<div class="'+divMargins+'">'
			+		'<img class="element_img" src="'+sMainGetServerURL(elementInfo.image) + '"' 
			+			' draggable="true" ondragstart="IODA_GUI.elements_dragFunction(event)" data-drag_info="'+elementType+'"'
			+			' style="margin-bottom: 5px; margin-right: 9px">	'
			+		'<div class="p-0 pt-1">'
			+			editionButtonsHtml
			+			elementInfo.name 
			+		'</div>'
			+	'</div>'
			+	'<div class="ms-1 col-9 text-truncate" style="max-width: 160px">' 
			+		'<sup style="top: 6px"><sub style="bottom: 7px">' 
			+			'<small>'+elementInfo.description+'</small>' 
			+		'</sub></sup>' 
			+	'</div>' 
			+'</div>'
			+ '<div class="h-divider"></div>'
			;
		}

	function addToAll_and_getElementsHTML (group, elementList) {
		const isUserElement = (elementList==mUserElementList);
		var html = "";
		console.log('+++++++++++++++++++++++++++++++++++++++++++')
		console.log(group)
		console.log(group.elements)
		console.log('+++++++++++++++++++++++++++++++++++++++++++++')
		group['elements'].forEach(function(elementType) {
			var elementInfo = elementList.elements[elementType];
			if (elementInfo!=null) {
				html += htmlForElement(elementType,elementInfo,isUserElement);
				mAllElements[elementType] = elementInfo;
			}
			else alert("WARNING: Information not found for element type "+elementType);
		});
		return html;
	}

	function getImageHTML(group, isUserGroup) {
		if (isUserGroup) {
			if ('image' in group) return ''+
			 '<img class="mElementsEditGroup profile-picture me-1 group_img" '+ //  bg-light
					' src="'+sMainGetServerURL(group.image)+'" '+
				  ' data-group="'+ group.name +'">';
			return '<i class="bi bi-person mElementsEditGroup" data-group="'+ group.name +'"></i>';
		}
		else {
			if ('image' in group) return ''+
				'<img class="profile-picture me-1 group_img" '+
					' src="'+sMainGetServerURL(group.image)+'">';
			return '<i class="bi bi-question-diamond"></i>';
		}
	}

	function refreshElements() {
		var menuHtml='';
		var groupDivList = [];
		var counter = 0;
		mAllElements = {};
		console.log('-------------------------------------------')
		console.log(mUserElementList)
		console.log('-------------------------------------------')
		mProjectElementList.groups.forEach(function(group) {
			var elementsHtml = addToAll_and_getElementsHTML(group,mProjectElementList);
			var imageHtml = getImageHTML(group,false); 
			const groupLabel = mID+'-group_div-'+(counter++); //group.name.replace(' ','-');
			groupDivList.push(groupLabel+"-button");
			menuHtml += htmlForGroup(groupLabel,imageHtml+group.name,elementsHtml,false);
		});
		mUserElementList.groups.forEach(function(group) {
			var elementsHtml = addToAll_and_getElementsHTML(group,mUserElementList);
			var imageHtml = getImageHTML(group,true); 
			const groupLabel = mID+'-group_div-'+(counter++); // +group.name.replace(' ','-');
			groupDivList.push(groupLabel+"-button");
			menuHtml += htmlForGroup(groupLabel,imageHtml+group.name,elementsHtml,true);
		});
		
		// Now fill the sidenav
		mMenuDiv.empty().append(menuHtml);
		
		$('.mElementsEditGroup').click(function(event) {
			showGroupPanel(event.currentTarget.dataset.group);
			event.stopPropagation();
		});
		
		$('.mElementsEditElement').click(function(event) {
			showElementPanel(event.currentTarget.dataset.type);
			event.stopPropagation();
		});

		$('.mMainElementMenuButton').each(function() {
				if ($( this ).data('action') != "GroupCreate") {
					if (mUserElementList.groups.length>0) $( this ).removeClass( "disabled" );
					else $( this ).addClass( "disabled" );
				}
		});

		groupDivList.forEach(function(groupLabel) {
			$('#'+groupLabel).on ("click",(evt)=>{
				var targetButton = evt.target.closest('button');
				var toToggleDiv = $('#'+targetButton.dataset.expandable); 
				//lastGroupSelected(targetButton.dataset.group);
				if (toToggleDiv.hasClass('show')) {
					toToggleDiv.removeClass('show');
					toToggleDiv.css('flex-grow', '0');			
					toToggleDiv.parent().css('flex-grow', '0');			
				}
				else {
					toToggleDiv.addClass('show');
					toToggleDiv.css('flex-grow', '1');			
					toToggleDiv.parent().css('flex-grow', '1');			
				} 
				groupDivList.forEach(function(label) {
					var button = $('#'+label)[0];
					if (button!=targetButton) {
						var div = $('#'+button.dataset.expandable);
						div.removeClass('show');
						div.css('flex-grow', '0');			
						div.parent().css('flex-grow', '0');			
					}
				});
			});
		});
	}

	// -----------------------------
	// User groups and elements
	// -----------------------------

	self.userGroupCommand = function(command) {
		if (command=='GroupCreate')   return showGroupPanel(null);
		if (command=='ElementCreate') return showElementPanel(null);
	}

 /**
	* Creates a form to create or edit a group
  */
  function showGroupPanel(groupName) {
		var groupToEdit = findUserGroup(groupName);
		
		var itemList = [];
		mUserElementList.groups.forEach(function(group,index) {
			itemList.push( { 'hash' : group.name, 'name' : group.name }); 
		});
		var itemToEdit = (groupToEdit==null) ? null : 
			{ 'hash' : groupToEdit.name, 'name' : groupToEdit.name, 'image' : groupToEdit.image };
		
//						'<h5 class="modal-title">'+ sMainRes.getString(groupToEdit!=null ? 'Edit group' : 'New group')+'</h5>'+

		var listener = function(action, options) {
			switch(action) {
				case 'Delete' : 
					sMainConfirmationForm.show(function(){
							sMainCommConnection.userElementCommand({ 'command' : 'DeleteGroup', 'target' : groupToEdit.name });  
						},
						groupToEdit.name, "WARNING!!! This action CANNOT be undone!!!<br>Do you really want to delete this group?", 
						sMainRes.getString("Delete"));
					break;
				case 'Apply' : 
					options['name'] = options['name'].trim();
					if (options['name'].length<=0) {
						sMainMessageForm.show('Error','Group name not specified','Ok');
						return;
					}
					var existingGroup = findUserGroup(options['name']);
					if (existingGroup!=null && existingGroup!=groupToEdit){
						sMainMessageForm.show('Error','Group name already in use!','Ok');
						return;
					}
					if (groupToEdit==null) sMainCommConnection.userElementCommand({ 
						'command' : 'CreateGroup',  'target' : options['name'], 'options' : options 
					});  
					else sMainCommConnection.userElementCommand({ 
						'command' : 'EditGroup', 'target' : groupToEdit.name, 'options' : options });
					break;
			}
		};
		const label = groupToEdit!=null ? 'Group' : 'New Group';
		IODA_GUI.editionForm(label, itemToEdit, itemList, listener, { 'has_icon' : true });
	}

	// -----------------------------
	// User elements
	// -----------------------------

	function findUserElementType(elementName) {
		if (elementName==null) return null;
		const elements = mUserElementList.elements;
		for (var type in elements) {
			if (elements[type].name==elementName) return type;
		}
		return null;
	}

 /**
	* Creates a form to create or edit an element
  */
	function showElementPanel(elementToEditType) {
		var isUserElement = true;
		var elementToEdit = null;
		if (elementToEditType!=null) {
			if (elementToEditType in mProjectElementList.elements) {
				isUserElement = false;
				elementToEdit =  mProjectElementList.elements[elementToEditType];
			}
			else elementToEdit =  mUserElementList.elements[elementToEditType];
		}
		var listener = function(action, options) { // newName, relativePosition, relativeToElement, base64Icon) {
			var isProjectElement = options['is_project_element'];
			var command;
			switch(action) {
				case 'Delete' : 	
					command = (isProjectElement ?  'DeleteProjectElement' : 'DeleteElement');
					sMainConfirmationForm.show(
						function() { // listener
							sMainCommConnection.userElementCommand({ 'command' : command, 'target' : elementToEditType });  
						},
						elementToEdit.name, 
						"WARNING!!! This action CANNOT be undone!!!<br>Do you really want to delete this element?", 
						sMainRes.getString("Delete"));
					break;
				case 'Apply' : 
					var duplicate = options['duplicate'];
					if (duplicate) {
						var newName = options['name'];
						if (newName==elementToEdit.name) newName = elementToEdit.name+" (copy)";
						command = (isProjectElement ?  'DuplicateProjectElement' : 'DuplicateElement');
						sMainNameForm.show(
							function(name){ // listener
								options['name'] = name;
							  sMainCommConnection.userElementCommand({
									'command' : command, 'target' : elementToEditType, 'options' : options 
								});
							},
							newName, null, "Duplicate element", sMainRes.getString("Duplicate")
						);							
						return;
					} // End of duplication 
					if (elementToEdit==null) 
						sMainCommConnection.userElementCommand({ 'command' : 'CreateElement', 'options' : options });
					else {
						command = (isProjectElement ?  'EditProjectElement' : 'EditElement');
						sMainCommConnection.userElementCommand({ 'command' : command, 'target' : elementToEditType,  'options' : options });
					}
					break;
			}
		};
		mElementEditor.showEditor(elementToEditType, mProjectElementList, mUserElementList, listener, isUserElement); 
	}
	
	// -------------------------------------------------------
	// Final initialization
	// -------------------------------------------------------

	return self;
}

 
 
