/*
 * Copyright (C) 2021 Francisco Esquembre 
 * This code is part of the Fusion IODA project
 */
/**
 * GUI tools
 * @module core
 */

var IODA_GUI = IODA_GUI || {};

IODA_GUI.graphPage = function(id, title) {
	var self = IODA_GUI.tabbedPage(id,title);
	const super_saveObject = self.saveObject;
	const super_readObject = self.readObject;


	var mCenterDiv  = jQuery("<div/>", { class: "sTabCenter" }).appendTo(self.getMainPanel());
//	jQuery("<nav/>", { 
//		class: "navbar navbar-expand-lg navbar-light bg-light",
//		}).appendTo(mCenterDiv);
	var mRightAside  = jQuery("<nav/>", { id: id+"-right", class: "sTabRight" }).appendTo(self.getMainPanel());
	jQuery("<div/>", { class: "sidebar-header", html: "<h3>Properties</h3>" }).appendTo(mRightAside);

	var mTextArea = jQuery("<textarea/>", { class: "sTabCenter" , text : "<h1>"+title+"</h1>"});
	mCenterDiv.append(mTextArea);
/*
	var mEditor = SUNEDITOR.create(mTextArea,{
			// All of the plugins are loaded in the "window.SUNEDITOR" object in dist/suneditor.min.js file
			// Insert options
			toolbarContainer : '#'+id,
			resizingBar: false,
			showPathLabel : false,
			charCounter : true,
			//maxCharCount : 720,
			width : '100%',
			//maxWidth : '700px',
			height : '100%',
//    minHeight : '100px',
//    maxHeight: '250px',
			buttonList : [
        ['undo', 'redo', 'font', 'fontSize', 'formatBlock'],
        ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript', 'removeFormat'],
        //'/' // Line break
        ['fontColor', 'hiliteColor', 'outdent', 'indent', 'align', 'horizontalRule', 'list', 'table'],
        ['link', 'image', 'video', 'fullScreen', 'showBlocks', 'codeView', 'preview']
			],
			lang: SUNEDITOR_LANG[mRes.getLocale()]
		});


*/
	self.saveObject = function() {
		var object = super_saveObject();
		return object;
	}

	self.readObject = function(saved) {
		super_readObject(saved);
		self.setContents(saved['displayed_objects']);
	}
/*
	self.toString = function() {
		return "title : "+self.getTitle()+"\n"+
		       "content : "+mEditor.getContents();
	}

	self.setEditor = function(editor) {
		mEditor = editor;
	}
*/
	self.setContents = function(contents) {
		//mEditor.setContents(contents);
		mTextArea.value = contents;
	}
	
	self.toggle = function () {
		//if (left) $('#'+ id+"-left").toggle();
		//else 
		$('#'+ id+"-right").toggle();
	}

	return self;
}


