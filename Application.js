var Application = {

	mountainsSource : "/bgmountains.json",
	mountainsDestination : "/update.php",
	mountainsReset : "/refresh.php",
	mountains : [],
	showVisibleOnly : true,
	
	prefetchData : function(onsuccessHandler) {
		var _self = this;
		UrlLoaderContext.loadData("GET", config.endpoint+_self.mountainsSource, null, 
			function(data) {
				_self.mountains = JSON.parse(data);
				onsuccessHandler();
			},
			function(error) {
				alert(error);
				onsuccessHandler();
			});
	},
	
	saveMountain : function(entry, onsuccessHandler) {
		var _self = this;
		UrlLoaderContext.loadData("GET", config.endpoint+_self.mountainsDestination, entry, 
			function(data) {
				onsuccessHandler();
			},
			function(error) {
				alert(error);
			});
	},
	
	resetMountains : function() {
		var _self = this;
		$("#preloader").show();
		$("#list").fadeOut("normal", function() {
			UrlLoaderContext.loadData("GET", config.endpoint+_self.mountainsReset, null, 
				function(data) {
					_self.prefetchData(function(){
						$("#preloader").hide();
						$("#list")[0].renderMountains();
						$("#list").fadeIn("normal");
					});
				},
				function(error) {
					alert(error);
				});
		});
	},
	
	reloadMountains : function() {
		var _self = this;
		$("#preloader").show();
		$("#list").fadeOut("normal", function() {
			_self.prefetchData(function(){
				$("#preloader").hide();
				$("#list")[0].renderMountains();
				$("#list").fadeIn("normal");
			});
		});
	},
	
	sortById : function() {
		this.mountains.sort(this.sortBy("id"));
	},
	
	sortBySleepingPlaces : function() {
		this.mountains.sort(this.sortBy("sleepingPlaces"));
	},
	
	sortBySeaLevel : function() {
		this.mountains.sort(this.sortBy("height"));
	},
	
	sortBy : function(fieldName) {
		return function(a,b) {
			if(parseInt(a[fieldName]) < parseInt(b[fieldName]))
				return -1;
			if(parseInt(a[fieldName]) > parseInt(b[fieldName]))
				return 1;
			return 0;
		}
	}
}
