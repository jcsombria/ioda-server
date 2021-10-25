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
	var mElementList;
	var mGroupDivList = [];

	var mMainPanel  = jQuery("<div/>" , { 
		class: "sTabLeft d-flex flex-column", 
		style:"flex-grow:1"
	});

	var menuDiv  = jQuery("<div/>", {
		class: "sTabLeft h-100 d-flex flex-column mx-auto",
		style: "flex-grow:1;"}).appendTo(mMainPanel);

	// -----------------------------
	// Setters and getters
	// -----------------------------
	
	self.getMainPanel = function() {
		return mMainPanel;
	}

	// --- Element info by classname

	self.getName = function(classname) {
		var element = mElementList[classname];
		if (element==null) return "Unknown";
		return element['name'];
	}

	self.getDescription = function(classname) {
		var element = mElementList[classname];
		if (element==null || element['description']==null) return "(Not provided)";
		return element['description'];
	}

	self.getIcon = function(classname) {
		var element = mElementList[classname];
		if (element==null || element['image']==null) return null;
		return sMainGetServerURL(element['image']);
	}

	self.showHelp = function(classname) {
		var element = mElementList[classname];
		if (element==null || element['help']==null) return sMainGetServerURL('html/no_help.html');
		var url = sMainGetServerURL(element['help']);
		window.open(url); // ,element['name']);
	}


	// --- Element properties

	function getProperties(classname) {
		var element = mElementList[classname];
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
	// Adding elements
	// -----------------------------
	
	const mGROUP_DIV = 	
		'<button id="#{label}-button" class="sTabRight_header border border-dark p-2  d-flex flex-row" '+
//				'onclick="sMainCommandCenter.sendCommand(\''+ mID+'\',\'#{label}\')" '+
				'data-expandable="#{label}" '+
				'style="flex-grow:0; flex-basis:0;">'+
			'<span class="sTabRight_header_title text-primary" style="flex-grow:1; text-align:left">#{name}</span>'+
			'<span class="container-fluid p2-2 justify-content-end" style="flex-grow:0; flex-basis:0">'+
				'<i class="bi bi-chevron-expand" style="font-size: 1rem;"></i>'+
			'</span>'+
		'</button>'+
		'<div class="d-flex flex-column overflow-scroll" style="flex-grow:0; flex-basis:0;">'+
			'<div class="collapse h-100 overflow-scroll" id="#{label}" style="flex-grow:0;flex-basis:0;">'+
				'#{elements}'+
			'</div>'+
		'</div>';

	function htmlEditionButtons(elementInfo) {
		return ""
			+'<button type="button" class="open-editModal btn btn-light btn-xs" ' 
			+	'style="padding-bottom: 0px; padding-top: 0px; padding-left: 2px; padding-right: 2px;" ' 
			+	'data-toggle="modal" data-target="#editModal" data-id="' + elementInfo.name +'">'
			+		'<i class="bi bi-tools"></i>'
			+'</button>'
			+'<button type="button" class="open-deleteModal btn btn-light btn-xs" ' 
			+	'style="padding-bottom: 0px; padding-top: 0px; padding-left: 2px; padding-right: 2px;" ' 
			+	'data-toggle="modal" data-target="#deleteModal" data-id="' + elementInfo.name +'">'
			+		'<i class="bi bi-trash"></i>'
			+'</button>';
	}

	function htmlForElement(element_classname, addEditionButtons) {
		var elementInfo = mElementList[element_classname];
		var editionButtonsHtml = addEditionButtons ? htmlEditionButtons(elementInfo) : "";
		return '' 
			+'<div class="profile-details-wrapper ms-2">'
			+	'<div class="profile-details">'
			+		'<img class="profile-picture element_img" src="'+sMainGetServerURL(elementInfo.image) + '"' 
			+			' draggable="true" ondragstart="IODA_GUI.elements_dragFunction(event)" data-drag_info="'+element_classname+'"'
			+			' style="margin-bottom: 5px; margin-right: 9px">	'
			+		'<div style="padding-left: 0px; padding-bottom: 0px; padding-top: 3px">'
			+			elementInfo.name 
			+			'<div class="float-end">'
			+				editionButtonsHtml
			+			'</div>'
			+		'</div>'
			+	'</div>'
			+	'<div class="col-9 text-truncate" style="max-width: 160px">' 
			+		'<sup style="top: 6px"><sub style="bottom: 7px">' 
			+			'<small>'+elementInfo.description+'</small>' 
			+		'</sub></sup>' 
			+	'</div>' 
			+'</div>'
			+ '<div class="h-divider"></div>'
			//+'<hr style="margin-bottom: 4px; margin-top: 4px">'
			;
		}

	self.setElements = function(elementList) {
		var menuHtml='';
		mGroupDivList = [];
		mElementList = elementList;
		mElementList.groups.forEach(function(group) {
			var elementsHtml = "";
			var isUserElement = (group.name=="User");
			mElementList[group.name].forEach(function(element_classname) {
				elementsHtml += htmlForElement(element_classname,isUserElement);
			});
			var imageHtml; 
			if ('image' in group)		imageHtml = '<img class="profile-picture group_img" src="'+sMainGetServerURL(group.image)
				+'" style="margin-right: 10px;" >';
			else if (isUserElement)	imageHtml = '<i class="bi bi-person"></i>';
			else 										imageHtml = '<i class="bi bi-question-diamond"></i>';
			// Create the dropdown container for the group
			const groupLabel = mID+'-group_div-'+group.name;
			mGroupDivList.push(groupLabel+"-button");
			menuHtml += mGROUP_DIV
				.replace( /#\{label\}/g, groupLabel )
				.replace( /#\{name\}/g, imageHtml+group.name )
				.replace( /#\{elements\}/g, elementsHtml );
		});
		// Now fill the sidenav
		menuDiv.empty().append(menuHtml);

		mGroupDivList.forEach(function(groupLabel) {
			$('#'+groupLabel).on ("click",(evt)=>{
				var targetButton = evt.target.closest('button');
				var toToggleDiv = $('#'+targetButton.dataset.expandable); 
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
				mGroupDivList.forEach(function(label) {
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

/*
		// Loop through all dropdown buttons to toggle between hiding and showing its dropdown content
		// This allows the user to have multiple dropdowns without any conflict
		var dropdown = document.getElementsByClassName("dropdown-container");
	 
		for (let i = 0; i < dropdown.length; i++) {
			dropdown[i].addEventListener("click", function() {
				this.classList.toggle("active");
				var dropdownContent = this.nextElementSibling;
				if (dropdownContent.style.display === "block") dropdownContent.style.display = "none";
				else dropdownContent.style.display = "block";
			});
		}
	} 
*/
	self.setClientElements = function(elementList) {
		console.log("Actualizar lista de elementos llamándola desde el server!!!!!");
	}	

	$(document).on("click", ".open-deleteModal", function (e) {
		e.preventDefault();
		var _self = $(this);
		var ename = _self.data('id');
		const modalText = $("#modalText");
		$("#dName").val(ename);	
		$("#modalText").val(ename);		
		modalText.text("Do you confirm that you want to delete " + ename + " Element?");
		$(_self.attr('href')).modal('show');
	});

	$(document).on("click", ".open-editModal", function (e) {
		var datos  = new Array();
		var groups = new Array();
		var groups = mElementList.groups;	

		e.preventDefault();
		var _self = $(this);
		var elementname = _self.data('id');

		for(let h = 0; h<groups.length; h++) { 	
			datos=mElementList[groups[h]];
			if (datos.length!=0){		
				var grupo = mElementList.groups[h];								    
				for (let j = 0; j<datos.length; j++) {
					if (grupo=="User" && mElementList[datos[j]].name==elementname){
						var img = mElementList[datos[j]].image;
						var desc = mElementList[datos[j]].description;
						var cod = mElementList[datos[j]].code;
						var ty = mElementList[datos[j]].codeType;
					}					
				}
			}
		}        

		$("#editName").val(elementname);	
		$("#editDescription").val(desc);
		$("#editImg").attr("src","http://localhost:8800/"+img);
		$(".estatus").text(ty);

		eeditor.getSession().setValue(cod);
		let lang = "ace/mode/"+ty.toLowerCase();						
		eeditor.getSession().setMode(lang);
		$(_self.attr('href')).modal('show');
	});


	// -------------------------------------------------------
	// Final initialization
	// -------------------------------------------------------

	return self;
}




 
 
