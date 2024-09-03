sap.ui.controller("dupalerts.Alert_Info", {

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf alertinfo.Alert_Info
	 */
	/*	onInit: function() {
	  

		}*/
	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf alertinfo.Alert_Info
	 */
	//	onBeforeRendering: function() {
	//
	//	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf alertinfo.Alert_Info
	 */
	//	onAfterRendering: function() {
	//
	//	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf alertinfo.Alert_Info
	 */
	//	onExit: function() {
	//
	//	}

	handleAlertNavigation: function(oEvent) {

		//Get the Cross Application Navigation service from Fiori Launchpad Shell
		var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

		// generate the Hash to perform Cross Application navigation to Manage Alerts app with BIS Semantic mapping.
		var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
			target: {
				semanticObject: "zbis_alert_extension",
				action: "manage"
			},
			params: {
				"Alerts": oEvent.getSource().data("alertDBKey")
			}
		})) || "";

		//Get the hash part of intent navigation ready for target routing pattern in standard Alert display app
		hash = hash.replace("?", "?&/");
		hash = hash.replace("=", "/");

		//Construct the full URL.
		var url = window.location.href.split('#')[0] + hash;

		//Navigate to Standard Manage Alerts App, with Routing to /Alert/{dbkey} routing pattern as specified in Manifest.
		//NOTE: Functional requirement states that the app needs to be opened in a new tab/window.
		sap.m.URLHelper.redirect(url, true);
	}

});