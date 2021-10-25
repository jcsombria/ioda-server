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
 A user interface tab page with a graph
 */
IODA_GUI.graphReplayPage = function(id, title, parent) {
	var self = IODA_GUI.graphEditPage(id,title,parent, true); // is run replay
	

	// -----------------------------
	// Setters and getters
	// -----------------------------

	self.setResultsData = function(resultsData) {
		self.setResourcesID(resultsData['resources']);
		self.getRunControl().setRunInformation(resultsData['graph'],resultsData['nodes']);
		self.displayRunInfo(null);
	}

	// --------------------------
	// Start-up
	// --------------------------


	
	return self;
}

