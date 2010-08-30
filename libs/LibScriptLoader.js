/*
Class: Lib
Utility class responsible for chained loading of libs' javascript entries.

usage:
(start code)
var lib = new Lib();
lib.libsRoot = "./mylibs";
lib.require("classjsExtended").onloadComplete = function() {
	// ./mylibs/classjsExtended/classjsExtended.js library javascript entry loaded (thus all depending libraries)
    Class.require("my.namespace.Classes").onloadComplete = function() {
		// ./my/namespace/Classes.js javascript file is loadeded and all its required classes too.
	}
}
(end)
*/
var Lib = {
	libsRoot : null,
	requiredLibs : [],
	require : function(libName, onloadComplete) {

		for( var i = 0; i<this.requiredLibs.length; i++)
			if(this.requiredLibs[i] == libName) {
				if(typeof onloadComplete === "function")
					if(ScriptLoader.isLoading(libName))
						ScriptLoader.addCompleteListener(libName, onloadComplete);
					else 
						onloadComplete();
					
				return ScriptLoader.currentLoaderClass;
			}
		this.requiredLibs.push(libName);

		if(libName.indexOf("/") == -1)
			libName = libName.replace(/\./g, "/");

		ScriptLoader.sourcePaths.push(this.libsRoot+libName+"/");
		return ScriptLoader.load(libName, onloadComplete);
	},
	getLibURL : function(libName) {
		if(libName.indexOf("/") == -1)
			libName = libName.replace(/\./g, "/");
		return ScriptLoader.domainURL+Lib.libsRoot+libName+"/";
	}
}

/*
Class: ScriptLoader
Utility class reposible for chained loading of external scripts.

usage:
(start code)
var loader = new api.system.utils.ScriptLoader();
loader.sourcePaths = ['./myOtherAPI', 'http://myRemoteAPI/'];
loader.get('myapi.MyScript');
loader.get('myotherapi.myinnerFolder.MyNextScript');
loader.get('./relativePath/Script.js');
loader.get('http://domain.com/remote/Script.js').onloadComplete = function() { // at final get you can hook
	alert('all scripts are loaded'); 
}
(end)

loading minified & optimized versions:
(start code) 
loader.setUseMinifier('flashjsrequire/jsrequire.php');
loader.get('myotherapi.myinnerFolder.MyNextScript');
loader.get("./relative/path/Script.js", onloadComplete() { alert('loading complete') });
(end)

updating/reloading:
(start code)
loader.setUseUpdater('flashjsupdate/jsupdate.php');
loader.get("./relative/path/ToObject.js"
(end)

The above will trigger loader to use integrated php script located at /utils/minifier/jsrequire.php which:
- reads all <api.system.utils.Class.require> statements 
- returns minified combined version of the requested script & its dependencies.
*/
var ScriptLoader = function() {
	this.sourcePaths = [];

	this.domainURL = window.location.protocol+"//"+window.location.hostname;

	var start = document.URL.indexOf("/",8);
	var len = document.URL.lastIndexOf("/")-start+1;
	this.rootURL = document.URL.substr(start,len);

	this.sourcePaths.push(this.rootURL);
	
	this.scriptLoadCount = 0;
	this._useMinifier = null;
	this._enableCache = false;

	this.onscriptLoadListeners = [];
	this.completeListeners = [];
	this.currentLoadingScripts = [];

	// define hidden classLoader implementation
	this.currentLoaderClass = function() {
	}
	this.currentLoaderClass.prototype = {
		onloadComplete : function() {
		}
	}
}

ScriptLoader.prototype = {

	/* Function: setEnableCache
	if set enabled = true then on the head tags won't be appended no-cache param */
	setEnableCache : function(value) {
		this._enableCache = value;
	},
	/* Function: getEnableCache 
	returns boolean */
	getEnableCache : function() {
		return this._enableCache;
	},

	load : function(script,onloadCompleteHandler) {
		if(onloadCompleteHandler !== true)
			return this.appendScriptTag(script, onloadCompleteHandler);
		else
			return this.loadScriptNow(script);
	},
	addCompleteListener : function(script, onloadCompleteHandler) {
		this.onscriptLoadListeners.push({script: script, handler: onloadCompleteHandler});
	},
	isLoading : function(script) {
		for(var i = 0; i<this.currentLoadingScripts.length; i++)
			if(this.currentLoadingScripts[i] === script)
				return true;
		return false;
	},
	setCompleteListener : function(target, listenerFunc) {
		for(var i = 0; i<this.completeListeners.length; i++)
			if(this.completeListeners[i].method === listenerFunc && this.completeListeners[i].target === target)
				return;

		this.completeListeners.push({target: target, method: listenerFunc});
	},

	/* Function: findScriptRoot
	searched for the root folder of the all defined within flashjsRoot and sourcePaths.

	starts searching within flashjsRoot first. */
	findScriptRoot : function(script) {
		for(var i = 0; i<this.sourcePaths.length; i++)
		{
			var url = null;
			if(script.lastIndexOf(".js") == -1)
				url = this.domainURL+this.sourcePaths[i]+script+".js";
			else
				url = this.domainURL+this.sourcePaths[i]+script;

			if(this.scriptExists(url))
				return this.sourcePaths[i];
		}
        throw new Error(" could not find root of "+script+" in "+this.sourcePaths);
	},
	/* Function: scriptExists
	Checks if given script within given scriptPath exists by sending HEAD request to the scriptPath */
	scriptExists : function(scriptPath) {
        try
        {
            // TODO this should be optimized
            var req = new XMLHttpRequest();
            req.open("HEAD", scriptPath, false);
            req.send();
            if(req.status == 200 || req.status == 304)
                return true;
            else
                return false;
        }
        catch(e) { return false; }
	},
	/* Function: get
	Retrieves script by firstly checking if the script is external, relative or should 
	be searched within defined flashjsRoot and sourcePath directories 
	
	returns:
	Object.onloadComplete which can be overriden for hooking into when load completes */
	appendScriptTag : function(script, onloadCompleteHandler) {
		var originalScript = script;
		var scriptElement = document.createElement('script');
		scriptElement.type = 'text/javascript';
		if(script.indexOf("http://") != -1)
			scriptElement.src = script;
		else if(script.indexOf("./") == 0 || script.indexOf("../") == 0)
			scriptElement.src = script;
		else {
			if(script.indexOf("/") == -1 && script.lastIndexOf(".js") == -1)
				script = script.replace(/\./g, "/");

			var	url = null;
			if(script.lastIndexOf(".js") == -1)
				url = this.domainURL+this.findScriptRoot(script)+script+".js";
			else
				url = this.domainURL+this.findScriptRoot(script)+script;
			
			scriptElement.src = url;
		}
		
		// dirty hack to workaround caching at all 
		if(this._enableCache == false)
			if(scriptElement.src.indexOf("?") != -1)
				scriptElement.src += "&no-cache="+Math.random();
			else
				scriptElement.src += "?no-cache="+Math.random();
		
		// figure out is currently there is loader waiting for script load event
		// if this is the case, use that loader to _chain_ another load process
		// if not create new instance
		var loader = null;
		if(this.scriptLoadCount == 0) {
			loader = new this.currentLoaderClass();
			this.currentLoaderInstance = loader;
		}
		else
			loader = this.currentLoaderInstance;
		
		var _self = this;

		scriptElement.onload = function() { 
			if(onloadCompleteHandler) 
				onloadCompleteHandler();
			_self.onScriptLoaded(originalScript); 
		};

		scriptElement.onreadystatechange= function () {
        	if (this.readyState == 'loaded' || this.readyState == 'complete')  {
				if(onloadCompleteHandler)
					onloadCompleteHandler();
				_self.onScriptLoaded(originalScript);
			}
		};
		
		scriptElement.onerror = function() { _self.onScriptError(this); };

		this.scriptLoadCount += 1;
		this.currentLoadingScripts.push(originalScript);

		document.getElementsByTagName('head')[0].appendChild(scriptElement);

		// always return the current loader instance so caller can hook into
		return this.currentLoaderInstance;
	},
	loadScriptNow : function(script) {
		var originalScript = script;
		var src = "";
		if(script.indexOf("http://") != -1)
			src = script;
		else if(script.indexOf("./") == 0 || script.indexOf("../") == 0)
			src = script;
		else {
			if(script.indexOf("/") == -1 && script.lastIndexOf(".js") == -1)
				script = script.replace(/\./g, "/");

			var	url = null;
			if(script.lastIndexOf(".js") == -1)
				url = this.domainURL+this.findScriptRoot(script)+script+".js";
			else
				url = this.domainURL+this.findScriptRoot(script)+script;
			
			src = url;
		}
		
		// dirty hack to workaround caching at all 
		if(this._enableCache == false)
			if(src.indexOf("?") != -1)
				src += "&no-cache="+Math.random();
			else
				src += "?no-cache="+Math.random();
		
		// figure out is currently there is loader waiting for script load event
		// if this is the case, use that loader to _chain_ another load process
		// if not create new instance
		var loader = null;
		if(this.scriptLoadCount == 0) {
			loader = new this.currentLoaderClass();
			this.currentLoaderInstance = loader;
		}
		else
			loader = this.currentLoaderInstance;
		
		var _self = this;

		var req = new XMLHttpRequest();
		req.open("GET", src, false);
		this.scriptLoadCount += 1;
		this.currentLoadingScripts.push(originalScript);
		req.send();
		if(req.status == 200 || req.status == 304) {
			_self.onScriptLoaded(originalScript); 
		}
		else
			_self.onScriptError(this);

		var scriptElement = document.createElement('script');
		scriptElement.setAttribute('type', 'text/javascript');
        if(typeof scriptElement.text !== "undefined")
            scriptElement.text = req.responseText;
        else
            scriptElement.appendChild(document.createTextNode(req.responseText));
        
		document.getElementsByTagName('head')[0].appendChild(scriptElement);

		// always return the current loader instance so caller can hook into
		return this.currentLoaderInstance;
	},
	onScriptLoaded : function (script) {

		// dispatch any load handles per the originalScript request
		for(var i = 0; i<this.onscriptLoadListeners.length; i++)
			if(this.onscriptLoadListeners[i].script === script) {
				this.onscriptLoadListeners[i].handler();
				this.onscriptLoadListeners.splice(i,1);
				i -= 1;
			}

		// remove from the stack of current loaded ones
		for(var i = 0; i<this.currentLoadingScripts.length; i++)
			if(this.currentLoadingScripts[i] === script) {
				this.currentLoadingScripts.splice(i,1);
				i -= 1;
			}

		this.scriptLoadCount -= 1;
		if(this.scriptLoadCount == 0) {

			// notify all complete listeners
			for(var i = 0; i < this.completeListeners.length; i++)
				this.completeListeners[i].method.call(this.completeListeners[i].target);
			this.completeListeners = [];

			this.currentLoaderInstance.onloadComplete();
		}
	},
	onScriptError : function(loader) {
		this.scriptLoadCount -= 1;
		if(this.scriptLoadCount == 0)
			this.currentLoaderInstance.onloadComplete();
		throw new Error("script not found "+loader.src);
	}
}

// create global ScriptLoader object, futher used by Lib.require and any other implementation
window['ScriptLoader'] = new ScriptLoader(); 

// figure out which is the Lib's root path (without the hostname)
var head = document.getElementsByTagName("head")[0];
for(var i = 0;i<head.childNodes.length;i++) {
	var child = head.childNodes[i];
	if(child.tagName == "SCRIPT" && child.src.indexOf("LibScriptLoader.js") !== false) {
        if(child.src.indexOf("..") == -1)
            Lib.libsRoot = child.src.substring(child.src.indexOf("/", 8), child.src.indexOf("LibScriptLoader.js"));
        else
            Lib.libsRoot = ScriptLoader.rootURL+child.src.substring(0,child.src.indexOf("LibScriptLoader.js"));
	}
}

ScriptLoader.sourcePaths.push(Lib.libsRoot);