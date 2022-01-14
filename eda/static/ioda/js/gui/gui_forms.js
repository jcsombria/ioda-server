/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the Web EJS authoring and simulation tool
 */

/**
 * GUI forms
 * @module core
 */
var IODA_GUI = IODA_GUI || {};

/**
	* Creates a form to ask for a new name
 */
IODA_GUI.nameForm = function() {
	var self = {};

	var MODAL_HTML =
	'<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">'+
		'<div class="modal-content">'+
			'<div class="modal-header">'+
				'<h5 id="mFormsNameTitle" class="modal-title">New page</h5>'+
				'<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>'+
			'</div>'+
			'<div class="modal-body">'+
					'<div class="input-group mb-3">'+
						'<span class="input-group-text" id="mFormsNameLabel">'+sMainRes.getString("Name")+'</span>'+
						'<input type="text" class="form-control" id="mFormsNameField" '+
							'placeholder="Page name here" aria-label="Page name" aria-describedby="mFormsNameLabel">'+
					'</div>'+

					'<div class="input-group mb-3" id="mFormsNameTypeGroup">'+
						'<span class="input-group-text" id="mFormsNameTypeLabel">'+sMainRes.getString("Type")+'</span>'+
						'<select class="form-select" id="mFormsTypeSelect" '+
									'aria-label="Page type" aria-describedby="mFormsNameTypeLabel">'+
							'<option selected value="Graph"   >'+sMainRes.getString("Graph")+'</option>'+
							'<option value="Code"    >'+sMainRes.getString("Code")+'</option>'+
							'<option value="WebPage" >'+sMainRes.getString("Web page")+'</option>'+
						'</select>'+
					'</div>'+
/*
					'<div class="mb-2">'+
						'<label id="mFormsNameLabel" for="mFormsNameField" class="form-label form-label-sm">'+
							sMainRes.getString("Name")+'</label>'+
						'<input type="text" class="form-control form-control-sm" name="mFormsNameField" id="mFormsNameField" '+
							' placeholder="'+sMainRes.getString("Page name")+'" >'+
					'</div>'+
					
					'<div id="mFormsNameTypeGroup" class="input-group input-group-sm me-1" style="flex-grow: 5">'+
						'<span class="input-group-text p-1 pe-2">'+sMainRes.getString("Type")+'</span>'+
						'<select class="form-select" id="mFormsTypeSelect">'+
							'<option selected value="Graph"   >'+sMainRes.getString("Graph")+'</option>'+
							'<option value="Code"    >'+sMainRes.getString("Code")+'</option>'+
							'<option value="WebPage" >'+sMainRes.getString("Web page")+'</option>'+
						'</select>'+
					'</div>'+
					*/

			'</div>'+
			'<div class="modal-footer">'+
				'<button type="button" id="mFormsNameClose"  class="btn btn-secondary" >'+sMainRes.getString("Close")+'</button>'+
				'<button type="button" id="mFormsNameButton" class="btn btn-primary"   >'+sMainRes.getString("Create page")+'</button>'+
			'</div>'+
		'</div>'+
	'</div>';
	
	$('#sMainNameModal').html(MODAL_HTML);
	var mModal = new bootstrap.Modal(document.getElementById('sMainNameModal'));
	var mListener;

	$('#mFormsNameClose').click(function() {
		mModal.hide();
	});
	
	$('#mFormsNameButton').click(function() {
		mModal.hide();
		var name = $('#mFormsNameField').val();
		var type = $('#mFormsTypeSelect').val();
		type = "Graph";
		if ( name == "" || name == null) return;
		if (mListener) mListener(name,type);
	});

	
	self.show = function(listener, name, type, title, button) {
		if (title)   $('#mFormsNameTitle').text(sMainRes.getString(title)); 
		if (button)  $('#mFormsNameButton').text(sMainRes.getString(button));
		$('#mFormsNameField').val(name);
		type = false;
		if (type) {
			$('#mFormsNameTypeGroup').show();
			//form['mFormsTypeSelect'].value = type;
		}
		else $('#mFormsNameTypeGroup').hide();
		mListener = listener;
		mModal.show();
	}
	
	return self;
}

/**
	* Creates a form to ask for confirmation
 */
IODA_GUI.confirmationForm = function() {
	var self = {};
		
	const MODAL_HTML =
	'<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">'+
		'<div class="modal-content">'+
			'<div class="modal-header">'+
				'<h5 id="mFormsConfirmationTitle" class="modal-title">Confirmation</h5>'+
				'<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>'+
			'</div>'+
			'<div id="mFormsConfirmationMessage" class="modal-body" style="max-height:500px; overlow-y: auto">'+
				'<p class="col-12">Do you really want to do this?</p>'+
			'</div>'+
			'<div class="modal-footer">'+
				'<button type="button" id="mFormsConfirmationClose" class="btn btn-secondary" data-dismiss="modal">Close</button>'+
				'<button type="button" id="mFormsConfirmationButton" class="btn btn-primary float-left">Confirm</button>'+
			'</div>'+
		'</div>'+
	'</div>';

	$('#sMainMultiuseModal').html(MODAL_HTML);
	$('#mFormsConfirmationTitle').text(sMainRes.getString("Please, confirm"));
	var mModal = new bootstrap.Modal(document.getElementById('sMainMultiuseModal'))
	var mListener;

	$('#mFormsConfirmationClose').click(function() {
		mModal.hide();
	});
	
	$('#mFormsConfirmationButton').click(function() {
		mModal.hide();
		if (mListener) mListener();
	});
	
	self.show = function(listener, title, message, button) {
		$('#mFormsConfirmationTitle').text(title); 
	  $('#mFormsConfirmationMessage').html('<p class="col-12">'+message+'</p>');
		$('#mFormsConfirmationButton').text(button);
		mListener = listener;
		mModal.show();
	}
	return self;
}

/**
	* Creates a form to ask for confirmation
 */
IODA_GUI.messageForm = function() {
	var self = {};
		
	const MODAL_HTML =
	'<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">'+
		'<div class="modal-content">'+
			'<div class="modal-header">'+
				'<h5 id="mFormsMessageTitle" class="modal-title text-warning bg-dark">Message</h5>'+
				'<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>'+
			'</div>'+
			'<div id="mFormsMessageText" class="modal-body">'+
				'<p class="col-12">Here is the message</p>'+
			'</div>'+
			'<div class="modal-footer">'+
				'<button type="button" id="mFormsMessageClose" class="btn btn-secondary" data-dismiss="modal">Ok</button>'+
			'</div>'+
		'</div>'+
	'</div>';

	$('#sMainMessageModal').html(MODAL_HTML);
	var mModal = new bootstrap.Modal(document.getElementById('sMainMessageModal'))

	$('#mFormsMessageClose').click(function() {
		mModal.hide();
	});
		
	self.show = function(title, message, closeText) {
		$('#mFormsMessageTitle').text(sMainRes.getString(title)); 
	  $('#mFormsMessageText').html('<p class="col-12">'+sMainRes.getString(message)+'</p>');
		$('#mFormsMessageClose').text(sMainRes.getString(closeText));
		mModal.show();
	}
	return self;
}

/**
	* Creates a modal window with options for renaming, reicon, reposition, duplicating, and deleting an item in a list
	* @param mTypeOfItem : a translatable string, 'page', 'element', 'project',... 
	* @param mItemToEdit : a dict { hash, name } for item being edited: hash is a unique identifies, name is a text to display for, the item
	* @param mItemList : a list of dicts { hash, name } of other items in the collection
	* @param mListener : a function to call on action
	* @param mOptions : a dict with options
 */
IODA_GUI.editionForm = function(mTypeOfItem, mItemToEdit, mItemList, mListener, mOptions) {
		var locationHTML = "";
		if ((mItemToEdit==null && mItemList.length>0) || (mItemToEdit!=null && mItemList.length>1)) {
			locationHTML +=
				'<div class="mb-3">'+
				'  <label class="form-label">'+sMainRes.getString("Place it")+'</label>'+
				'  <div class="input-group-text" id="mFormsEditionLocation">'+
				(mItemToEdit==null ? '': 
				  '   <span class="form-check form-check-inline">'+
				  '     <input class="form-check-input" type="radio" checked '+
				 			  'name="mFormsEditionLocationOptions" id="mFormsEditionLocationAsIs" value="as_is">'+
				  '     <label class="form-check-label" for="mFormsEditionLocationAsIs">'+sMainRes.getString("As is")+'</label>'+
				  '   </span>'
				)+
				  '   <span class="form-check form-check-inline">'+
				  '     <input class="form-check-input" type="radio" '+
				 			  'name="mFormsEditionLocationOptions" id="mFormsEditionLocationBefore" value="before">'+
				  '     <label class="form-check-label" for="mFormsEditionLocationBefore">'+sMainRes.getString("Before")+'</label>'+
				  '   </span>'+
				  '   <span class="form-check form-check-inline">'+
				  '     <input class="form-check-input" type="radio" ' + (mItemToEdit==null ? ' checked ' : '')+
				 			  'name="mFormsEditionLocationOptions" id="mFormsEditionLocationAfter" value="after">'+
				  '     <label class="form-check-label" for="mFormsEditionLocationAfter">'+sMainRes.getString("After")+'</label>'+
				  '   </span>'+
			  '    <select class="form-select" id="mFormsEditionLocationList">';
				mItemList.forEach(function(item,index) {
					if (mItemToEdit==null) {
						if (index==mItemList.length-1) locationHTML += '<option selected value="'+item.hash+'">'+item.name+'</option>';
						else                           locationHTML += '<option          value="'+item.hash+'">'+item.name+'</option>';			
					}
					else if (item.hash!=mItemToEdit.hash) {
						locationHTML += '<option value="'+item.hash+'">'+item.name+'</option>';			
					}
				});
			locationHTML += ''+
				'    </select>'+
				'  </div>'+
				'</div>';
		}
		
		const itemLabel = ' '+sMainRes.getString(mTypeOfItem);
		const basicHtml =
			'<div class="input-group mb-3 mt-3">'+
				'<span class="input-group-text" id="mFormsEditionNameLabel">'+sMainRes.getString("Name")+'</span>'+
				'<input type="text" class="form-control" id="mFormsEditionNameField" '+
					(mItemToEdit!=null ? 'value="'+mItemToEdit.name+'" ' : '') +
					'placeholder="Item name here" aria-label="Item name" aria-describedby="mFormsEditionNameLabel">'+
			'</div>'+
			( mOptions.has_description ? 
			'<div class="input-group mb-3 mt-3">'+
				'<span class="input-group-text" id="mFormsEditionDescriptionLabel">'+sMainRes.getString("Description")+'</span>'+
				'<input type="text" class="form-control" id="mFormsEditionDescriptionField" '+
					(mItemToEdit!=null ? 'value="'+mItemToEdit.description+'" ' : '') +
					'placeholder="Item description here" aria-label="Item name" aria-describedby="mFormsEditionDescriptionLabel">'+
			'</div>'
			: '' )+
			( mOptions.has_icon ? 
			'<div class="input-group mb-3">'+
			'    <label class="input-group-text" for="mFormsEditionIconField" class="form-label">'+sMainRes.getString("Image")+'</label>'+
			'    <label class="input-group-text bg-white" id="mFormsEditionIconButton">'+
			'      <img id="mFormsEditionIconImage" width="128" height="128" '+
					((mItemToEdit!=null && mItemToEdit.image!=null) ? 'src="'+sMainGetServerURL(mItemToEdit.image)+'" ' : '') +
			'      >'+
			' 	 </label>'+
//			'    <label class="form-label">'+sMainRes.getString("Change the image")+'</label>'+
			'    <input class="form-control" accept="image/*"  id="mFormsEditionIconField" type="file">'+
			'</div>'
			: '' )+
			locationHTML +
			(mItemToEdit!=null ? 
				( mOptions.can_duplicate ? 
			'<div class="input-group mb-3">'+
				'<button type="button" class="w-100 btn btn-warning" data-action="Duplicate">'+sMainRes.getString("Duplicate")+itemLabel+'</button>'+
			'</div>'
				: '' )+
			'<div class="input-group mb-3">'+
				'<button type="button" class="w-100 btn btn-danger" data-action="Delete">'+sMainRes.getString("Delete")+itemLabel+'</button>'+
			'</div>'
			: '' );

		const modalHtml =   
			'<div class="modal-dialog modal-dialog-centered modal-dialog-scrollable '+ (mOptions.help_html==null ? '' : 'modal-lg')+'">'+
				'<div class="modal-content">'+
					'<div class="modal-header">'+
						'<h5 class="modal-title">'+ sMainRes.getString('Edit')+itemLabel+'</h5>'+
						'<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>'+
					'</div>'+
					'<div class="modal-body">'+
						basicHtml +
					'</div>'+
					'<div class="modal-footer">'+
						'<button type="button" class="btn btn-secondary" data-action="Close">'+sMainRes.getString("Close")+'</button>'+
						'<button type="button" class="btn btn-primary"   data-action="Apply">'+sMainRes.getString("Apply")+'</button>'+
					'</div>'+
				'</div>'+
			'</div>';
			 
		$('#sMainEditModal').html(modalHtml);
	  var modal = new bootstrap.Modal(document.getElementById('sMainEditModal'));

		$('#mFormsEditionIconField').on('change', function(event){
			$('#mFormsEditionIconImage').attr("src",URL.createObjectURL(event.target.files[0]));
		});

	  $('#sMainEditModal .modal-content button').click(function(event) {
			const action = event.currentTarget.dataset.action;
			if (!action) return;
			switch(action) {
				case 'Close' : 
					modal.hide(); 
					break;
				case 'Apply' : 
					modal.hide(); 
					var arguments = {}
					arguments['name'] = $('#mFormsEditionNameField').val();
					
					var locationChecked = $('input[name=mFormsEditionLocationOptions]:checked');
					arguments['relative_position'] = (locationChecked.length>0) ?  locationChecked.val() : 'as_is';
					var objectSelected = $('#mFormsEditionLocationList option:selected');
				  arguments['relative_object'] = (objectSelected.length>0) ?  objectSelected.val() : '';

					if (mOptions.has_description) {
						arguments['description'] = $('#mFormsEditionDescriptionField').val();
					}
					arguments['base64Icon']  ='';
					if (mOptions.has_icon) {
						if ( $('#mFormsEditionIconField').val().trim().length>0) 
							arguments['base64Icon'] = IODA_GUI.getBase64("mFormsEditionIconImage");					
					}
					
					mListener(action,arguments);
					break;
				default : 
					modal.hide();
					mListener(action, null);
					break;
			}
		});	
		modal.show();
}

	
IODA_GUI.getBase64 = function(imageElementID) {
		var image = document.getElementById(imageElementID);
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext('2d');
		canvas.height = image.naturalHeight;
		canvas.width = image.naturalWidth;
		ctx.drawImage(image, 0, 0);

		// Unfortunately, we cannot keep the original image type, so all images will be converted to PNG
		// For this reason, we cannot get the original Base64 string
		var uri = canvas.toDataURL('image/png');
		var base64Image = uri.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');		
		canvas.remove();
		return 	base64Image;	
	};
	
	