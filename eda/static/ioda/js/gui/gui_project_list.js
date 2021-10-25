/*
 * Copyright (C) 2021 Francisco Esquembre 
 * This code is part of the Fusion IODA project
 */
/**
 * GUI tools
 * @module core
 */

var IODA_GUI = IODA_GUI || {};

IODA_GUI.project_list = function() {
	const mRes = IODA_RESOURCES.main();
	var self = {};

	const sPROJECT_FORM = 
			'<form name="sNewProjectForm" id="sNewProjectForm">'+
				'<div class="mb-2">'+
					'<label for="sNewProjectName" class="form-label form-label-sm">'+mRes.getString("Name")+':</label>'+
					'<input type="text" class="form-control form-control-sm" name="sNewProjectName" id="sNewProjectName" '+
						'placeholder="'+mRes.getString("Enter new project name")+'">'+
				'</div>'+
				'<div class="mb-2">'+
					'<label for="sNewProjectDescription" class="form-label form-label-sm">'+mRes.getString("Description")+':</label>'+
					'<input type="text" class="form-control form-control-sm" name="sNewProjectDescription" id="sNewProjectDescription" '+
							'placeholder="'+mRes.getString("Enter project description")+'">'+
				'</div>'+
				'<div class="mb-2">'+
					'<label for="sNewProjectType" class="form-label form-label-sm">'+mRes.getString("Type")+':</label>'+
					'<select id="sNewProjectType" class="form-select form-select-sm" aria-label="Project type selection">'+
					'</select>'+
				'</div>'+
			'</form>'+
			'<button id="sProjectListNewButton" type="button" class="btn btn-secondary btn-sm">'+
				mRes.getString('Create project')+
			'</button>';

	var sMODAL_HTML =
		'<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">'+
			'<div class="modal-content">'+
				'<div class="modal-header">'+
					'<h5 class="modal-title">'+mRes.getString("Choose a project")+'</h5>'+
					'<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>'+
				'</div>'+
				'<div class="modal-body">'+
					'<div class="accordion accordion-flush" id="sProjectListAccordion"></div>'
				'</div>'+
			'</div>'+
		'</div>';

	$('#sProjectModal').html(sMODAL_HTML);
	var mModal = new bootstrap.Modal(document.getElementById('sProjectModal'))
	
	function infoOf(type, projectTypes) {
		for(var i = 0;i < projectTypes.length;i++) {
			var typeInfo = projectTypes[i];
			if (typeInfo.type==type) {
				return typeInfo;
			}
		}
		sShowMessage("Error in project types", "Project type: "+type+ " not supported!")
		return null;
	}
	
	function projectByName(name, projectList) {
		for(var i = 0;i < projectList.length;i++) {
			var project = projectList[i];
			if (project.name==name) {
				return project;
			}
		}
		sShowMessage("Error in project list", "Project: "+name+ " not found!")
		return null;
	}
	
/**
	projectTypes = [ { typeStr, descriptionStr , imageURL }]
	projectList = [ { nameStr, typeStr, descriptionStr }]
 */
	self.readProjects = function(projectTypes, projectList) {
		var htmlStr = 
			'<div class="accordion-item">'+
				'<h2 class="accordion-header" id="sProjectListHeadingNew">'+
					'<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" aria-expanded="false"'+
						'data-bs-target="#sProjectListCollapseNew" aria-controls="sProjectListCollapseNew">'+
						mRes.getString("New project")+
					'</button>'+
				'</h2>'+
				'<div id="sProjectListCollapseNew" class="accordion-collapse collapse" '+
					'aria-labelledby="sProjectListHeadingNew" data-bs-parent="#sProjectListAccordion">'+
					'<div class="accordion-body">'+
						sPROJECT_FORM+
					'</div>'+
				'</div>'+
			'</div>';

		var buttons=[];
		var counter=0;
		projectList.forEach(function (project) {
			var typeInfo = infoOf(project.type,projectTypes);
			if (typeInfo==null) return;
			counter++;
			var buttonName = "mProjectListButton_"+counter;
			buttons.push(buttonName);
			var colName = "mProjectListCollapse"+counter;
			var headingName = "mProjectListHeading"+counter;
			htmlStr += 
				'<div class="accordion-item">'+
					'<h2 class="accordion-header" id="'+headingName+'">'+
						"<button class='accordion-button collapsed' type='button' data-bs-toggle='collapse' data-bs-target='#"+colName+"' aria-expanded='false' aria-controls='"+colName+"'>"+
							'<img class="project_img" src="'+sMainGetServerURL(typeInfo.image)+'" style="padding:5px"/>'+
							project.name+
						"</button>"+
					'</h2>'+
					'<div id="'+colName+'" class="accordion-collapse collapse" aria-labelledby="'+headingName+'" data-bs-parent="#sProjectListAccordion">'+
						'<div class="accordion-body">'+
							'<textarea data-project="'+project.name+'" class="col-12" style="padding-bottom:10px" rows="3">'+
									project.description + 
							'</textarea>'+
							'<button id="'+buttonName+'" data-project="'+project.name+'" class="openButton btn btn-secondary btn-sm" type="button">'+
								mRes.getString('Open')+
							'</button>'+
						'</div>'+
					'</div>'+
				'</div>';
		});
		$('#sProjectListAccordion').html(htmlStr);
		var typesStr = "";
		for (var i=0; i<projectTypes.length; i++) {
			var type = projectTypes[i]['type'];
			var full = type +" : "+projectTypes[i]['description'];
			typesStr += '<option value="'+type+'"'+ ((i==0) ? 'selected':'') + '>'+full+'</option>';
		}
		$('#sNewProjectType').html(typesStr);
		$('#sProjectListAccordion .openButton').on("click", function() {
			mModal.hide();
			sMainCommConnection.setProject(projectByName(this.dataset.project,projectList));
		});
		$('#sProjectListNewButton').click(function() {
			var form = document.forms['sNewProjectForm'];
			var name = form['sNewProjectName'].value; 
			if ( name == "" || name == null) {
				alert(mRes.getString("A name must be specified!"));
				return false;
			}
			var data = { 'name' : name };
			data['description'] = form['sNewProjectDescription'].value;
			data['type'] = form['sNewProjectType'].value;
			sMainCommConnection.setProject(data);
		});
		$('#sProjectListAccordion textarea').on("change", (data)=>{ 
			var project = projectByName(data.target.dataset.project, projectList);
			if (project) {
				project['description'] = data.target.value;
				sMainCommConnection.setProjectDescription(project['name'],project['description']);
				console.log("Name =" +project['name']+" Desc = "+project['description']);
			}
		});
		
		mModal.show();
	} 
	
	return self;
}


