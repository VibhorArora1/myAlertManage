/*
Author			: Gopal Nair (GONAIR), Microsoft
Organization	: CPE EAS SAP ERP Platform
Project			: MS Finance - BIS
*/
sap.ui.define(["sap/ui/core/UIComponent",
	"sap/ui/model/resource/ResourceModel",
	"sap/ui/model/odata/v2/ODataModel"
],
	function (UIComponent, ResourceModel, ODataModel) {
		"use strict";

		return UIComponent.extend("ZBIS_MAR_TB_XT.Component", {
			metadata: {
				properties: {
					"AlertDBKey": {
						type: "string",
						defaultValue: "",
						bindable: "bindable"
					}
				}
			},

			createContent: function () {
				sap.ui.getCore().loadLibrary("sap.ui.commons");
				sap.ui.getCore().loadLibrary("sap.ui.table");

				this.oView = sap.ui.view({
					viewName: "bpinfo.BP_Info",
					type: sap.ui.core.mvc.ViewType.XML
				});

				return (this.oView);
			},

			setAlertDBKey: function (sAlertDBKey) {

				if (sap.ushell && sap.ushell.Container) {
					var oHash = sap.ushell.Container.getService("URLParsing").parseShellHash(window.location.hash);
					var sSemanticObject = oHash.semanticObject;
					var sAction = oHash.action;
				}
				var sId = "application-" + sSemanticObject + "-" + sAction + "-component---object--alertHeaderReopenButton";
				// var mainModel = sap.ui.getCore().byId("application-ComplianceAlert-manage-component---object--alertHeaderReopenButton").getModel();
				try {
					var mainModel = sap.ui.getCore().byId(sID).getModel();

					mainModel.attachBatchRequestCompleted(function (oEvent) {
						// Check if the batch request is completed
						if (oEvent.getParameter("success")) {
							try {
								var jsonString = oEvent.getParameters("response").response.responseText.match(/{.*}/s)[0];
								var jsonObject = JSON.parse(jsonString);
								var dataModel = view.getModel('M1').getData();
								if (jsonObject.d) {
									dataModel.AlertLC = jsonObject.d.LifecycleStatus;
									dataModel.PersResp = jsonObject.d.ResponsiblePerson;
									view.getModel('M1').setData(dataModel);
									view.getModel('M1').refresh();
								}
							} catch (e) {
								console.log("JSON String:", jsonString);
							}


						} else {
							console.log("Batch job failed.");
						}

					});
				} catch (e) {
					console.log("Error in getting model", e);
				}



				if (sAlertDBKey !== this.getProperty("AlertDBKey")) {
					this.setProperty("AlertDBKey", sAlertDBKey);
					var strRequestURLBase = "/sap/opu/odata/sap/ZBIS_C_ALERTBP_CDS/"; //Set up base call URL
					var strServicePath = "/ZBIS_C_ALERTBP(guid'" + sAlertDBKey + "')"; //Set up dynamic part with AlertID

					//Create the default Model object oData Service.
					var objDefaultModel = new ODataModel(strRequestURLBase, {
						json: true,
						useBatch: false
					});

					//Grab an instance of the view, and set data retrieved to its default model.
					var view = this.oView;
					// this.oBusy = new sap.m.BusyDialog(); // TAPERI
					// this.oBusy.open(); //TAPERI
					var oTable4 = view.byId("tblOrgAddress");
					var oTable3 = view.byId("tblPersonAddress");
					var oTable2 = view.byId("tblBPOtherInfoV2");
					var oTable1 = view.byId("tblBPOtherInfoExpiredV2");
					if (oTable1) {
						oTable1.setBusy(true);
					}
					if (oTable2) {
						oTable2.setBusy(true);
					}
					if (oTable3) {
						oTable3.setBusy(true);
					}
					if (oTable4) {
						oTable4.setBusy(true);
					}

					// var that = this; // TAPERI Adding

					objDefaultModel.read(strServicePath, {
						urlParameters: {
							"$expand": "to_AlertOrgAddressV2,to_AlertPersonAddressV2,to_BPOtherInfoV2,to_BPOtherInfoExpiredV2"
						},
						success: function (data) {
							//Instantiate a JSON model with return data from oData Service. We will bind this as default model.
							var dataModel = new sap.ui.model.json.JSONModel(data);

							//Use a custom sorter to build the display order based on:
							// Items having the same Request ID should be grouped together - but Org should come first.

							dataModel.getProperty("/to_AlertOrgAddressV2").results.sort(function (objA, objB) {
								//Check if Request IDs of the objects are different.
								if (objA.RequestID < objB.RequestID) {
									return 1;
								}
								if (objA.RequestID > objB.RequestID) {
									return -1;
								}

								//If execution reach here, the request IDs are the same. Compare Address type.
								if (objA.CustomerType > objB.CustomerType) {
									return 1;
								}

								if (objA.CustomerType < objB.CustomerType) {
									return -1;
								}
								return 0;
							});

							//Set the view model.
							view.setModel(dataModel);
							// that.oBusy.close();
							if (oTable1) {
								oTable1.setBusy(false);
							}
							if (oTable2) {
								oTable2.setBusy(false);
							}
							if (oTable3) {
								oTable3.setBusy(false);
							}
							if (oTable4) {
								oTable4.setBusy(false);
							}

							dataModel.refresh();

						}
					});
					// BOC - Alert Validiy Timer - TAPERI
					// Set base URL
					var alertTimerURLBase = '/sap/opu/odata/sap/ZBIS_ALERT_VAL_TIMER_SRV/' //Set up base call URL
					var timerServicePath = "/AlertHdrSet(guid'" + sAlertDBKey + "')"
					//Create the default Model object oData Service.
					var objAlertModel = new ODataModel(alertTimerURLBase, {
						json: true,
						useBatch: false
					});

					var dataModel1 = new sap.ui.model.json.JSONModel();

					objAlertModel.read(timerServicePath, {
						success: function (data) {
							// that.oBusy.close(); //TAPERI
							view.setModel(null, "M1");
							// Get the session user details
							var sessionUser = sap.ushell.Container.getService("UserInfo").getId();
							// var dataModel1 = new sap.ui.model.json.JSONModel()
							dataModel1.setData({
								ValidFrom: new Date(data.ValidFrom),
								ValidTo: new Date(data.ValidTo),
								AlertLC: data.AlertLC,
								sessionUser: sessionUser,
								PersResp: data.PersResp,
								Alert_DBKey: sAlertDBKey
							})
							//Set the view model
							view.setModel(dataModel1, "M1")
							dataModel1.refresh()
						},
						error: function (data) {
							// Handle the error response
							// that.oBusy.close(); // TAPERI Adding
							view.setModel(dataModel1, "M1")
							view.setModel(null, "M1");
							dataModel1.refresh()
							console.log(data.responseText);
						}
					})

					// EOC - Alert Validiy Timer - TAPERI
				}

				return this;
			},

			init: function () {
				// call super init (will call function "create content")
				sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

				var i18nModel = new ResourceModel({
					bundleName: "bpinfo.i18n.i18n"
				});

				this.oView.setModel(i18nModel, "i18n");
			}
		});
	});