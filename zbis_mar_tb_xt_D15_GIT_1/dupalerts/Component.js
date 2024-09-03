sap.ui.define([ "sap/ui/core/UIComponent","sap/ui/model/resource/ResourceModel" ], function(UIComponent, ResourceModel) {
  "use strict";

  return UIComponent.extend("ZBIS_MAR_TB_XT.Component",
      {
        metadata : {
          properties : {
            "AlertDBKey" : {
              type : "string",
              defaultValue : "",
              bindable : "bindable"
            }
          }
        },

        createContent : function() {
          sap.ui.getCore().loadLibrary("sap.ui.commons");
            sap.ui.getCore().loadLibrary("sap.ui.table");
 
          this.oView = sap.ui.view({
            viewName : "dupalerts.Alert_Info",
            type : sap.ui.core.mvc.ViewType.XML
          });

          return (this.oView);
        },

        setAlertDBKey : function(sAlertDBKey) {
          if (sAlertDBKey != this.getProperty("AlertDBKey")) {
            this.setProperty("AlertDBKey", sAlertDBKey);
			window.AlertDBKey = sAlertDBKey;
            var data;

            this.oView.setModel(new sap.ui.model.json.JSONModel(data));
 
         var service = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZCDS_C_BIS_DEP_ALERTS_CDS/", true);

            var view = this.oView;
            this.oBusy = new sap.m.BusyDialog();
            this.oBusy.open();
            var that = this;
             service.read("ZCDS_C_BIS_DEP_ALERTS(guid'" + sAlertDBKey + "')/to_DependentAlerts?$expand=to_WorkflowPhaseFieldDescr,to_CompletionStatusHelp,to_LifecycleStatusHelp,to_InvestigationReasonHelp", {
              async : false,
              success : function(data) {
                var model = new sap.ui.model.json.JSONModel(data);
                view.setModel(model);
                that.oBusy.close();
              }
            }); 

         
          }

          return this;
        },


        init : function() {
          // call super init (will call function "create content")
          sap.ui.core.UIComponent.prototype.init.apply(this,arguments);

           var i18nModel = new ResourceModel({
                bundleName: "dupalerts.i18n.i18n"
            });

            this.oView.setModel(i18nModel, "i18n");

        }
      });
});