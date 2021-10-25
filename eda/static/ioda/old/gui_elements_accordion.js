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
	var mElementList;

	var mMainPanel  = jQuery("<div/>" , { class: "d-flex flex-column h-100", style:"flex-grow:1" });

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
		window.open(url,element['name']);
	}

//  getCodeFile(classname) {
//    return mElementList['path']+ '/' +
//           classname.replace('.','/') + "/code.py";
//  }


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
			+'<div class="profile-details-wrapper">'
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
			+'<hr style="margin-bottom: 4px; margin-top: 4px">';
		}

	self.setElements = function(elementList) {
		var menuHtml=
		'<div  id="mElementsAccordion" '+
			'class="accordion accordion-flush overflow-scroll" '+
			'style="flex-grow:1">';
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
			menuHtml +=
				'<div class="accordion-item">'
				+	'<h5 class="accordion-header" id="sElementsGroup-'+group.name+'-header">'
				+		'<button class="accordion-button collapsed" type="button" ' 
				+			' data-bs-toggle="collapse" data-bs-target="#sElementsGroup-'+group.name+'" '
				+			' aria-expanded="true" aria-controls="sElementsGroup-'+group.name+'">'
				+			imageHtml
				+			group.name
				+		'</button>'
				+	'</h5>'
				+	'<div id="sElementsGroup-'+group.name+'" ' 
				+		' class="accordion-collapse collapse" ' 
				+		' aria-labelledby="sElementsGroup-'+group.name+'-header" data-bs-parent="#mElementsAccordion">' 
				+		'<div class="accordion-body">'
				
				+			elementsHtml
				+		'</div>' 
				+	'</div>'
				+'</div>';
/*
				'<button class="dropdown-btn" style="padding-left: 8px">' 
				+ '<h5>' 
				+		group.name
				+ 	imageHtml
				+ 	'<i class="fa fa-caret-down"></i>' 
				+	'</h5>' 
				+'</button>'
				+'<div class="dropdown-container sElementsGroup" id="'+group.name+'">'
				+	 elementsHtml
				+'</div>';
*/
		});
		menuHtml +='</div>'; // end of accordion

		// Now fill the sidenav
		mMainPanel.empty().append(menuHtml);

/*
			var groups = mElementList.groups;	
			for(let i = 0; i<groups.length; i++) { 
				
				if (groups[i]=="Model"){
					buttonout +=
					'<button class="dropdown-btn" style="padding-left: 8px">
						<h5>'+
							 groups[i] +
						'<i class="bi bi-diagram-3"></i>
						 <i class="fa fa-caret-down"></i>
						</h5>
					</button>
					<div class="dropdown-container" id="'+ groups[i] +'"></div>';
			 	 }	
				else if (groups[i]=="Visualization"){								
				 	buttonout +='<button class="dropdown-btn" style="padding-left: 8px"><h5>'+ groups[i] +'<i class="bi bi-easel"></i><i class="fa fa-caret-down"></i></h5></button><div class="dropdown-container" id="'+ groups[i] +'"></div>';
				}
				else if (groups[i]=="Data"){								
					buttonout +='<button class="dropdown-btn" style="padding-left: 8px"><h5>'+ groups[i] +'<i class="bi bi-file-earmark-bar-graph"></i><i class="fa fa-caret-down"></i></h5></button><div class="dropdown-container" id="'+ groups[i] +'"></div>';
			   	}
			   	else if (groups[i]=="User"){								
					buttonout +='<button class="dropdown-btn" style="padding-left: 8px"><h5>'+ groups[i] +'<i class="bi bi-person"></i><i class="fa fa-caret-down"></i></h5></button><div class="dropdown-container" id="'+ groups[i] +'"></div>';
		   		}
				else if (groups[i]=="Evaluation"){								
					buttonout +='<button class="dropdown-btn" style="padding-left: 8px"><h5>'+ groups[i] +'<i class="bi bi-card-checklist"></i><i class="fa fa-caret-down"></i></h5></button><div class="dropdown-container" id="'+ groups[i] +'"></div>';
				} 
			}

			 for(let h = 0; h<groups.length; h++) { 	
				datos=mElementList[groups[h].name];
				itemsout=" ";	
				if (datos.length!=0){		
					var grupo = mElementList.groups[h];								    
					for (let j = 0; j<datos.length; j++) {
						if (grupo.name=="User"){
							itemsout += 
								'<div class="profile-details-wrapper">'+
									'<div class="profile-details">'+
										'<img class="profile-picture" src="' + sMainGetServerURL(mElementList[datos[j]].image) + '"' +
											' draggable="true" ondragstart="IODA_GUI.elements_dragFunction(event)" data-drag_info="'+mElementList[datos[j]]+'"'+
											'width="40" height="40" style="margin-bottom: 5px; margin-right: 9px">'+
											'<a href="#" style="padding-left: 0px; padding-bottom: 0px; padding-top: 3px">' + 
												mElementList[datos[j]].name + 
												'<div class="float-end">'+
													'<button type="button" class="open-editModal btn btn-light btn-xs" data-toggle="modal" data-target="#editModal" style="padding-bottom: 0px; padding-top: 0px; padding-left: 2px; padding-right: 2px;" data-id="' + mElementList[datos[j]].name +'">'+
														'<i class="bi bi-tools"></i>'+
													'</button>'+
													'<button type="button" class="open-deleteModal btn btn-light btn-xs" data-toggle="modal" data-target="#deleteModal" style="padding-bottom: 0px; padding-top: 0px; padding-left: 2px; padding-right: 2px;" data-id="' + mElementList[datos[j]].name +'">'+
														'<i class="bi bi-trash"></i>'+
													'</button>'+
												'</div>'+
											'</a>'+
										'</div>'+
									'<div class="col-9 text-truncate" style="max-width: 160px">'+
										'<sup style="top: 6px"><sub style="bottom: 7px">'+
											'<small>'+mElementList[datos[j]].description+'</small>'+
										'</sub></sup>'+
									'</div>'+
								'</div>'+
							'<hr style="margin-bottom: 4px; margin-top: 4px">';
						}
						else{ 
							itemsout += 
							'<div class="profile-details-wrapper">'+
								'<div class="profile-details">'+
									'<img class="profile-picture" src="'+sMainGetServerURL(mElementList[datos[j]].image) + '"' + 
											' draggable="true" ondragstart="IODA_GUI.elements_dragFunction(event)" data-drag_info="'+datos[j]+'"'+
											' width="40" height="40" style="margin-bottom: 5px; margin-right: 9px">	'+
									'<a href="#" style="padding-left: 0px; padding-bottom: 0px; padding-top: 3px">' + 
										mElementList[datos[j]].name + 
										'<div class="float-end"></div>'+
									'</a>'+
								'</div><div class="col-9 text-truncate" style="max-width: 160px"><sup style="top: 6px"><sub style="bottom: 7px"><small>'+mElementList[datos[j]].description+'</small></sub></sup></div></div><hr style="margin-bottom: 4px; margin-top: 4px">';
							}
					}					
					document.getElementById(grupo.name).innerHTML = itemsout;	 
				}
			 }	
			*/
			 
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




 
 
