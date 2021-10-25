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
				//'<form action="." name="mFormsNameForm" id="mFormsNameForm">'+
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
				//'</form>'+
			'</div>'+
			'<div class="modal-footer">'+
				'<button type="button" id="mFormsNameClose" class="btn btn-secondary" data-dismiss="modal">'+sMainRes.getString("Close")+'</button>'+
				'<button type="button" id="mFormsNameButton" class="btn btn-primary float-left">'+sMainRes.getString("Create page")+'</button>'+
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
		//var form = document.forms['mFormsNameForm'];
		//var name = form['mFormsNameField'].value;
		//var type = form['mFormsTypeSelect'].value; 
		var name = $('#mFormsNameField').val();
		var type = $('#mFormsTypeSelect').val();
		if ( name == "" || name == null) return;
		if (mListener) mListener(name,type);
	});

	
	self.show = function(listener, name, type, title, button) {
		if (title)   $('#mFormsNameTitle').text(sMainRes.getString(title)); 
		if (button)  $('#mFormsNameButton').text(sMainRes.getString(button));
//		var form = document.forms['mFormsNameForm'];
		//var name = form['mFormsNameField'].value = name; 
		$('#mFormsNameField').val(name);
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
			'<div id="mFormsConfirmationMessage" class="modal-body">'+
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
		$('#mFormsConfirmationTitle').text(sMainRes.getString(title)); 
	  $('#mFormsConfirmationMessage').html('<p class="col-12">'+sMainRes.getString(message)+'</p>');
		$('#mFormsConfirmationButton').text(sMainRes.getString(button));
		mListener = listener;
		mModal.show();
	}
	return self;
}
