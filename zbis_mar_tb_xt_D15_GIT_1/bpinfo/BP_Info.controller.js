sap.ui.controller("bpinfo.BP_Info", {

	/*
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf alertinfo.Alert_Info
	 */
	onInit: function() {		

	},
	
	/*
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf alertinfo.Alert_Info
	 */
	onBeforeRendering: function() {

	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf alertinfo.Alert_Info
	 */
	onAfterRendering: function() {

	},

	_getDialog: function() {
		// create a fragment with dialog, and pass the selected data
		if (!this._oDialog) {
			// This fragment can be instantiated from a controller as follows:
			this._oDialog = sap.ui.xmlfragment("idFragment", "bpinfo.fragmentViews.otherInfoHistory", this);
			this.getView().addDependent(this._oDialog);
			//debugger;
		}
		//debugger;
		return this._oDialog;
	},
	closeDialog: function() {
		this._getDialog().close();
	},

	onLogPress: function(oEvent) {
		/*		var oRow = oEvent.getParameter("row");
				var oItem = oEvent.getParameter("item");
				console.log(oEvent);
				debugger; */
		var strOthInfoURLBase = "/sap/opu/odata/sap/ZBIS_C_OTHINFO_CDS/"; //Set up base call URL
		var strOthInfoServicePath = "/ZBIS_C_OTHINFO(guid'" + oEvent.getSource().data("otherInfoKey") + "')"; //Set up dynamic part with AlertID

		//Create the default Model object oData Service.
		var objOtherInfoModel = new sap.ui.model.odata.v2.ODataModel(strOthInfoURLBase, {
			json: true,
			useBatch: false
		});

		//We are going to trigger a network operation with promise protocol through an anon function.
		//"this" will no longer be a valid instance inside the anon.
		//Hence, grab reference to both view object and dialog, so that we can use it inside the success of promise.
		var objView = this.getView();
		var objDialog = this._getDialog();
	
		objOtherInfoModel.read(strOthInfoServicePath, {
			urlParameters: {
				"$expand": "to_OtherInfoHistory"
			},
			success: function(data) {
				//Instantiate a JSON model with return data from oData Service. We will bind this as default model.
				objView.setModel(new sap.ui.model.json.JSONModel(data),"OtherInfoModel");
				objDialog.open();
			}
		});

		
	},
	
		onExpireLogPress: function(oEvent) {

		var strOthInfoURLBase = "/sap/opu/odata/sap/ZBIS_C_OTHINFO_EXP_HIST_CDS/"; //Set up base call URL
		var strOthInfoServicePath = "/ZBIS_C_OTHINFO_EXP_HIST(guid'" + oEvent.getSource().data("otherInfoKey") + "')"; //Set up dynamic part with AlertID

		//Create the default Model object oData Service.
		var objOtherInfoModel = new sap.ui.model.odata.v2.ODataModel(strOthInfoURLBase, {
			json: true,
			useBatch: false
		});

		//We are going to trigger a network operation with promise protocol through an anon function.
		//"this" will no longer be a valid instance inside the anon.
		//Hence, grab reference to both view object and dialog, so that we can use it inside the success of promise.
		var objView = this.getView();
		var objDialog = this._getDialog();
	
		objOtherInfoModel.read(strOthInfoServicePath, {
			urlParameters: {
				"$expand": "to_OtherInfoHistory"
			},
			success: function(data) {
				//Instantiate a JSON model with return data from oData Service. We will bind this as default model.
				objView.setModel(new sap.ui.model.json.JSONModel(data),"OtherInfoModel");
				objDialog.open();
			}
		});

		
	},
		//  Address History Changes
	_getAddrDialog: function() {

		// create a fragment with dialog, and pass the selected data
		if (!this._oAddrDialog) {
				// This fragment can be instantiated from a controller as follows:
				this._oAddrDialog = sap.ui.xmlfragment("idFragment2", "bpinfo.fragmentViews.addressHistory", this);
				this.getView().addDependent(this._oAddrDialog);
				//debugger;
		}
		//debugger;
		return this._oAddrDialog;
	},
	closeAddrDialog: function() {
		this._getAddrDialog().close();
	},
	//  Address History Button Event 
	onAddressHistoryLogPress: function(oEvent) {
		var strAddrHistBase = "/sap/opu/odata/sap/ZBIS_C_ADDRHISTORY_CDS/";
		var strAddrHistServicePath = "/ZBIS_C_ADDRHISTORY('" + oEvent.getSource().data("addrDBKey") + "')";

		//Create the default Model object oData Service.
		var objAddrHistModel = new sap.ui.model.odata.v2.ODataModel(strAddrHistBase, {
			json: true,
			useBatch: false
		});
		var objAddrHist = this.getView();
		var objAddrDialog = this._getAddrDialog();

		objAddrHistModel.read(strAddrHistServicePath, {
			urlParameters: {
				"$expand": "to_AddressHist"
			},
			success: function(data) {
				//Instantiate a JSON model with return data from oData Service. We will bind this as default model.
				objAddrHist.setModel(new sap.ui.model.json.JSONModel(data), "AddrHistModel");
				objAddrDialog.open();
			}
		});
	},
	onSave: function (oEvent) {
		// Access the variable from Component.js()
		// const oComponent = this.getOwnerComponent()
		// const sAlertDBKey = oComponent.oComponentData.AlertDBKey // Giving previous alert value

		var oData = this.getView().getModel('M1').getData();
		var Alert_DB_Key = oData.Alert_DBKey;
	
		var oValue1 = this.byId('DP1')
		var oValue2 = this.byId('DP2')
	
		// Check for Valid From and To Dates are empty or not
		if (oValue1.getValue() === '' || oValue2.getValue() === '') {
		  oValue1.setValueState(sap.ui.core.ValueState.Error)
		  oValue2.setValueState(sap.ui.core.ValueState.Error)
		  sap.m.MessageToast.show('Valid From and To Dates are mandatory')
		  return
		} else {
		  oValue1.setValueState(sap.ui.core.ValueState.None)
		  oValue2.setValueState(sap.ui.core.ValueState.None)
		}
	
		// Check Valid From Field is valid or not
		if ((oValue1.isValidValue() ? 'valid' : 'not valid') == 'not valid') {
		  oValue1.setValueState(sap.ui.core.ValueState.Error)
		  sap.m.MessageToast.show('Valid From Date is not valid')
		  return
		} else {
		  oValue1.setValueState(sap.ui.core.ValueState.None)
		  // Check Valid To Field is valid or not
		  if ((oValue2.isValidValue() ? 'valid' : 'not valid') == 'not valid') {
			oValue2.setValueState(sap.ui.core.ValueState.Error)
			sap.m.MessageToast.show('Valid To Date is not valid')
			return
		  } else {
			oValue2.setValueState(sap.ui.core.ValueState.None)
		  }
		}

		function parseDate(dateString) {
			var dateFormats = [
				{ pattern: "dd.MM.yyyy", regex: /^\d{2}\.\d{2}\.\d{4}$/ },
				{ pattern: "MM/dd/yyyy", regex: /^\d{2}\/\d{2}\/\d{4}$/ },
				{ pattern: "MM-dd-yyyy", regex: /^\d{2}\/\d{2}\/\d{4}$/ },
				{ pattern: "yyyy.MM.dd", regex: /^\d{4}\.\d{2}\.\d{2}$/ },
				{ pattern: "yyyy/MM/dd", regex: /^\d{4}\.\d{2}\.\d{2}$/ },
				{ pattern: "yyyy-MM-dd", regex: /^\d{4}\.\d{2}\.\d{2}$/ },
				{ pattern: "yyyy.dd.MM", regex: /^\d{4}\.\d{2}\.\d{2}$/ },
				// Add more formats as needed
			];
		
			for (var i = 0; i < dateFormats.length; i++) {
				if (dateFormats[i].regex.test(dateString)) {
					var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
						pattern: dateFormats[i].pattern
					});
					return oDateFormat.parse(dateString);
				}
			}
		
			throw new Error("Unsupported date format");
		};
	    // Format the date
		var oFromDate = oValue1.getValue();
		var oToDate = oValue2.getValue();
		try {
			var sFromDate = parseDate(oFromDate);
            var sToDate = parseDate(oToDate);
		} catch (error) {
			sap.m.MessageToast.show(e.message);
		}

		// if (new Date(oValue1.getValue()) >= new Date(oValue2.getValue()))
		if (new Date(sFromDate) >= new Date(sToDate))	
		  {
			oValue1.setValueState(sap.ui.core.ValueState.Error);
			sap.m.MessageToast.show('Valid From Date should be less than Valid To Date');
			return;
		  }else {
			oValue1.setValueState(sap.ui.core.ValueState.None);
		  };
	
		var finalJSON = {
		  AlertKey: Alert_DB_Key, //sAlertDBKey,
		  ValidFrom: oValue1.getValue(),
		  ValidTo: oValue2.getValue(),
		  ClearFlag: ''
		}
	
		// Make Odata call to Post data to SAP
		var strURL = '/sap/opu/odata/sap/ZBIS_ALERT_VAL_TIMER_SRV/' //Set up base call URL
	
		var objModel = new sap.ui.model.odata.v2.ODataModel(strURL, {
		  json: true,
		  useBatch: false
		})
	
		objModel.create('/AlertHdrSet', finalJSON, {
		  // Assuming the entity set is ZBIS_C_ALERT_HIT_DET
		  success: function (data) {
			// Handle the success response
			sap.m.MessageToast.show(data.Response)
		  },
		  error: function (data) {
			// Handle the error response
			console.log(data.responseText)
		  }
		})
	  },

	onClear: function () {

				// // Access the variable from Component.js
				// const oComponent = this.getOwnerComponent()
				// const sAlertDBKey = oComponent.oComponentData.AlertDBKey // Giving previous alert DB Key

				var oData = this.getView().getModel('M1').getData();
				var Alert_DB_Key = oData.Alert_DBKey;		
			
				var oValue1 = this.byId('DP1')
				var oValue2 = this.byId('DP2')

				oValue1.setValue("");
				oValue2.setValue("");

				var finalJSON = {
					AlertKey: Alert_DB_Key,
					ClearFlag: 'X'
				  }

					// Make Odata call to Post data to SAP
		var strURL = '/sap/opu/odata/sap/ZBIS_ALERT_VAL_TIMER_SRV/' //Set up base call URL
	
		var objModelClear = new sap.ui.model.odata.v2.ODataModel(strURL, {
		  json: true,
		  useBatch: false
		})
	
		objModelClear.create('/AlertHdrSet', finalJSON, {
		  // Assuming the entity set is ZBIS_C_ALERT_HIT_DET
		  success: function (data) {
			// Handle the success response
			sap.m.MessageToast.show(data.Response)
		  },
		  error: function (data) {
			// Handle the error response
			console.log(data.responseText)
		  }
		})
	}

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf alertinfo.Alert_Info
	 */
	//	onExit: function() {
	//
	//	}

});