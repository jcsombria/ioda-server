/*
 * Copyright (C) 2021 Francisco Esquembre
 * This code is part of the IODA tool
 *
 * This code is Open Source and is provided "as is".
*/

var IODA_COMMUNICATION = IODA_COMMUNICATION || {};

/**
   * Creates a IODA client connected to the server via Sockets
   * @param mListener the listener that processes the communication API
   * the listener must implement the following functions:
   * <ul>
   *   <li>onConnection(info): called when connection happens</li>
   *   <li>onDisconnection(): called when disconnection happens</li>
   *   <li>showMessage(string, string): called whenever a message is called</li>
   *   <li>loadProject(data): to load a project description</li>
   *   <li>readWorkfile(data): to read an object data</li>
   *   <li>clearData(): removes all data</li>
   *   <li>addPage(data): adds a page of data</li>
   * </ul>
   */
IODA_COMMUNICATION.SocketIODAClient = function() {
	var self = {};
	var mSocketClient;
	var mListener = IODA_COMMUNICATION.Listener(self);


	self.isConnected = function() { return mSocketClient.isConnected(); }

	self.getListener = function() { return mListener; }

	// -------------------------------
	// Output commands API
	// -------------------------------

	/**
	 * Send a generic message to the server 
	 */
	function sendMessage(key,data) {
		var message = data ? { key : key , data : data } : { key : key };
		mSocketClient.sendMessage(JSON.stringify(message));
	};

	// --- login/logout 
	
	self.login = function(url, username, password) {
		mSocketClient.onConnectionOpened = function() {
			sendMessage("login", { name : username, password: password } );
			mSocketClient.onConnectionOpened = null;
		};
		mSocketClient.start(url);
	}

	self.logout = function() {
		sendMessage("logout");
	}

	// --- Projects 

	self.getProjectsInfo = function() {
		sendMessage("get_projects_info");
	}
	
	self.setProject = function(projectData) {
		sendMessage("set_project", projectData);
	}

	self.renameProject = function(newName) {
		sendMessage("edit_project", { 'name' : mListener.getProjectName(),'new_name' : newName });
		mListener.setProjectName(newName);
	}

	self.deleteProject = function() {
		sMainConfirmationForm.show(function(){
				sendMessage("edit_project", { 'name' : mListener.getProjectName(),'delete' : true });
				sendMessage("logout");
			},
			mListener.getProjectName(), "WARNING!!! This action CANNOT be undone!!!<br>Do you really want to delete this project?", 
			sMainRes.getString("Delete"));
	}

	self.setProjectDescription = function(name, description) {
		sendMessage("edit_project", { 'name' : name,'description' : description });
	}

	// --- workfile 

	self.getWorkfile = function() {
		sendMessage("get_workfile");
	}

	self.saveWorkfile = function(workfileData, resourcesIDList) {
		sendMessage("save_workfile", {'workfile' : workfileData , 'resources_list' : resourcesIDList });
	}

	// --- run graph 

	self.runGraph = function(graphData) {
		sendMessage("run_graph", graphData);
	}

	self.userElementCommand = function(data) {
		sendMessage("user_elements", data);
	}

	// -------------------------------
	// Input messages
	// -------------------------------

	function processLoginReply(data) {
		switch(data.result) {
			case "no_username" :
				mListener.showMessage('Connection failed',"No username provided!");
				mSocketClient.onConnectionClosed = closedByClient;
				break;
			case "unknown_username" :
				mListener.showMessage('Connection failed',"Username not registered!");
				mSocketClient.onConnectionClosed = closedByClient;
				break;
			case "wrong_password" :
				mListener.showMessage('Connection failed',"Password incorrect!");
				mSocketClient.onConnectionClosed = closedByClient;
				break;
			case "already_connected" :
				console.log("Login OK (already connected)");
				mListener.onConnection();
				break;
			case "ok" :
				console.log("Login OK (new connection)");
				mListener.onConnection();
				break;
		}
	}

	function processLogoutReply(data) {
		switch(data.result) {
			case "error" :
				mListener.showMessage('Logout failed',"An error ocurred!");
				break;
			case "ok" :
				mSocketClient.stop();
				mListener.clearData();
				mListener.onDisconnection();
				break;
		}
	}

	function inputMessagesProtocol (message) {
		console.log("Message received : "+message);
		var obj = JSON.parse(message);
		switch (obj.key) {
			case "login_result"     : processLoginReply(obj.data); break;
			case "logout_result"    : processLogoutReply(obj.data); break;
			case "projects_info"    : mListener.processProjectsInfo(obj.data); break;
			case "project"          : mListener.loadProject(obj.data); break;
			case "workfile"         : mListener.readWorkfile(obj.data); break;
			case "run_result"       : mListener.processRunResult(obj.data); break;
			case "multiple_message" : mListener.processMessageArray(obj.data); break;
			case "report" :
				var messObj = obj.data;
				mListener.showMessage(messObj.title, messObj.message);
				break;
			default :
				console.log("Message unknown: "+obj.key+" : "+obj.data);
				break;
			case "user_elements" : mListener.updateUserElements(obj.data); break;
			case "project_elements" : mListener.updateProjectElements(obj.data); break;
		}
	}

	// -------------------------------
	// Final initialization
	// -------------------------------

	mSocketClient  = IODA_COMMUNICATION.StandardSocketClient(null,inputMessagesProtocol);

	function closedByTheServer() {
		mListener.showMessage('Connection closed',"The connection with the server was lost!")
		mListener.onDisconnection();
	};

	function closedByClient() {
		mListener.onDisconnection();
		mSocketClient.onConnectionClosed = closedByTheServer;
	};

	mSocketClient.onConnectionClosed = closedByTheServer;

	return self;
};

  // ---------------------------------------------------------------------------------------------
  // Standard Websocket code
  // ---------------------------------------------------------------------------------------------

/**
	* Standard WebSocket
	*/
IODA_COMMUNICATION.StandardSocketClient = function(mUrl, mProcessInputFunction) {
	var self = {};

	var mWebsocket;
	var mConnected = false;

	self.isConnected = function() {
		return mConnected;
	};

	// -----------------------------
	// Methods and functions
	// -----------------------------

	/**
		* Start a WS client listening to the given WS server
		* @param {String} url The url of the WS server
		*/
	self.start = function(url) {
		try {
			mWebsocket = new WebSocket(url);
			console.log('Connecting... (readyState ' + mWebsocket.readyState + ') to '+url);
			mWebsocket.onopen = function(message) {
				mOpenTry = 0;
				mConnected = true;
				if (self.onConnectionOpened) self.onConnectionOpened(message);
				console.log("Connection opened: " + message.type + " - Message: " + message.data);
			};
			mWebsocket.onclose = function(evt) {
				mConnected = false;
				if (self.onConnectionClosed) self.onConnectionClosed(evt);
				console.log("Connection closed: " + evt.type + " - Message: " + evt.data);
			};
			mWebsocket.onerror = function(evt) {
				mConnected = false;
				console.log("Error Event: " + evt.type + " - Message: " + evt.data);
			};
			mWebsocket.onmessage = function(evt) {
				if (self.processInputFunction) self.processInputFunction(evt.data);
			};
		}
		catch(exception) {
			console.log(exception);
		}
	};

	self.stop = function() {
		try {
			mWebsocket.close();
			mConnected = false;
		}
		catch(exception) {
			console.log(exception);
		}
	};

	self.sendMessage = function (message) {
		if (!mConnected) return false;
		mWebsocket.send(message);
		return true;
	};

	self.processInputFunction = function (data){
		console.log ("Received : "+data);
	}

	// ---------------------------------------
	// Utility functions
	//---------------------------------------

	function startsWith(fullStr, str) {
		return (fullStr.match("^"+str)==str);
	}


	// ---------------------------------------
	// Final start up
	//---------------------------------------

	if (mUrl && mUrl.length>0) {
		if (startsWith(mUrl.toLowerCase(),"ws://")) self.start(mUrl);
		else self.start("ws://"+mUrl);
	}

	if (mProcessInputFunction) self.processInputFunction = mProcessInputFunction;

	return self;
}

