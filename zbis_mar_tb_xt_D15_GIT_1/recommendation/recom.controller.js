sap.ui.controller('recommendation.recom', {
    /*
     * Called when a controller is instantiated and its View controls (if available) are already created.
     * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
     * @memberOf alertinfo.Alert_Info
     */
    onInit: function () {},
  
    // formatter
    columnTextWithLineBreak: function (sText1, sText2) {
      var sResult = sText1 + '\n';
      sResult += sText2 ? sText2 : '\n';
      return sResult;
    },
  
    toPercentage: function (oValue) {
      var iNumber = 0;
      if (oValue) {
        iNumber = parseInt(oValue, 10);
        if (isNaN(iNumber)) {
          iNumber = 0;
        }
      }
      return iNumber + '%';
    },
    /*
     * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
     * (NOT before the first rendering! onInit() is used for that one!).
     * @memberOf alertinfo.Alert_Info
     */
    onBeforeRendering: function () {},
  
    /**
     * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
     * This hook is the same one that SAPUI5 controls get after being rendered.
     * @memberOf alertinfo.Alert_Info
     */
    onAfterRendering: function () {},
  
    /**
     * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
     * @memberOf alertinfo.Alert_Info
     */
    //	onExit: function() {
    //
    //	}
  
    /**
     * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
     * This hook is the same one that SAPUI5 controls get after being rendered.
     * @memberOf alertinfo.Alert_Info
     */
    onSubmitHits: function (oEvent) {
      var oSelectionPath = oEvent.getSource().getBindingContext('M1').getPath()
      var num = oSelectionPath.substring(8)
      var oModel = this.getView().getModel('M1')
      var oData = oModel.getData()
      var selectedItems = oData.result[num].Item
  
      // Initialize an array to store the selected data
      var selectedData = []
  
      selectedItems.forEach(function (Item) {
        if (Item.isSelected === true) {
          // Select specific fields and create a new object
          var selectedFields = {
            AlertKey: Item.DBkey,
            ItemKey: Item.ItemDBkey,
            AddressKey: Item.AddressDBkey,
            AIRecomm: Item.AI_Recommendation
          }
          selectedData.push(selectedFields) // Push the selected fields to the array
        }
      })
      // Create the final JSON format
      var finalJSON = {
        AlertKey: selectedData[0].AlertKey, // Map the first AlertKey from selectedData
        Nav_To_Item: selectedData.map(function (item, index) {
          return {
            AlertKey: item.AlertKey, // Map the same AlertKey for each item
            ItemKey: item.ItemKey,
            AddressKey: item.AddressKey,
            AIRecomm: item.AIRecomm,
            Status: ' ',
            ConfStatus: ' '
          }
        })
      }
      // Call the OData service to submit the data
  
      var strURL = '/sap/opu/odata/sap/ZBIS_REL_ADDR_HITS_AI_RECOMM_SRV/' //Set up base call URL
  
      var objModel = new sap.ui.model.odata.v2.ODataModel(strURL, {
        json: true,
        useBatch: false
      })
  
      objModel.create('/AlertHdrSet', finalJSON, {
        // Assuming the entity set is ZBIS_C_ALERT_HIT_DET
        success: function (data) {
          // Handle the success response
  
          var addHitsResult = data.Nav_To_Item.results
          var oModelData = oModel.getData()
  
          // Loop through each entry in addHitsResult
          addHitsResult.forEach(function (addHit) {
            // Find the matching entry in oModelData based on Item key, Address key, and DB key
            var matchingEntry = oModelData.result.find(function (entry) {
              return entry.Item.some(function (item) {
                return (
                  item.ItemDBkey === addHit.ItemKey &&
                  item.AddressDBkey === addHit.AddressKey &&
                  item.DBkey === addHit.AlertKey
                )
              })
            })
  
            // If a matching entry is found, update the Status field
            if (matchingEntry) {
              matchingEntry.Item.forEach(function (item) {
                if (
                  item.ItemDBkey === addHit.ItemKey &&
                  item.AddressDBkey === addHit.AddressKey &&
                  item.DBkey === addHit.AlertKey
                ) {
                  item.Status = addHit.Status
                }
              })
            }
          })
          // Refresh the model to reflect the changes
          oModel.refresh(true)
        },
        error: function (error) {
          // Handle the error response
        }
      })
    },
  
    completeItem: function (finalJSON, oModel, oSelectionPath,selectedItems) {
      // Call the OData service to submit the data
  
      var strURL = '/sap/opu/odata/sap/ZBIS_REL_ADDR_HITS_AI_RECOMM_SRV/' //Set up base call URL
  
      var objModel = new sap.ui.model.odata.v2.ODataModel(strURL, {
        json: true,
        useBatch: false
      })
  
      objModel.create('/CloseItemSet', finalJSON, {
        // Assuming the entity set is ZBIS_C_ALERT_HIT_DET
        success: function (data) {
          // Handle the success response
  
          var itemResult = JSON.parse(data.Response)
  
          if (itemResult.type == 'E') {
            new sap.m.MessageBox.error(itemResult.message)
          } else if (itemResult.type == 'S') {
            sap.m.MessageToast.show(itemResult.message)
          } else if (itemResult.type == 'W') {
            sap.m.MessageBox.warning(itemResult.message)
          }
          // Update Address Hits Status
          selectedItems.forEach(function (Item) {
            if (Item.Status == 'Open') {
              Item.Status = 'Submitted';
            }
          })
          // Refresh the model to reflect the changes
          oModel.refresh(true)
        },
        error: function (error) {
          // Handle the error response
        }
      })
    },
  
    onCompleteItem: function (oEvent) {
      var oSelectionPath = oEvent.getSource().getBindingContext('M1').getPath()
      var num = oSelectionPath.substring(8)
      var oModel = this.getView().getModel('M1')
      var oData = oModel.getData()
      var selectedItems = oData.result[num].Item
      var selectedItem = oData.result[num].Item[0]
  
      const finalData = {
        AlertKey: selectedItem.DBkey,
        ItemKey: selectedItem.ItemDBkey,
        SummText: ' ',
        Response: ' '
      }
  
      var that = this;
      var openItem = false
  
      selectedItems.forEach(function (Item) {
        if (Item.Status == 'Open') {
          openItem = true
        }
      })
      this.openCompleteDialog(openItem, finalData, oModel, oSelectionPath,selectedItems,that)
    },
    onLinkPress: function (oEvent) {
    
      var oSelectionPath = oEvent.getSource().getBindingContext('M1').getPath();
      var oModel = this.getView().getModel('M1');
      var oData = oModel.getProperty(oSelectionPath);
      var sEntityDBKey = oData.EntityDBKey;
  
      var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
  
      // Generate the hash
      var sHash = oCrossAppNav.hrefForExternal({
        target: {
          semanticObject: "AddressScreeningList", // Replace with your target app's semantic object
          action: "manage" // Replace with your target app's action
        },
        params: {
          EntityDBKey: sEntityDBKey // Pass the link ID as a parameter
        }
      })
      // Open the URL in a new tab
      window.open(sHash, '_blank');
      // oCrossAppNav.toExternal({ target: { shellHash: sHash }, newWindow: true });  
    },
    // Header Checkbox Select
    onHeaderCheckboxSelect: function (oEvent) {
      debugger
      var bSelected = oEvent.getParameter('selected')
      var oSelectionPath = oEvent.getSource().getBindingContext('M1').getPath()
      var itemPath = oSelectionPath + '/Item'
      var num = oSelectionPath.substring(8)
      var oModel = this.getView().getModel('M1')
      var oData = oModel.getData()
      var selectedItems = oData.result[num].Item
  
      oData.result[num].isItemSelected = bSelected //Enable buttons if checkbox selected
      selectedItems.forEach(function (path) {
        if (path.isCheckBoxVisible === 'true') {
          path.isSelected = bSelected
        }
      })
      oModel.setProperty(itemPath, selectedItems)
    },
  
    // Item Checkbox Select
    onItemCheckboxSelect: function (oEvent) {
      debugger
      var bSelected = oEvent.getParameter('selected')
      var oSelectionPath = oEvent.getSource().getBindingContext('M1').getPath()
      var oModel = this.getView().getModel('M1') // Assuming your model name is "data"
      var odata = oModel.getProperty(oSelectionPath)
      odata.isSelected = bSelected
      var oHeaderPath = oSelectionPath.substring(
        0,
        oSelectionPath.indexOf('/Item')
      )
      var oHeaderData = oModel.getProperty(oHeaderPath)
      oHeaderData.isItemSelected = bSelected // Set header as selected if Item selected
      oModel.setProperty(oHeaderPath, oHeaderData)
      oModel.setProperty(oSelectionPath, odata)
    },
    // Function to open the dialog
    openCompleteDialog: function (openItem, finalData, oModel, oSelectionPath,selectedItems,that) {
    
      // Create a message strip
      var oMessageStrip = new sap.m.MessageStrip({
        text: '{i18n>DecisionWarning}',
        type: 'Warning',
        showIcon: true,
        visible: openItem,
        enableFormattedText: true
      })
  
      // Create a text input field
      var oInput = new sap.m.TextArea({
        placeholder: 'Enter Summary...',
        width: '400px',
        height: '200px',
        id: 'summaryField',
        maxLength: 16000
      })
  
      // Create a dialog
      var oDialog = new sap.m.Dialog({
        title: 'Complete Item',
        content: [oMessageStrip, oInput],
        beginButton: new sap.m.Button({
          text: 'Save',
          press: function () {
            // Logic to handle the submission
            // var summary = sap.ui.getCore().byId("summaryField").getValue();
            var oTextArea = sap.ui.getCore().byId('summaryField')
            var sValue = oTextArea.getValue()
  
            if (!sValue) {
              // TextArea is empty, show an error message and prevent form submission
              oTextArea.setValueState(sap.ui.core.ValueState.Error)
              oTextArea.setValueStateText('Please enter a summary') // Custom error message
            } else {
              // TextArea is filled, proceed with form submission
              oTextArea.setValueState(sap.ui.core.ValueState.None)
              oDialog.close()
              finalData.SummText = sValue;
              that.completeItem(finalData, oModel, oSelectionPath,selectedItems)
            }
          }
        }),
        endButton: new sap.m.Button({
          text: 'Cancel',
          press: function () {
            oDialog.close()
          }
        }),
        afterClose: function () {
          oDialog.destroy()
        }
      })
  
      // Open the dialog
      oDialog.open()
    }
  })