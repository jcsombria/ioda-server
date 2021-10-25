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
 * Main GUI
 * @class Model 
 * @constructor  
 */

IODA_GUI.main = function() {
	const mRes = IODA_RESOURCES.main();
	var self = {};

	//mRes.setLocale("es");
	
	var tabbedPanel = IODA_GUI.tabbedPanel();
	$('#sMainTabContainer').append(tabbedPanel.getMainPanel());
	
	$('#sTogglePropertiesButton').click(function(){
		tabbedPanel.toggle();
		sBrowserResized();
	}); 
	$('#sToggleElementsButton').click(function(){
		$('#elementsPanel').toggle();
		sBrowserResized();
	}); 

	$('#clientElements').click(function(){	
		setClientElements(self.elements);
	}); 
	
	self.readWorkfile = function (workfileData) {
		tabbedPanel.readObject(JSON.parse(workfileData));
	};
	
	self.resized = function() {
		tabbedPanel.resized();
	}
	
  return self;
}

/*
[{"selected": 0, "displayed_objects": [
	{"name": "Discharge Signal Plot", 
	"type": "Graph", 
	"nodes": [
		{"id": 1, "name": "C15a/65988", "classname": "Data.DischargeLoader", "position": [-0.8450426577042399, 0.8745421245421245], "properties": [{"name": "Campaign", "type": "String", "value": "\"C15a\""}, {"name": "Discharge", "type": "String", "value": "65988"}, {"name": "DataDir", "type": "String", "value": ""}]}, 
		{"id": 2, "name": "Crop and resample", "classname": "Data.DischargePreprocessing", "position": [-0.5741016028955532, 0.7628205128205128], "properties": [{"name": "SamplingPeriod", "type": "Double", "value": "0.001"}]},\n{"id": 3, "name": "Radiated power", "classname": "Model.SignalSelection", "position": [-0.18527016546018615, 0.8745421245421245], "properties": [{"name": "Signal", "type": "int", "value": "\"signal_06\""}, {"name": "UpperLimit", "type": "double", "value": ""}, {"name": "UpperValue", "type": "double", "value": ""}, {"name": "LowerLimit", "type": "double", "value": "1000"}, {"name": "LowerValue", "type": "double", "value": ""}]},\n{"id": 4, "name": "Maximum", "classname": "Model.SeriesFeature", "position": [0.15599146845915213, 0.9203296703296704], "properties": [{"name": "Feature", "type": "String", "value": "'max'"}]},\n{"id": 5, "name": "Plot signal and max", "classname": "Visualization.SeriesFeaturePlot", "position": [0.4691283292978208, 0.49411764705882355], "properties": [{"name": "Title", "type": "String", "value": "\"Signal 06 and Maximum\""}, {"name": "FeatureStyle", "type": "String", "value": ""}, {"name": "MarkerSize", "type": "int", "value": ""}]},\n{"id": 6, "name": "C15a/66027", "classname": "Data.DischargeLoader", "position": [-0.8311138014527846, -0.6300653594771242], "properties": [{"name": "Campaign", "type": "String", "value": "\"C15a\""}, {"name": "Discharge", "type": "String", "value": "66027"}, {"name": "DataDir", "type": "String", "value": ""}]},\n{"id": 7, "name": "Crop and resample", "classname": "Data.DischargePreprocessing", "position": [-0.5115012106537531, -0.2797385620915033], "properties": [{"name": "SamplingPeriod", "type": "Double", "value": "0.001"}]},\n{"id": 8, "name": "Radiated power", "classname": "Model.SignalSelection", "position": [-0.160411622276029, -0.02875816993464053], "properties": [{"name": "Signal", "type": "int", "value": "\"signal_06\""}, {"name": "UpperLimit", "type": "double", "value": ""}, {"name": "UpperValue", "type": "double", "value": ""}, {"name": "LowerLimit", "type": "double", "value": "1000"}, {"name": "LowerValue", "type": "double", "value": ""}]},\n{"id": 9, "name": "Maximum", "classname": "Model.SeriesFeature", "position": [0.15435835351089588, 0.457516339869281], "properties": [{"name": "Feature", "type": "String", "value": "'max'"}]},\n{"id": 10, "name": "Node 10", "classname": "Visualization.SeriesFeaturePlot", "position": [0.47881355932203395, -0.196078431372549], "properties": [{"name": "Title", "type": "String", "value": ""}, {"name": "FeatureStyle", "type": "String", "value": ""}, {"name": "MarkerSize", "type": "int", "value": ""}]},\n{"id": 11, "name": "Subplots", "classname": "Visualization.SubPlots", "position": [0.8250605326876512, 0.1333333333333333], "properties": [{"name": "Header", "type": "String", "value": "\"Comparison of signals\""}, {"name": "Rows", "type": "int", "value": "1"}, {"name": "Columns", "type": "int", "value": "2"}]},\n{"id": 12, "name": "Inductance", "classname": "Model.SignalSelection", "position": [-0.1918886198547215, 0.5516339869281046], "properties": [{"name": "Signal", "type": "int", "value": "\"signal_03\""}, {"name": "UpperLimit", "type": "double", "value": ""}, {"name": "UpperValue", "type": "double", "value": ""}, {"name": "LowerLimit", "type": "double", "value": "13"}, {"name": "LowerValue", "type": "double", "value": "1"}]},\n{"id": 13, "name": "Inductance", "classname": "Model.SignalSelection", "position": [-0.14104116222760288, -0.4627450980392157], "properties": [{"name": "Signal", "type": "int", "value": "\"signal_03\""}, {"name": "UpperLimit", "type": "double", "value": "13"}, {"name": "UpperValue", "type": "double", "value": "1"}, {"name": "LowerLimit", "type": "double", "value": ""}, {"name": "LowerValue", "type": "double", "value": ""}]}], "connections": [{"from": 1, "to": 2}, {"from": 2, "to": 3}, {"from": 3, "to": 4}, {"from": 3, "to": 5}, {"from": 4, "to": 5}, {"from": 6, "to": 7}, {"from": 7, "to": 8}, {"from": 8, "to": 9}, {"from": 8, "to": 5}, {"from": 9, "to": 5}, {"from": 5, "to": 11}, {"from": 10, "to": 11}, {"from": 2, "to": 12}, {"from": 7, "to": 13}, {"from": 13, "to": 10}, {"from": 12, "to": 10}]}, {"name": "Subplots-run", "type": "WebPage", "url": "../users/paco/Discharges/runs/run_8wr6e6wi/_result.html", "filename": "_code.py"}]} (gui_main.js, line 42)
*/
