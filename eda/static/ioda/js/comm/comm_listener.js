/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 * This code is Open Source and is provided "as is".
*/

var IODA_COMMUNICATION = IODA_COMMUNICATION || {};
/**
 * A simple listener for Fusion IODA
 */
IODA_COMMUNICATION.Listener = function(iodaClientComm) {
	var self = {};

	var mProjectList = IODA_GUI.project_list();
	var mCurrentProjectName = null;

	// -------------------------------
	// login/logout 
	// -------------------------------
	
	self.onConnection = function() {
		iodaClientComm.getProjectsInfo();
	}

	self.onDisconnection = function() {
		sMainToLoginPage();
	}

	// -------------------------------
	// Projects 
	// -------------------------------

	self.getProjectName = function() {
		return mCurrentProjectName;
	}
	
	self.setProjectName = function(name) {
		mCurrentProjectName = name;
		sMainSetTitle(name);
	}

	self.processProjectsInfo = function(projectsInfo) {
		mProjectList.readProjects(projectsInfo.project_types,projectsInfo.project_list);
		sMainCleanLogin();
	}

	self.loadProject = function(projectData) {
		sMainElementList.setElements(projectData.elements);
		sMainReadWorkfile(projectData.workfile);
		self.setProjectName(projectData.name);
	}

	self.readWorkfile = function(workfileData) {
		sTabbedPannel.readObject(workfileData);
	}

	self.processRunResult = function(runInformationData) {
    sTabbedPannel.readRunResult(runInformationData.graph, runInformationData.results);
	}

	// -------------------------------
	// Messages 
	// -------------------------------


	self.processMessageArray = function(messageArray) {
		for (var messageObject in messageArray)
			self.showMessage(messageObject.title, messageObject.message);
	}

	self.showMessage = function(header, message) {
		console.log ("IODA says: "+header+" : "+message);
		sShowMessage(header,message);
	}
	
	// -------------------------------
	// Elements 
	// -------------------------------

	self.updateElements = function(projectElements){
		console.log("Reading projectElements:" + projectElements.elements);
		sMainElementList.setElements(projectElements.elements);
		alert("List of Elements updated!!!");
	}

	self.clearData = function() {
	}


	return self;
}
