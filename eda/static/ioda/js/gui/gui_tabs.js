/*
 * Copyright (C) 2021 Francisco Esquembre 
 * This code is part of the Fusion IODA project
 */

/**
 * WebEJS_GUI
 * @module core
 */

var IODA_GUI = IODA_GUI || {};


/**
 * IODA_GUI.tabbedPanel
 * Base class (needs owewriting some methods) for a panel with tabs.
 * Each tab hosts a given page, which is a 'subclass' of  WebEJS_GUI.tabbedPage
 */
/**
 * @class tabbedPannel 
 * @constructor  
 */
IODA_GUI.tabbedPanel = function(mId) {
	var self = {};

	var mHashNumber = 0; // An ever increasing tab hash
	var mPages = {};			// An dictionary with the pages as objects
	
	var mMainPanel  = jQuery("<div/>" , { class: "d-flex flex-column h-100", style:"flex-grow:1" });
	var mTabNav     = jQuery("<ul/>"  , { class:"nav nav-tabs", id:mId+"-ul", role:"tablist"}).appendTo(mMainPanel);
	var mTabContent = jQuery("<div/>" , { class:"tab-content", style:"flex-grow:1"}).appendTo(mMainPanel);

	// This is required for flex working fine with tabs!!!
	mTabNav.on("click","button",(event)=>{
		var activeHash = event.currentTarget.parentElement.dataset.hash;
		$('.mTabContentDiv').each(function () {
			if ($(this).data('hash')==activeHash) $(this).removeClass('d-none');
			else $(this).addClass('d-none');
		});
		mPages[activeHash].resized();
	});

	mTabNav.on("click","i",(event)=>{
		var hash = event.currentTarget.parentElement.parentElement.dataset.hash;
		editPage(mPages[hash]);
	});

	function editPage(pageToEdit) {
		var itemList = [];
		var pageHash=null;
		$('.mTabContentDiv').each(function () {
			const hash = $(this).data('hash')
			var page = mPages[hash];
			if (page==pageToEdit) pageHash = hash;
			itemList.push( { 'hash' : hash, 'name' : page.getTitle() }); 
		});
		var itemToEdit = (pageToEdit==null) ? null : { 'hash' : pageHash, 'name' : pageToEdit.getTitle()};

		var listener = function(action, arguments) { // newName, relativePosition, relativeToTabHash) {
			switch(action) {
				case 'Duplicate' : 
					sMainNameForm.show(duplicateCurrentPage,getActiveTitle()+" (copy)",null,
						"Duplicate page", sMainRes.getString("Duplicate"));
					break;
				case 'Delete' : 
					sMainConfirmationForm.show(removeCurrentPage,getActiveTitle(),
						"Do you really want to delete this page?",sMainRes.getString("Delete"));
					break;
				case 'Apply' : 
					if (arguments['name'].trim().length>0 && arguments['name']!=pageToEdit.getTitle()) renameCurrentPage(arguments['name']);
					if (arguments['relative_object']!=null) moveTab (arguments['relative_position'], arguments['relative_object'])
					break;
			}
		};
		IODA_GUI.editionForm('Page', itemToEdit, itemList, listener, { 'can_duplicate' : true })
	}
	
	// -----------------------------
	// Serialization
	// -----------------------------
	
	self.saveObject = function() {
		var objectArray = [];
		var selected = -1;
		mTabNav.find('button').each(function (index) {
			var hash = $(this).parent().data('hash');
			var page = mPages[hash];
			objectArray.push(page.saveObject());
			if ($(this).hasClass('active')) selected = index;
		});
		return { 'selected' : selected, 'displayed_objects': objectArray };
	}

	self.readObject = function(saved) {
		removeAllTabs();
		var dObjects = saved['displayed_objects'];
		if (dObjects) { // else, it is empty!
			var selected = saved['selected'];
			for (var i=0; i<dObjects.length; i++) {
				var entry = dObjects[i];
				var page = appendPage(entry['name'],entry['type']);
				page.readObject(entry);
			}
			setActiveTab(selected);
		}
	}

	// --------------------------
	// Tabs utils
	// --------------------------

	const sTabTemplate = 
		'<li class="nav-item" id="'+mId+'-li-#{hash}" data-hash="#{hash}" role="presentation">'+
			'<button class="nav-link" id="'+mId+'-tab-#{hash}" '+
				'data-bs-toggle="tab" data-bs-target="#'+mId+'-content-#{hash}" '+ 
				'type="button" role="tab" aria-controls='+mId+'-content-#{hash}" aria-selected="false">'+
				 //'<i class="bi bi-stickies"></i>'+
				'#{label}'+
			'</button>'+
		'</li>';
		
	const sContentTemplate =
		'<div class="mTabContentDiv tab-pane fade col-12 h-100 d-flex flex-row-reverse  mx-auto"'+
				'id="'+mId+'-content-#{hash}" data-hash="#{hash}" role="tabpanel" aria-labelledby="'+mId+'-tab-#{hash}">'+
			//'<div id="'+mId+'-content-div-#{hash}" class="tabContent h-100">'+
			//'</div>'+
		'</div>';

	function removeAllTabs() {
		mTabNav.empty();
		for (const key in mPages) {
			$( key ).remove();
		}
		mPages = {};
		mHashNumber = 0;
	}
	
	function fullTabTitle(type,title) {
		switch (type) {
			case 'Graph_run' : return '<i class="m-0 me-2 bi bi-collection-play" style="font-size: 1rem;"></i>'+ title;
			case 'Graph'     :
			default          : return '<i class="m-0 me-2 bi bi-diagram-2"       style="font-size: 1rem;"></i>'+ title;
		}
	}

				
	function appendTab(hash, title, type) {
		var li = $( sTabTemplate.replace( /#\{hash\}/g, hash )
								.replace( /#\{label\}/g, fullTabTitle(type,title) ) );
		var div = $( sContentTemplate.replace( /#\{hash\}/g, hash ) );
		mTabNav.append(li);
		mTabContent.append(div);
		return { 'li' : li, 'div' : div };
	}
	
	/**
	 * returns the active button of the tab UL
	 */
	function getTabByHash(hash) {
		var found = null;
		mTabNav.find('button').each(function (index) {
			var buttonHash = $(this).parent().data('hash');
			if (buttonHash==hash) found = $(this).parent();
		});
		return found;
	}

	function getActiveTab() {
		var buttons = $("ul#"+mId+"-ul button.active")
		if (buttons.length==0) return null;
		else return buttons.parent();
	}
	
	function setActiveTab(tabIndex) {
		var max = mTabNav.find('button').length;
		tabIndex = Math.min(max-1,Math.max(0,tabIndex));
		var activeHash = -1;
		mTabNav.find('button').each(function (index) {
			if (index==tabIndex) {
				$(this).addClass('active');
				activeHash = $(this).parent().data('hash');
			}
			else $(this).removeClass('active');
		});
		$('.mTabContentDiv').each(function () {
			if ($(this).data('hash')==activeHash) {
				$(this).addClass('active show');
				$(this).removeClass('d-none');
			}
			else {
				$(this).addClass('d-none');
				$(this).removeClass('active show');
			}
		});
	}

	function getActiveHash() {
		var tab = getActiveTab();
		if (!tab) return -1;
		return tab.data('hash');
	}

	function getActiveTitle() {
		var tab = getActiveTab();
		if (!tab) return null; // None selected
		return tab.text();
	}

	function setActiveTitle(title) {
		var tab = getActiveTab();
		if (!tab) return -1;
		const hash = tab.data('hash');
		var button = $("ul#"+mId+"-ul button.active");
		button.html(fullTabTitle(mPages[hash].getType(),title));
		return hash;
	}
	
	function removeCurrentTab() {
		var tab = getActiveTab();
		if (!tab) return -1;
		var position = tab.index();
		var hash = tab.data('hash');
		var div = $('#'+mId+'-content-'+hash);
		tab.remove();
		div.remove();
		setActiveTab(position-1);
		return hash;
	}

	function moveCurrentTabLeft () {
		var tab = getActiveTab();
		if (!tab) return;
		var prev = tab.prev();
		if (prev.length>0) tab.detach().insertBefore(prev);
	};

	function moveCurrentTabRight () {
		var tab = getActiveTab();
		if (!tab) return;
		var next = tab.next();
		if (next.length>0) tab.detach().insertAfter(next);
	};
	
	function selectLastTabAndMoveItAfterCurrentTab (doNotSelectIt) {
		var tab = getActiveTab();
		if (!tab) {
			setActiveTab(mTabNav.length-1);
		}
		else {
			var index = tab.index();
			var last = tab.siblings(":last");
			last.detach().insertAfter(tab);
			if (!doNotSelectIt) setActiveTab(index+1);
		}
	}

	function moveTab (relativePosition, relativeToTabHash) {
		var tab = getActiveTab();
		var relativeToTab = getTabByHash(relativeToTabHash);
		if (relativeToTab==null) return;
		var index = relativeToTab.index();
		if (relativePosition=="before") {
			tab.detach().insertBefore(relativeToTab);
			setActiveTab(index);
		}
		else {
			tab.detach().insertAfter(relativeToTab);
			setActiveTab(index+1);
		}
	}

	// --------------------------
	// Commands
	// --------------------------

	function titleExists(title) {
		for (var hash in mPages) {
			if (mPages[hash].getTitle()===title) return true;
		}
		return false;
	}

	function getUniqueName() {
		const prefix = sMainRes.getString("Page")+" ";
		for (var index=1; index<1000; index++) {
			var title = prefix+index;
			if (!titleExists(title)) return title;
		}
		return sMainRes.getString("Page");
	}

	function getActivePage() {
		var hash = getActiveHash();
		if (hash<0) return null;
		return mPages[hash];
	}

	function newPage(name, type) {
		appendPage(name, type);
		selectLastTabAndMoveItAfterCurrentTab();
	}
	
	function duplicateCurrentPage(name) {
		var origHash = getActiveHash();
		if (origHash<0) return;
		var origPage = mPages[origHash];
		var page = appendPage(name, origPage.getType());
		page.readObject(origPage.saveObject());
		page.setTitle(name); // the reading of the old page removed that
		selectLastTabAndMoveItAfterCurrentTab();
	}
	
	function appendPage(name, type) {
		var id = mId+"-" + mHashNumber;
		var parentStruct = appendTab(mHashNumber,name,type);
		var page;
		switch (type) {
			case 'Graph_run' : 
				page = IODA_GUI.graphEditPage(id, name, parentStruct.div, true); // true = isRunReplay  
				$('#'+mId+'-tab-'+mHashNumber).addClass('text-success');
				break;		
			case 'Graph' :
			default : 
				page = IODA_GUI.graphEditPage(id, name, parentStruct.div,false); 
				$('#'+mId+'-tab-'+mHashNumber).addClass('text-primary');
				break;
		}
		mPages[mHashNumber] = page;
		page.setType(type);
		mHashNumber++;
		return page;
	}
	
	function removeCurrentPage() {
		var hash = removeCurrentTab();
		if (hash>=0) mPages[hash] = null;
	}

	function renameCurrentPage(name) {
		var hash = setActiveTitle(name);
		if (hash<0) return;
		mPages[hash].setTitle(name);
	}
	
	self.command = function(command) {
		if (command=='PageCreate') {
			sMainNameForm.show(newPage,getUniqueName(),"Graph","Create a new page","Create");
			return;
		}
	}

	// --------------------------
	// Processing run results
	// --------------------------

	self.readRunResult = function(graphData, resultsData) {
		var page = appendPage(graphData['name'], 'Graph_run');
		page.readObject(graphData['client_object']);
		page.setResultsData(resultsData);
		selectLastTabAndMoveItAfterCurrentTab(true); // do not select it
		sShowMessage("New page added", "Run result from graph: "+graphData['name'])
	}

	// --------------------------
	// When saving the workspace in the server
	// --------------------------

	self.getResourcesIDList = function() {
		var resourcesArray = [];
		mTabNav.find('button').each(function (index) {
			var hash = $(this).parent().data('hash');
			var page = mPages[hash];
			var resourcesID = page.getResourcesID();
			if (resourcesID!=null) resourcesArray.push(resourcesID);
		});
		return resourcesArray;
	}
	
	// --------------------------
	// Workpanel common API
	// --------------------------

	self.verbose = function() {
		console.log (self.saveObject());
	}

	self.getMainPanel = function() {
		return mMainPanel;
	}
	
	self.resized = function() {
		var page = getActivePage();
		if (page!=null) page.resized();
/*
		mTabNav.find('button').each(function () {
			var hash = $(this).parent().data('hash');
			mPages[hash].resized(width,heigth);
		});
*/
	}

	// --------------------------
	// Tabs API
	// --------------------------


	self.toggle = function(left) {
		var page = getActivePage();
		if (page!=null) page.toggle(left);
	}
	
	return self;
}



/**
 * IODA_GUI.tabbedPage
 * Base class (needs owewriting some methods) for a page for a WebEJS_GUI.tabbedPanel
 * @param title a String for the title of teh page in the tab
 */
IODA_GUI.tabbedPage = function(id,title) {
	var self = {};
	var mTitle = title;
	var mType = "Graph";
	var mResourcesID = null;

	self.setTitle = function(new_title) { mTitle = new_title; }
	self.getTitle = function()          { return mTitle; }

	self.setType  = function(type)      { mType = type; }
	self.getType  = function()          { return mType; }

	self.setResourcesID  = function(id)  { mResourcesID = id; }
	self.getResourcesID  = function()    { return mResourcesID; }

	/**
	 * saveObject
	 * @returns an object which allows saving the page information into a file 
	 */
	self.saveObject = function() {
		return { 
			'name' : mTitle, 
			'type' : mType, 
			'resources' : mResourcesID };
	}

	/**
	 * readObject
	 * @param saved an object which allows retrieving the page information 
	 * from a file, typically created previously with saveObject(). 
	 */
	self.readObject = function(saved) {
		if (saved['name']) self.setTitle(saved['name']);
		if ('resources' in saved) mResourcesID = saved['resources'];
	}

	/**
	 * toggle one of its internal 'windows' 
	 */
	self.toggle = function() {}

	/**
	 * resized
	 */
	self.resized = function() {}
		
	return self;
}
	