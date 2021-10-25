/*
 * Copyright (C) 2021 Francisco Esquembre
/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 * This code is Open Source and is provided "as is".
*/

/**
 * GUI tools
 * @module core
 */

var IODA_RESOURCES = IODA_RESOURCES || {};

IODA_RESOURCES.sSingleton = null;

/**
 * String resources
 * @class stringResources 
 * @constructor  
 */
IODA_RESOURCES.main = function(locale) {
	if (IODA_RESOURCES.sSingleton!=null) return IODA_RESOURCES.sSingleton;
	
	var self = {};
	var mLocale = "en";
	var mStrings = null;

	const sStrings_es = {
		// Main interface
		"Pages" : "Páginas",
		"Please, confirm" : "Por favor, confirme",
		"Disconnect" : "Desconectar",
		"Do you really want to disconnect?": "¿De verdad quiere desconectar del servidor?",
		
		// Projects
		"Choose a project" : "Elija un proyecto",
		"New project" : "Nuevo proyecto",
		"Name" : "Nombre",
		"Description" : "Descripción",
		"Type" : "Tipo",
		"Enter new project name" : "Escriba el nombre del nuevo proyecto",
		"Enter project description" : "Escriba la descripción del proyecto",
		"Create project" : "Crear el proyecto",
		"Open" : "Abrir",
		"A name must be specified!" : "¡Debe especificarse un nombre!",
		
		// Elements
		"Elements" : "Elementos",
		
		// Tabs
		"Create new page" : "Crear una nueva página",
		"Page" : "Página",
		"Graph" : "Gráfico",
		
		// Properties
		"Node Properties" : "Propiedades",
		"(linked)" : "(enlazada)",
		"Connection Link" : "Enlace de la conexión",
		"Source node" : "Nodo de origen",
		"Target node" : "Nodeo destino",
		"Property" : "Propiedad",
		"Trigger when" : "Funciona cuando",
		"(always)" : "(siempre)",
		"Clear link after running" : "Quitar enlace tras ejecutar",
	}

	/**
	 * Sets the locale
	 * @method setLocale
	 * @param locale a string with one of the available locales (e.g. "es"). If null, or non existing, the default will be used
	 */	
	self.setLocale = function(locale) {
		if (locale=="es") {
			mStrings = sStrings_es;
			mLocale = "es";
		}
		else {
			mStrings = null;
			mLocale = "en";
		}
	}
	
	self.getLocale = function() {
		return mLocale;
	}

/*)
title: ejsi18n_string("Create a new simulation")},
	{ id : "openFileButton"   , icon : "assets/icons/open.gif"        , title: ejsi18n_string("Open a file in your workspace")},
	{ id : "openLibraryButton", icon : "assets/icons/openLibrary.gif" , title: ejsi18n_string("Open from a digital library")},
	{ id : "saveButton"       , icon : "assets/icons/save.gif"        , title: ejsi18n_string("Save to file")},
	{ id : "saveAsButton"     , icon : "assets/icons/saveAs.gif"      , title: ejsi18n_string("Save as a new file")},
	{ id : "searchButton"     , icon : "assets/icons/search.gif"      , title: ejsi18n_string("Search in file")},
	{ id : "propertiesButton" , icon : "assets/icons/properties.gif"  , title: ejsi18n_string("Simulation properties")},
	{ id : "runButton"        , icon : "assets/icons/run.gif"         , title: ejsi18n_string("Run simulation")},
	{ id : "translateButton"  , icon : "assets/icons/translate.gif"   , title: ejsi18n_string("Translate simulation")},
	{ id : "packageButton"    , icon : "assets/icons/package.gif"     , title: ejsi18n_string("Package simulation")},
	{ id : "optionsButton"    , icon : "assets/icons/options.gif"     , title: ejsi18n_string("Web EJS options")},
	{ id : "infoButton"       , icon : "assets/icons/info.gif"        , title: ejsi18n_string("Info and help")}
];
*/

	/**
	 * Returns the locale for the keyword string
	 * @method getString
	 * @param keyword the keyword for the desired localized string. If not found, [?] will be prepended to the keyword, instead
	 */	
	self.getString = function(keyword) {
		if (mStrings==null) return keyword;
		if (keyword in mStrings) return mStrings[keyword];
		return "[?] " + keyword;
	}
	
	if (locale!=null) self.setLocale(locale);
	IODA_RESOURCES.sSingleton = self;
	
	return self;
	
}
