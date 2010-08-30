var UrlLoaderContext = {
	urlloaderMovie : null,
	loadCompleteCallbacks : [],
	errorCallbacks : [],
	onInitComplete : null,
	initialized : false,
	init : function(onInitComplete) {
		this.onInitComplete = onInitComplete;
		if(this.initialized)
			this.onInitComplete();
	},
	handleInitComplete : function() {
	    this.initialized = true;
        if(this.onInitComplete != null) {
            this.onInitComplete();
        }
	},
	loadData : function(method, url, data, onLoadCompleteCallback, onErrorCallback) {
		this.lastCompleteCallback = onLoadCompleteCallback;
		this.lastErrorCallback = onErrorCallback;
		this.urlloaderMovie.loadData(url, data, method); // this method will call back index to be registered along the callbacks
	},
	registerLoader : function(index) {
		this.loadCompleteCallbacks[index] = UrlLoaderContext.lastCompleteCallback;
		this.errorCallbacks[index] = UrlLoaderContext.lastErrorCallback;
		this.lastCompleteCallback = undefined;
		this.lastErrorCallback = undefined;
	},
	handleLoadComplete : function(index, data) {
		var func = this.loadCompleteCallbacks[index];
		this.loadCompleteCallbacks[index] = undefined;
		func.call(this, data);
	},
	handleError : function(index, text) {
		var func = this.errorCallbacks[index];
		this.errorCallbacks[index] = undefined;
		func.call(this, text);
	}
};


Lib.require("swfobject", function() {
	var urlloader = document.createElement("div");
	urlloader.id = 'urlloader';
	urlloader.style.width = '1px';
	urlloader.style.height = '1px';
	urlloader.style.position = 'absolute';
	urlloader.style.left = '-1000';
	urlloader.style.top = '-1000';
	document.getElementsByTagName('body')[0].appendChild(urlloader);
	var params = {
        'allowfullscreen':                       'true',
        'allowscriptaccess':                     'always'
    };

	swfobject.embedSWF(Lib.getLibURL("flashurlloader")+"urlloader.swf",
		"urlloader", "1", "1", "9.0.0", Lib.getLibURL("swfobject")+"expressInstall.swf",
		undefined, params, undefined, function(obj) {
			UrlLoaderContext.urlloaderMovie = obj.ref;
		});
});
