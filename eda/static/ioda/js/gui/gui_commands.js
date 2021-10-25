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
 * This dictionary is used to associate DOM elements
 * with javascript objects. It is used to send GUI commands
 * to different objects
 */

IODA_GUI.commandCenter = function() {
	const mRes = IODA_RESOURCES.main();
	
	var self = {};
	var mObjectRegister = {}; 
			
	self.registerObject = function (id,object) {
		mObjectRegister[id] = object;
	}

	self.sendCommand = function (id,command) {
		mObjectRegister[id].command(command);
	}
	
	return self;
}


