sap.ui.define(
    [
      'sap/ui/core/UIComponent',
      'sap/ui/model/resource/ResourceModel',
      'sap/ui/model/odata/v2/ODataModel'
    ],
    function (UIComponent, ResourceModel, ODataModel) {
      'use strict'
  
      return UIComponent.extend('ZBIS_MAR_TB_XT.Component', {
        metadata: {
          properties: {
            AlertDBKey: {
              type: 'string',
              defaultValue: '',
              bindable: 'bindable'
            }
          }
        },
  
        createContent: function () {
          sap.ui.getCore().loadLibrary('sap.ui.commons');
          sap.ui.getCore().loadLibrary('sap.ui.table');
  
          this.oView = sap.ui.view({
            viewName: 'recommendation.recom',
            type: sap.ui.core.mvc.ViewType.XML
          })
  
          return this.oView;
        },
  
        setAlertDBKey: function (sAlertDBKey) {
          if (sAlertDBKey !== this.getProperty('AlertDBKey')) {
            this.setProperty('AlertDBKey', sAlertDBKey);
            var strRequestURLBase = '/sap/opu/odata/sap/ZBIS_REL_ADDR_HITS_AI_RECOMM_SRV/'; //Set up base call URL
            var strServicePath = "/AlertHdrSet(guid'" + sAlertDBKey + "')";
  
            //Create the default Model object oData Service.
            var objDefaultModel = new ODataModel(strRequestURLBase, {
              json: true,
              useBatch: false
            });
  
            //Grab an instance of the view, and set data retrieved to its default model.
            var view = this.oView;
            this.oBusy = new sap.m.BusyDialog();
  
            var that = this;
            this.oBusy.open();

            objDefaultModel.read(strServicePath, {
              success: function (data) {
                // Check Address Hits are there are not
                that.oBusy.close();
                var input = JSON.parse(data.Response);
                if (input.length === 0) {
                // Create a new MessageStrip and add it to the view
                var oMessageStrip = new sap.m.MessageStrip({
                  text: i18nModel.getText("NoAddrHits"),
                  type: "Information",
                  showIcon: true,
                  closeable: false
                });
                // Get the Page from the view
                var oPage = that.getView().byId('Page');
                // Add the MessageStrip to the Page
                oPage.addContent(oMessageStrip);
                // Create a new JSONModel with an empty Item property and set it to the view
                var oModel = new sap.ui.model.json.JSONModel({ Item: [] });
                that.getView().setModel(oModel, "M1");
    
                return;
                };
                // Call your custom callback function here
                that.AIRecommCallback(data, view);
              }.bind(that),
              error: function (error) {
                that.oBusy.close();
                // console.error("Error:", error);
                new sap.m.MessageToast.show("Not able fetch Data from the backend. Please try again later.");
              }
            });
          }
          return this;
        },
  
        init: function () {
          // call super init (will call function "create content")
          sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
  
          var i18nModel = new ResourceModel({
            bundleName: 'recommendation.i18n.i18n'
          });
  
          this.oView.setModel(i18nModel, 'i18n');
        },
  
        AIRecommCallback: function (data, view) {
  
          // Retrive AI Recommendation data and bind to the model
          var AIRecommData = data.Response;
          var input = JSON.parse(AIRecommData);
  
         // Convert the input array to the desired output format
          var output = { result: [] }; 
          var map = {};  
        
          for (var i = 0; i < input.length; i++) {
            // Loop through the input array
            var itemDBKey = input[i].ITEMDBKEY;

            // Get the ItemDbkey of the current element
            if (!map[itemDBKey]) {
              map[itemDBKey] = [];
              var i2 = {};
              i2.ScreenedName = input[i].BP_FULL_NAME; 
              i2.ScreenedAddress = input[i].SCREENEDADDRESS; 
              i2.ScreenedCountry = input[i].BP_COUNTRY;
            
              // Item Header level fields
              var AlertLC = input[i].ALERT_LC; 
              var disableCompleteItem = 'false';
              var isItemSelected = false;

              output.result.push({
                Item: map[itemDBKey],
                i2: i2,
                AlertLC: AlertLC,
                disableCompleteItem: disableCompleteItem,
                isItemSelected: isItemSelected
              }) 
            }
            var item = {}; 
            item.DBkey = input[i].DBKEY;
            item.ItemDBkey = input[i].ITEMDBKEY;
            item.AddressDBkey = input[i].ADDRESSDBKEY;
            item.HitName = input[i].HIT_NAME;
            item.HitCountryCode = input[i].HIT_COUNTRY;
            item.HitAddress = input[i].HIT_ADDRESS;
            item.OverallMatch = input[i].OVERALL_SCORE;
            item.AI_match_score = input[i].AI_MATCH_SCORE;
            item.AI_close_reason = input[i].AI_CLOSE_REASON;
            item.AI_Recommendation = input[i].AI_RECOMMENDATION;
            item.Status = input[i].STATUS;
            item.Entity_ID = input[i].ENTITY_ID;
            item.Alert_LC = input[i].ALERT_LC;
            item.isSelected = false;
            item.EntityDBKey = input[i].ENTITYDBKEY;
            map[itemDBKey].push(item);
  
            if (item.AI_close_reason == 'No-Hit' && item.Status == 'Open') {
              item.isCheckBoxVisible = 'true';
            } else {
              item.isCheckBoxVisible = 'false';
            }
        
            if (item.AI_close_reason != 'No-Hit') {
              output.result[output.result.length - 1].disableCompleteItem = 'true';
            }
        
            if (input[i].CONFSTATUS === 'YES') 
            {
              item.Hit = true; 
            }
            else if(input[i].CONFSTATUS === 'NO') 
            {
              item.Hit = false; 
            }
          }
  
          //Bind default model
          var dataModel = new sap.ui.model.json.JSONModel(output);
          //Set the view model
          view.setModel(dataModel, 'M1');
          dataModel.refresh();
        }
      })
    }
  )