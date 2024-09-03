sap.ui.controller('copilot.copilot', {
  /*
   * Called when a controller is instantiated and its View controls (if available) are already created.
   * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
   * @memberOf alertinfo.Alert_Info
   */
  onInit: function () {
    var oTable = this.getView().byId('OwnershipTableId')

    if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
      var oUserInfo = sap.ushell.Container.getService('UserInfo')
      this.getOwnerComponent()._UserName = oUserInfo.getUser().getFirstName()
    } else {
      this.getOwnerComponent()._UserName = 'User'
    }

    oTable.attachUpdateFinished(function (oEvent) {
      // Your custom logic here
      var oItems = oTable.getItems()
      // for (var i = 0; i < oItems.length; i++) {
      //     if (oItems[i].getBindingContext("pf3").getProperty("CSH_DirectAndDate") === "No Sanction Found") {
      //         oItems[i].getCells()[4].addStyleClass("highlightedTextGreen");
      //     } else {
      //         oItems[i].getCells()[4].addStyleClass("highlightedTextRed");
      //     }
      //     if (oItems[0].getBindingContext("pf3").getProperty("CSH_Sanction") === "No Sanction Found") {
      //         oItems[i].getCells()[3].addStyleClass("highlightedTextGreen");
      //     } else {
      //         oItems[i].getCells()[3].addStyleClass("highlightedTextRed");
      //     }
      // }
    })
  },

  generateGUID: function () {
    function s4 () {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1)
    }
    return (
      s4() +
      s4() +
      '-' +
      s4() +
      '-4' +
      s4().substr(0, 3) +
      '-' +
      s4() +
      '-' +
      s4() +
      s4() +
      s4()
    )
  },

  getBingResult: async function (sValue, result) {
    var that = this
    this.getOwnerComponent()._guid = this.generateGUID()
    this.getOwnerComponent()._guid1 = this.generateGUID()
    var bingURL = this.getOwnerComponent()._bingURL
    $.ajax({
      url: 'https://www.bingapis.com/api/v1/chat/create',
      type: 'GET',
      data: {
        appid: this.getOwnerComponent()._bingAPI,
        pid: this.getOwnerComponent()._guid
      },
      success: function (response) {
        console.log(response)
        that.getOwnerComponent()._response = response
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(bingURL, {
            skipNegotiation: true,
            transport: 1,
            withCredentials: false
          })
          .withAutomaticReconnect()
          .build()
        const initialMessage = {
          // source: "BingApiTest",
          // allowedMessageTypes: DEFAULT_ALLOWED_MESSAGE_TYPES,
          source: 'BingApiProd',
          isStartOfSession: true,
          requestId: that.getOwnerComponent()._guid,
          conversationSignature:
            that.getOwnerComponent()._response.conversationSignature,
          conversationId: that.getOwnerComponent()._response.conversationId,
          participant: { id: that.getOwnerComponent()._response.participantId },
          message: {
            text: sValue,
            author: 'user',
            inputMethod: 'Keyboard',
            requestId: that.getOwnerComponent()._guid,
            messageId: that.getOwnerComponent()._guid1,
            market: 'en-US',
            MessageType: 'Chat'
          },
          optionSets: ['stream_writes', 'flux_prompt_v1']
        }
        connection.on('send', initialMessage => {
          console.log(initialMessage)
        })

        connection.start().then(function () {
          console.log('Connected!')
          connection.stream('Chat', initialMessage).subscribe({
            complete: () => {
              connection.stop()
            },
            next: function (response) {
              result = response.result.message
            },
            error: err => {
              console.error('Error:', err)
            }
          })
        })
      }
    })
  },

  onListItemPress: function (oEvent) {

    // BOC - Counter - TAPERI
      var oData = this.getView().getModel('pf1').getData();
      const finalJSON = {
        Alert: oData.AlertID,
        MoodyMatchesSelected: 1
      };
      this._updateCounter(finalJSON);
    // EOC - Counter - TAPERI

    var oView = this.getView()
    if (oView.getModel('pf5')) {
      oView.getModel('pf5').setData(null)
    }
    if (oView.getModel('pf6')) {
      oView.getModel('pf6').setData(null)
    }
    if (oView.getModel('pf7')) {
      oView.getModel('pf7').setData(null)
    }
    if (oView.getModel('pf10')) {
      oView.getModel('pf10').setData(null)
    }

    // Get the Path
    var sPath = oEvent.getSource().getBindingContextPath()
    var that = this
    var oValue = this.getView().getModel('pf2').getProperty(sPath)
    this.getOwnerComponent()._CompnayInformationStringfy =
      JSON.stringify(oValue)

    var oContext = oEvent.getSource().getBindingContextPath()
    // Create the Model

    // Create IconTabFilters
    var oIconTabBar = this.byId('idIconTabBar')
    if (oIconTabBar.getItems().length === 3) {
      this.createIconTabFilters(
        oIconTabBar,
        'Sanctions',
        'Sanction information',
        'sap-icon://bullet-text'
      )
    }
    this.oBusy.open()

    // get the access token for sanction 360
    jQuery.ajax({
      url: 'https://backend.sanctions360.moodysanalytics.com/v2/auth/token',
      method: 'GET',
      data: {
        apiKey: this.getOwnerComponent()._sanctionTokenAPI
      },
      success: function (data, textStatus, xhr) {
        that.oBusy.close()
        // Handle success
        that.getOwnerComponent()._sanction360Token = data.data
        console.log('Success:', 'Sanction360 API Token')
        that.runMooydsAPI(oValue, that, oIconTabBar)
      },
      error: function (error) {
        // Handle error
        that.oBusy.close()
        console.error('Error:', error)
      }
    })
  },

  runMooydsAPI: function (oValue, that, oIconTabBar) {
    var oModel = new sap.ui.model.json.JSONModel()
    var oModel1 = new sap.ui.model.json.JSONModel()

    var oModel4 = new sap.ui.model.json.JSONModel()

    //API Payload

    var aOwnerShip = {
      WHERE: [
        {
          BvDID: [oValue.BvDId]
        }
      ],
      SELECT: [
        {
          SANCTION_BY_EXTENSION: {
            SELECT: [
              'SBE_EU_CONS_INDICATOR',
              'SBE_OFAC_SSI_INDICATOR',
              'SBE_OFAC_SDN_INDICATOR'
            ]
          }
        },
        {
          PRIMARY_CODE: {
            SELECT: ['INDUSTRY_PRIMARY_CODE', 'INDUSTRY_PRIMARY_LABEL']
          }
        },
        {
          SECONDARY_CODE: {
            SELECT: ['INDUSTRY_SECONDARY_CODE', 'INDUSTRY_SECONDARY_LABEL']
          }
        },

        {
          SHAREHOLDERS: {
            SELECT: [
              'SH_WORLDCOMPLIANCE_MATCH_EXCEPT_SBE_INDICATOR',
              'SH_WORLDCOMPLIANCE_MATCH_SBE_INDICATOR_LABEL',
              'SH_ENTITY_TYPE',
              'SH_BVD_ID_NUMBER',
              'SH_UCI',
              'SH_NAME',
              'SH_COUNTRY_ISO_CODE',
              'SH_DIRECT_PCT',
              'SH_TOTAL_PCT'
            ]
          }
        },

        {
          CONTROLLING_SHAREHOLDERS: {
            SELECT: [
              'CSH_WORLDCOMPLIANCE_MATCH_EXCEPT_SBE_INDICATOR',
              'CSH_WORLDCOMPLIANCE_MATCH_SBE_INDICATOR_LABEL',
              'CSH_ENTITY_TYPE',
              'CSH_BVD_ID_NUMBER',
              'CSH_UCI',
              'CSH_NAME',
              'CSH_COUNTRY_ISO_CODE',
              'CSH_DIRECT_PCT',
              'CSH_TOTAL_PCT'
            ]
          }
        },

        {
          NAME: {
            AS: 'NAME'
          }
        },
        {
          COUNTRY_ISO_CODE: {
            AS: 'COUNTRY_ISO_CODE'
          }
        },
        {
          CITY: {
            AS: 'CITY'
          }
        },
        {
          NACE2_CORE_CODE: {
            AS: 'NACE2_CORE_CODE'
          }
        },
        {
          CONSOLIDATION_CODE: {
            AS: 'CONSOLIDATION_CODE'
          }
        },
        {
          YEAR_LAST_ACCOUNTS: {
            AS: 'YEAR_LAST_ACCOUNTS'
          }
        },
        {
          ADDRESS_LINE1: {
            AS: 'ADDRESS_LINE1'
          }
        },
        {
          ADDRESS_LINE2: {
            AS: 'ADDRESS_LINE2'
          }
        },
        {
          ADDRESS_LINE3: {
            AS: 'ADDRESS_LINE3'
          }
        },
        {
          ADDRESS_LINE4: {
            AS: 'ADDRESS_LINE4'
          }
        },
        {
          POSTCODE: {
            AS: 'POSTCODE'
          }
        },
        {
          CITY: {
            AS: 'CITY_1'
          }
        },
        {
          CITY_STANDARDIZED: {
            AS: 'CITY_STANDARDIZED'
          }
        },
        {
          COUNTRY: {
            AS: 'COUNTRY'
          }
        },
        {
          COUNTRY_ISO_CODE: {
            AS: 'COUNTRY_ISO_CODE_1'
          }
        },
        {
          TERRITORY_ISO_CODE: {
            AS: 'TERRITORY_ISO_CODE'
          }
        },
        {
          LATITUDE: {
            AS: 'LATITUDE'
          }
        },
        {
          LONGITUDE: {
            AS: 'LONGITUDE'
          }
        },
        {
          COUNTRY_REGION: {
            AS: 'COUNTRY_REGION'
          }
        },
        {
          COUNTRY_REGION_TYPE: {
            AS: 'COUNTRY_REGION_TYPE'
          }
        },
        {
          NUTS1: {
            AS: 'NUTS1'
          }
        },
        {
          NUTS2: {
            AS: 'NUTS2'
          }
        },
        {
          NUTS3: {
            AS: 'NUTS3'
          }
        },
        {
          MSA: {
            AS: 'MSA'
          }
        },
        {
          WORLD_REGION: {
            AS: 'WORLD_REGION'
          }
        },
        {
          US_STATE: {
            AS: 'US_STATE'
          }
        },
        {
          COUNTY: {
            AS: 'COUNTY'
          }
        },
        {
          ADDRESS_TYPE: {
            AS: 'ADDRESS_TYPE'
          }
        },
        {
          PHONE_NUMBER: {
            AS: 'PHONE_NUMBER'
          }
        },
        {
          FAX_NUMBER: {
            AS: 'FAX_NUMBER'
          }
        },
        {
          DOMAIN: {
            AS: 'DOMAIN'
          }
        },
        {
          WEBSITE: {
            AS: 'WEBSITE'
          }
        },
        {
          EMAIL: {
            AS: 'EMAIL'
          }
        },
        {
          TRADE_DESCRIPTION_EN: {
            AS: 'TRADE_DESCRIPTION_EN'
          }
        },
        {
          TRADE_DESCRIPTION_ORIGINAL: {
            AS: 'TRADE_DESCRIPTION_ORIGINAL'
          }
        },
        {
          TRADE_DESCRIPTION_LANGUAGE: {
            AS: 'TRADE_DESCRIPTION_LANGUAGE'
          }
        },
        {
          PRODUCTS_SERVICES: {
            AS: 'PRODUCTS_SERVICES'
          }
        },
        {
          DESCRIPTION_HISTORY: {
            AS: 'DESCRIPTION_HISTORY'
          }
        },
        {
          BVD_SECTOR_CORE_LABEL: {
            AS: 'BVD_SECTOR_CORE_LABEL'
          }
        },
        {
          SPECIALISATION: {
            AS: 'SPECIALISATION'
          }
        },
        {
          REINSURANCE_COMPANY_INDICATOR: {
            AS: 'REINSURANCE_COMPANY_INDICATOR'
          }
        },
        {
          INDUSTRY_CLASSIFICATION: {
            AS: 'INDUSTRY_CLASSIFICATION'
          }
        },
        {
          INDUSTRY_PRIMARY_CODE: {
            AS: 'INDUSTRY_PRIMARY_CODE'
          }
        },
        {
          INDUSTRY_PRIMARY_LABEL: {
            AS: 'INDUSTRY_PRIMARY_LABEL'
          }
        },
        {
          INDUSTRY_SECONDARY_CODE: {
            AS: 'INDUSTRY_SECONDARY_CODE'
          }
        },
        {
          INDUSTRY_SECONDARY_LABEL: {
            AS: 'INDUSTRY_SECONDARY_LABEL'
          }
        },
        {
          NACE2_MAIN_SECTION: {
            AS: 'NACE2_MAIN_SECTION'
          }
        },

        {
          NACE2_CORE_LABEL: {
            AS: 'NACE2_CORE_LABEL'
          }
        },

        {
          NACE2_SECONDARY_CODE: {
            AS: 'NACE2_SECONDARY_CODE'
          }
        },
        {
          NACE2_SECONDARY_LABEL: {
            AS: 'NACE2_SECONDARY_LABEL'
          }
        },
        {
          NAICS2017_CORE_CODE: {
            AS: 'NAICS2017_CORE_CODE'
          }
        },
        {
          NAICS2017_CORE_LABEL: {
            AS: 'NAICS2017_CORE_LABEL'
          }
        },
        {
          NAICS2017_PRIMARY_CODE: {
            AS: 'NAICS2017_PRIMARY_CODE'
          }
        },
        {
          NAICS2017_PRIMARY_LABEL: {
            AS: 'NAICS2017_PRIMARY_LABEL'
          }
        },
        {
          NAICS2017_SECONDARY_CODE: {
            AS: 'NAICS2017_SECONDARY_CODE'
          }
        },
        {
          NAICS2017_SECONDARY_LABEL: {
            AS: 'NAICS2017_SECONDARY_LABEL'
          }
        },
        {
          NAICS2022_CORE_CODE: {
            AS: 'NAICS2022_CORE_CODE'
          }
        },
        {
          NAICS2022_CORE_LABEL: {
            AS: 'NAICS2022_CORE_LABEL'
          }
        },
        {
          NAICS2022_PRIMARY_CODE: {
            AS: 'NAICS2022_PRIMARY_CODE'
          }
        },
        {
          NAICS2022_PRIMARY_LABEL: {
            AS: 'NAICS2022_PRIMARY_LABEL'
          }
        },
        {
          NAICS2022_SECONDARY_CODE: {
            AS: 'NAICS2022_SECONDARY_CODE'
          }
        },
        {
          NAICS2022_SECONDARY_LABEL: {
            AS: 'NAICS2022_SECONDARY_LABEL'
          }
        },

        {
          NATIONAL_ID: {
            AS: 'NATIONAL_ID'
          }
        },
        {
          NATIONAL_ID_LABEL: {
            AS: 'NATIONAL_ID_LABEL'
          }
        },
        {
          NATIONAL_ID_TYPE: {
            AS: 'NATIONAL_ID_TYPE'
          }
        },
        {
          TRADE_REGISTER_NUMBER: {
            AS: 'TRADE_REGISTER_NUMBER'
          }
        },
        {
          VAT_NUMBER: {
            AS: 'VAT_NUMBER'
          }
        },
        {
          EUROPEAN_VAT_NUMBER: {
            AS: 'EUROPEAN_VAT_NUMBER'
          }
        },
        {
          ECB_FVC_ID: {
            AS: 'ECB_FVC_ID'
          }
        },
        {
          ECB_MFI_ID: {
            AS: 'ECB_MFI_ID'
          }
        },
        {
          TIN: {
            AS: 'TIN'
          }
        },
        {
          LEI: {
            AS: 'LEI'
          }
        },
        {
          STATISTICAL_NUMBER: {
            AS: 'STATISTICAL_NUMBER'
          }
        },
        {
          COMPANY_ID_NUMBER: {
            AS: 'COMPANY_ID_NUMBER'
          }
        },
        {
          NATIONAL_ID_PREVIOUS: {
            AS: 'NATIONAL_ID_PREVIOUS'
          }
        },
        {
          NATIONAL_ID_DATE_PREVIOUS: {
            FILTERS:
              'Filter.Name=IdentifierCodeFilter;IdentifierCodeFilter.Codes=10040|previous;',
            AS: 'NATIONAL_ID_DATE_PREVIOUS'
          }
        },
        {
          SWIFT_CODE: {
            AS: 'SWIFT_CODE'
          }
        },
        {
          INFORMATION_PROVIDER_ID: {
            AS: 'INFORMATION_PROVIDER_ID'
          }
        },
        {
          INFORMATION_PROVIDER_ID_LABEL: {
            AS: 'INFORMATION_PROVIDER_ID_LABEL'
          }
        },
        {
          TICKER: {
            AS: 'TICKER'
          }
        },
        {
          ISIN: {
            AS: 'ISIN'
          }
        },
        {
          AKA_NAME: {
            AS: 'AKA_NAME'
          }
        },

        {
          LEI_STATUS: {
            AS: 'LEI_STATUS'
          }
        },
        {
          LEI_FIRST_ASSIGNMENT_DATE: {
            AS: 'LEI_FIRST_ASSIGNMENT_DATE'
          }
        },
        {
          LEI_ANNUAL_RENEWAL_DATE: {
            AS: 'LEI_ANNUAL_RENEWAL_DATE'
          }
        },
        {
          LEI_MANAGING_LOCAL_OFFICE_UNIT_STR: {
            AS: 'LEI_MANAGING_LOCAL_OFFICE_UNIT_STR'
          }
        },
        {
          LEI_STATUS: {
            AS: 'LEI_STATUS_1'
          }
        },
        {
          LEI_FIRST_ASSIGNMENT_DATE: {
            AS: 'LEI_FIRST_ASSIGNMENT_DATE_1'
          }
        },
        {
          LEI_ANNUAL_RENEWAL_DATE: {
            AS: 'LEI_ANNUAL_RENEWAL_DATE_1'
          }
        },
        {
          LEI_MANAGING_LOCAL_OFFICE_UNIT_STR: {
            AS: 'LEI_MANAGING_LOCAL_OFFICE_UNIT_STR_1'
          }
        },
        {
          NAME: {
            AS: 'NAME_1'
          }
        },
        {
          PREVIOUS_NAME: {
            AS: 'PREVIOUS_NAME'
          }
        },
        {
          PREVIOUS_NAME_DATE: {
            AS: 'PREVIOUS_NAME_DATE'
          }
        },

        {
          RELEASE_DATE: {
            AS: 'RELEASE_DATE'
          }
        },
        {
          INFORMATION_PROVIDER: {
            AS: 'INFORMATION_PROVIDER'
          }
        },
        {
          INFORMATION_PROVIDER_COLLECTION_DATE: {
            AS: 'INFORMATION_PROVIDER_COLLECTION_DATE'
          }
        },
        {
          COMPANY_CATEGORY: {
            AS: 'COMPANY_CATEGORY'
          }
        },
        {
          STATUS: {
            AS: 'STATUS'
          }
        },
        {
          STATUS_DATE: {
            AS: 'STATUS_DATE'
          }
        },
        {
          STATUS_CHANGE_DATE: {
            AS: 'STATUS_CHANGE_DATE'
          }
        },
        {
          LOCAL_STATUS: {
            AS: 'LOCAL_STATUS'
          }
        },
        {
          LOCAL_STATUS_DATE: {
            AS: 'LOCAL_STATUS_DATE'
          }
        },
        {
          LOCAL_STATUS_CHANGE_DATE: {
            AS: 'LOCAL_STATUS_CHANGE_DATE'
          }
        },
        {
          STANDARDISED_LEGAL_FORM: {
            AS: 'STANDARDISED_LEGAL_FORM'
          }
        },
        {
          NATIONAL_LEGAL_FORM: {
            AS: 'NATIONAL_LEGAL_FORM'
          }
        },
        {
          BRANCH_INDICATOR: {
            AS: 'BRANCH_INDICATOR'
          }
        },
        {
          INCORPORATION_DATE: {
            AS: 'INCORPORATION_DATE'
          }
        },
        {
          INCORPORATION_STATE: {
            AS: 'INCORPORATION_STATE'
          }
        },
        {
          INCORPORATION_STATE_CODE: {
            AS: 'INCORPORATION_STATE_CODE'
          }
        },
        {
          ENTITY_TYPE: {
            AS: 'ENTITY_TYPE'
          }
        }
      ]
    }

    var accessToken = that.getOwnerComponent()._accessToken
    var url = 'https://api.bvdinfo.com/v1/orbis/companies/data'
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(aOwnerShip)
    }
    that.oBusy.open()
    fetch(url, requestOptions)
      .then(response => response.json())
      .then(data => {
        // Handle the response data here
        that.oBusy.close()
        data.Data.forEach(obj => that.removeNull(obj))
        that.getOwnerComponent()._companyOwnerShipData = data

        // that.getOwnerComponent()._companyOwnerShipDataString = that.getOwnerComponent()._companyOwnerShipDataString + that.getOwnerComponent()._CompnayInformationStringfy;
        if (data.length === 0) {
          sap.m.MessageToast.show('No Data Found Please try with Co-Pilot')
          return
        }

        // that.onLLM(null, false, JSON.stringify(data), "Please Provide Prompt Question for the Above Data in Number format", true, false);

        var sanctionAccessToken = that.getOwnerComponent()._sanction360Token
        url = 'https://backend.sanctions360.moodysanalytics.com/v2/entity/'
        // url = url + oValue.BvDId + "/sanctions";
        url = url + oValue.BvDId + '/ownership-risk'
        that.getView().byId('directListId').setBusy(true)
        that.getView().byId('extensionListId').setBusy(true)
        that.getView().byId('OwnershipTableId').setBusy(true)

        jQuery.ajax({
          url: url,
          method: 'GET',
          beforeSend: function (xhr) {
            xhr.setRequestHeader(
              'Authorization',
              'Bearer ' + sanctionAccessToken
            )
          },
          success: function (directSanctionData) {
            that.oBusy.close()
            that.getView().byId('directListId').setBusy(false)
            that.getView().byId('extensionListId').setBusy(false)
            that.getView().byId('OwnershipTableId').setBusy(false)

            var data = that.getOwnerComponent()._companyOwnerShipData
            var run = false
            if (data.Data[0].CONTROLLING_SHAREHOLDERS) {
              run = true
            }

            if (data.Data[0].SHAREHOLDERS) {
              if (!data.Data[0].CONTROLLING_SHAREHOLDERS) {
                data.Data[0].CONTROLLING_SHAREHOLDERS = []
                run = true
              }
              var aControllingShare = {}
              var isDuplicate
              if (run) {
                for (var i = 0; i < data.Data[0].SHAREHOLDERS.length; i++) {
                  var shareholderItem = data.Data[0].SHAREHOLDERS[i]
                  var shareholderBVDId = shareholderItem.SH_BVD_ID_NUMBER
                  isDuplicate = false
                  // Check if the BVD ID exists in the Controlling array
                  for (
                    var j = 0;
                    j < data.Data[0].CONTROLLING_SHAREHOLDERS.length;
                    j++
                  ) {
                    var controllingItem =
                      data.Data[0].CONTROLLING_SHAREHOLDERS[j]
                    var controllingBVDId = controllingItem.CSH_BVD_ID_NUMBER

                    if (shareholderBVDId === controllingBVDId) {
                      isDuplicate = true
                      break
                    }
                  }

                  // If duplicate, remove from Shareholder array
                  if (isDuplicate) {
                    data.Data[0].SHAREHOLDERS.splice(i, 1)
                    i-- // Adjust the index as the array length has decreased
                  }
                }
              }
            }
            if (run) {
              for (var i = 0; i < data.Data[0].SHAREHOLDERS.length; i++) {
                aControllingShare.CSH_ENTITY_TYPE =
                  data.Data[0].SHAREHOLDERS[i].SH_ENTITY_TYPE
                aControllingShare.CSH_NAME =
                  data.Data[0].SHAREHOLDERS[i].SH_NAME
                aControllingShare.CSH_COUNTRY_ISO_CODE =
                  data.Data[0].SHAREHOLDERS[i].SH_COUNTRY_ISO_CODE
                aControllingShare.CSH_DIRECT_PCT =
                  data.Data[0].SHAREHOLDERS[i].SH_DIRECT_PCT
                aControllingShare.CSH_TOTAL_PCT =
                  data.Data[0].SHAREHOLDERS[i].SH_TOTAL_PCT
                aControllingShare.CSH_BVD_ID_NUMBER =
                  data.Data[0].SHAREHOLDERS[i].SH_BVD_ID_NUMBER
                aControllingShare.CSH_UCI = data.Data[0].SHAREHOLDERS[i].SH_UCI
                data.Data[0].CONTROLLING_SHAREHOLDERS.push(aControllingShare)
                aControllingShare = {}
              }
              // oModel.setData(data.Data[0].CONTROLLING_SHAREHOLDERS);
              for (
                var i = 0;
                i < data.Data[0].CONTROLLING_SHAREHOLDERS.length;
                i++
              ) {
                if (i + 1 !== data.Data[0].CONTROLLING_SHAREHOLDERS.length) {
                  if (
                    data.Data[0].CONTROLLING_SHAREHOLDERS[
                      i
                    ].CSH_ENTITY_TYPE.includes('individual')
                  ) {
                    data.Data[0].CONTROLLING_SHAREHOLDERS[i].CSH_BVD_ID_NUMBER =
                      data.Data[0].CONTROLLING_SHAREHOLDERS[i].CSH_UCI
                  }
                  // that.callSantion360(data.Data[0].CONTROLLING_SHAREHOLDERS[i]
                  //     , that.getOwnerComponent()._sanction360Token, i, that, oModel, false, data.Data[0].CONTROLLING_SHAREHOLDERS);
                } else {
                  // that.callSantion360(data.Data[0].CONTROLLING_SHAREHOLDERS[i]
                  //     , that.getOwnerComponent()._sanction360Token, i, that, oModel, true, data.Data[0].CONTROLLING_SHAREHOLDERS, data.Data, oModel4);
                }
              }
            } else {
              that.getOwnerComponent()._companyOwnerShipDataString =
                JSON.stringify(data.Data[0]) //+ that.getOwnerComponent._directSanctionStringData;
              that.onLLM(
                null,
                false,
                that.getOwnerComponent()._companyOwnerShipDataString,
                'With the above data, tell if you have anything on the legal information? and also show additional information such as AKA NAME, Vat number, Tax id, Company Number, LEI and other information? ',
                false,
                'pf10',
                oModel4,
                false
              )
            }

            if (directSanctionData.data.nodes.length > 0) {
              for (var i = 0; i < directSanctionData.data.nodes.length; i++) {
                if (directSanctionData.data.nodes[i].bvdId === oValue.BvDId) {
                  directSanctionData.data.nodes[i].sanctionsByExt =
                    directSanctionData.data.nodes[i].sanctionsByExt.filter(
                      item => typeof item.percentage === 'number'
                    )
                  var oModel11 = new sap.ui.model.json.JSONModel(
                    directSanctionData.data.nodes[i]
                  )
                  that.getView().setModel(oModel11, 'pf11')
                  if (
                    directSanctionData.data.nodes[i].sanctionsByExt.length >
                      0 ||
                    directSanctionData.data.nodes[i].sanctions.length > 0
                  ) {
                    data.Data[0].SANCTION_BY_EXTENSION =
                      directSanctionData.data.nodes[i]
                  }
                  that.getOwnerComponent._directSanctionStringData =
                    JSON.stringify(directSanctionData.data)
                }
                if (run) {
                  for (
                    var j = 0;
                    j < data.Data[0].CONTROLLING_SHAREHOLDERS.length;
                    j++
                  ) {
                    if (
                      directSanctionData.data.nodes[i].bvdId ===
                      data.Data[0].CONTROLLING_SHAREHOLDERS[j].CSH_BVD_ID_NUMBER
                    ) {
                      if (
                        directSanctionData.data.nodes[i].sanctionsByExt.length >
                        0
                      ) {
                        for (
                          var k = 0;
                          k <
                          directSanctionData.data.nodes[i].sanctionsByExt
                            .length;
                          k++
                        ) {
                          if (
                            !data.Data[0].CONTROLLING_SHAREHOLDERS[j]
                              .CSH_Sanction
                          ) {
                            data.Data[0].CONTROLLING_SHAREHOLDERS[
                              j
                            ].CSH_Sanction =
                              directSanctionData.data.nodes[i].sanctionsByExt[k]
                                .list +
                              ' with ' +
                              that.getNumberValueForPercentage(
                                directSanctionData.data.nodes[i].sanctionsByExt[
                                  k
                                ].percentage
                              ) +
                              '%'
                          } else {
                            data.Data[0].CONTROLLING_SHAREHOLDERS[
                              j
                            ].CSH_Sanction =
                              data.Data[0].CONTROLLING_SHAREHOLDERS[j]
                                .CSH_Sanction +
                              ', ' +
                              directSanctionData.data.nodes[i].sanctionsByExt[k]
                                .list +
                              ' with ' +
                              that.getNumberValueForPercentage(
                                directSanctionData.data.nodes[i].sanctionsByExt[
                                  k
                                ].percentage
                              ) +
                              '%'
                          }
                        }
                      } else {
                        data.Data[0].CONTROLLING_SHAREHOLDERS[j].CSH_Sanction =
                          'No Sanction Found'
                      }

                      if (
                        directSanctionData.data.nodes[i].sanctions.length > 0
                      ) {
                        for (
                          var k = 0;
                          k < directSanctionData.data.nodes[i].sanctions.length;
                          k++
                        ) {
                          if (
                            !data.Data[0].CONTROLLING_SHAREHOLDERS[j]
                              .CSH_DirectAndDate
                          ) {
                            data.Data[0].CONTROLLING_SHAREHOLDERS[
                              j
                            ].CSH_DirectAndDate =
                              directSanctionData.data.nodes[i].sanctions[k]
                                .list +
                              ' and ' +
                              that.formatDate(
                                directSanctionData.data.nodes[i].sanctions[k]
                                  .since
                              )
                          } else {
                            data.Data[0].CONTROLLING_SHAREHOLDERS[
                              j
                            ].CSH_DirectAndDate =
                              data.Data[0].CONTROLLING_SHAREHOLDERS[j]
                                .CSH_DirectAndDate +
                              ', ' +
                              directSanctionData.data.nodes[i].sanctions[k]
                                .list +
                              ' and ' +
                              that.formatDate(
                                directSanctionData.data.nodes[i].sanctions[k]
                                  .since
                              )
                          }
                        }
                      } else {
                        data.Data[0].CONTROLLING_SHAREHOLDERS[
                          j
                        ].CSH_DirectAndDate = 'No Sanction Found'
                      }
                    }
                  }
                }
              }
              oModel.setData(data.Data[0].CONTROLLING_SHAREHOLDERS)
              that.getView().setModel(oModel, 'pf3')
              that.getOwnerComponent()._companyOwnerShipDataString =
                JSON.stringify(data.Data[0]) //+ that.getOwnerComponent._directSanctionStringData;
              if (
                that.getOwnerComponent()._companyOwnerShipDataString.length >
                12000
              ) {
                that.getOwnerComponent()._companyOwnerShipDataString = that
                  .getOwnerComponent()
                  ._companyOwnerShipDataString.substring(0, 12000)
              }
              that.onLLM(
                null,
                false,
                that.getOwnerComponent()._companyOwnerShipDataString,
                'With the Above data, tell if you have anything on the legal information? and also show additional information such as AKA NAME, Vat number, Tax id, Company Number, LEI and other information? ',
                false,
                'pf10',
                oModel4,
                false
              )
            }
          },
          error: function (error) {
            that.oBusy.close()
            that.getView().byId('directListId').setBusy(false)
            that.getView().byId('extensionListId').setBusy(false)
            // Handle the error response
            console.error('Error:', error)
          }
        })

        // that.getView().setModel(oModel, "pf3");

        if (data.Data[0].SANCTION_BY_EXTENSION) {
          if (
            data.Data[0].SANCTION_BY_EXTENSION.SBE_EU_CONS_INDICATOR === true
          ) {
            var Sanction1 = 'Santioned'
            // that.getView().byId("sanction1Id").addStyleClass("highlightedTextRed");
          } else {
            Sanction1 = 'Not Santioned'
            // that.getView().byId("sanction1Id").addStyleClass("highlightedTextGreen");
          }
          if (
            data.Data[0].SANCTION_BY_EXTENSION.SBE_OFAC_SSI_INDICATOR === true
          ) {
            var Sanction2 = 'Santioned'
            // that.getView().byId("sanction2Id").addStyleClass("highlightedTextRed");
          } else {
            Sanction2 = 'Not Santioned'
            // that.getView().byId("sanction2Id").addStyleClass("highlightedTextGreen");
          }
          if (
            data.Data[0].SANCTION_BY_EXTENSION.SBE_OFAC_SDN_INDICATOR === true
          ) {
            var Sanction3 = 'Santioned'
            // that.getView().byId("sanction3Id").addStyleClass("highlightedTextRed");
          } else {
            Sanction3 = 'Not Santioned'
            // that.getView().byId("sanction3Id").addStyleClass("highlightedTextGreen");
          }
        }
        if (!data.Data[0].TRADE_REGISTER_NUMBER) {
          data.Data[0].TRADE_REGISTER_NUMBER = 'Data not available'
        }
        if (!data.Data[0].VAT_NUMBER) {
          data.Data[0].VAT_NUMBER = 'Data not available'
        }
        if (!data.Data[0].LEI) {
          data.Data[0].LEI = 'Data not available'
        }
        var aData1 = {
          Name: oValue.Name,
          Address: oValue.Address,
          Address_Type: oValue.Address_Type,
          TRADE_REGISTER_NUMBER: data.Data[0].TRADE_REGISTER_NUMBER,
          VAT_NUMBER: data.Data[0].VAT_NUMBER,
          LEI: data.Data[0].LEI,
          PhoneOrFax: oValue.PhoneOrFax,
          EmailOrWebsite: oValue.EmailOrWebsite,
          National_Id: oValue.National_Id,
          Sanction1: Sanction1,
          Sanction2: Sanction2,
          Sanction3: Sanction3,
          Sanction4: 'There is no Direct Sanction',
          Industry_Classification: data.Data[0].INDUSTRY_CLASSIFICATION,
          NICS: data.Data[0].NACE2_CORE_LABEL,
          SICS: data.Data[0].NAICS2017_CORE_LABEL
        }
        oModel1.setData(aData1)
        that.getView().setModel(oModel1, 'pf4')
      })
      .catch(error => {
        that.oBusy.close()
        // Handle any errors that occurred during the fetch
        console.error('Error:', error)
      })

    // this.getView().setModel(oModel, "pf3");
    // this.getView().setModel(oModel1, "pf4");
    // this.getView().setModel(oModel2, "pf5");
    // this.getView().setModel(oModel3, "pf6");

    that.getView().byId('smartTable').setVisible(false)
    that.getView().byId('smartFormColumn').setVisible(true)
    that.getView().byId('OwnershipTableId').setVisible(true)
    that.getView().byId('smartFormColumn1').setVisible(true)
    that.getView().byId('_IDGenFeedInput1').setVisible(true)
    that.getView().byId('_IDGenList1').setVisible(true)
    that.getView().byId('sanctionTabVerticalID').setVisible(true)
    oIconTabBar.setSelectedKey('Sanctions')
  },

  callSantion360: function (
    ShareholderData,
    sanctionAccessToken,
    index,
    that,
    oModel,
    sLast,
    sBindData,
    sData,
    oModel4
  ) {
    url = 'https://backend.sanctions360.moodysanalytics.com/v2/entity/'
    url = url + ShareholderData.CSH_BVD_ID_NUMBER + '/sanctions'
    if (sLast) {
      that.getView().byId('OwnershipTableId').setBusy(true)
    }

    jQuery.ajax({
      url: url,
      method: 'GET',
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + sanctionAccessToken)
      },
      success: function (directSanctionData) {
        if (directSanctionData.data.byExtension.length > 0) {
          for (var i = 0; i < directSanctionData.data.byExtension.length; i++) {
            if (!ShareholderData.CSH_Sanction) {
              ShareholderData.CSH_Sanction =
                directSanctionData.data.byExtension[i].list +
                ' with ' +
                that.getNumberValueForPercentage(
                  directSanctionData.data.byExtension[i].percentage
                ) +
                '%'
            } else {
              ShareholderData.CSH_Sanction =
                ShareholderData.CSH_Sanction +
                ', ' +
                directSanctionData.data.byExtension[i].list +
                ' with ' +
                that.getNumberValueForPercentage(
                  directSanctionData.data.byExtension[i].percentage
                ) +
                '%'
            }
          }
        } else {
          ShareholderData.CSH_Sanction = 'No Sanction Found'
        }

        if (directSanctionData.data.directs.length > 0) {
          for (var i = 0; i < directSanctionData.data.directs.length; i++) {
            if (!ShareholderData.CSH_DirectAndDate) {
              ShareholderData.CSH_DirectAndDate =
                directSanctionData.data.directs[i].list +
                ' and ' +
                that.formatDate(directSanctionData.data.directs[i].since)
            } else {
              ShareholderData.CSH_DirectAndDate =
                ShareholderData.CSH_DirectAndDate +
                ', ' +
                directSanctionData.data.directs[i].list +
                ' and ' +
                that.formatDate(directSanctionData.data.directs[i].since)
            }
          }
        } else {
          ShareholderData.CSH_DirectAndDate = 'No Sanction Found'
        }
        if (that.getView().getModel('pf3')) {
          oModel.setData(sBindData)
          that.getView().setModel(oModel, 'pf3')
          that.getView().getModel('pf3').refresh(true)
        }

        if (sLast) {
          var oTable = that.getView().byId('OwnershipTableId')
          oTable.setBusy(false)
          oModel.setData(sBindData)
          that.getView().setModel(oModel, 'pf3')
          that.getOwnerComponent()._companyOwnerShipDataString =
            JSON.stringify(sData) //+ that.getOwnerComponent._directSanctionStringData;
          that.onLLM(
            null,
            false,
            that.getOwnerComponent()._companyOwnerShipDataString,
            'tell if you have anything on the legal information? and also show additional information such as AKA NAME, Vat number, Tax id, Company Number, LEI and other information? ',
            false,
            'pf10',
            oModel4,
            false
          )
        }
      },
      error: function (error) {
        that.getView().byId('OwnershipTableId').setBusy(false)
        console.error('Error:', error)
      }
    })
  },

  createIconTabFilters: function (oIconTabBar, sKey, sText, sIcon) {
    var oIconTabFilter1 = new sap.m.IconTabFilter({
      key: sKey,
      text: sText,
      icon: sIcon,
      design: 'Horizontal'
    })

    var oIconTabFilter2 = new sap.m.IconTabFilter({
      key: 'Summary',
      text: 'Summary',
      icon: 'sap-icon://compare',
      design: 'Horizontal'
    })

    oIconTabBar.addItem(oIconTabFilter1)
    oIconTabBar.addItem(oIconTabFilter2)
  },

  onFilterSelect: function (oEvent) {
    var sKey = oEvent.getParameter('key')
    if (sKey === 'Sanctions') {
      this.getView().byId('smartFormSearch').setVisible(false)
      this.getView().byId('idVerticalLayoutBingSearch').setVisible(false)
      this.getView().byId('smartTable').setVisible(false)
      this.getView().byId('smartFormColumn').setVisible(true)
      this.getView().byId('OwnershipTableId').setVisible(true)
      this.getView().byId('idVerticalLayoutOwnership').setVisible(false)
      this.getView().byId('idVerticalLayoutSanction').setVisible(false)
      this.getView().byId('smartFormColumn1').setVisible(true)
      this.getView().byId('_IDGenFeedInput1').setVisible(true)
      this.getView().byId('_IDGenList1').setVisible(true)
      this.getView().byId('smartFormColumn2').setVisible(false)
      this.getView().byId('_IDGenFeedInput2').setVisible(false)
      this.getView().byId('_IDGenList2').setVisible(false)
      this.getView().byId('_IDGenList3').setVisible(false)
      this.getView().byId('sanctionTabVerticalID').setVisible(true)
    }
    if (sKey === 'Summary') {
      this.getView().byId('smartFormSearch').setVisible(false)
      this.getView().byId('idVerticalLayoutBingSearch').setVisible(false)
      this.getView().byId('smartTable').setVisible(false)
      this.getView().byId('smartFormColumn').setVisible(false)
      this.getView().byId('OwnershipTableId').setVisible(false)
      this.getView().byId('idVerticalLayoutOwnership').setVisible(true)
      this.getView().byId('idVerticalLayoutSanction').setVisible(true)
      this.getView().byId('smartFormColumn1').setVisible(false)
      this.getView().byId('_IDGenFeedInput1').setVisible(false)
      this.getView().byId('_IDGenList1').setVisible(false)
      this.getView().byId('smartFormColumn2').setVisible(false)
      this.getView().byId('_IDGenFeedInput2').setVisible(false)
      this.getView().byId('_IDGenList2').setVisible(false)
      this.getView().byId('_IDGenList3').setVisible(false)
      this.getView().byId('sanctionTabVerticalID').setVisible(false)
    }
    if (sKey === 'Match') {
      this.getView().byId('smartFormSearch').setVisible(false)
      this.getView().byId('idVerticalLayoutBingSearch').setVisible(false)
      this.getView().byId('smartTable').setVisible(true)
      this.getView().byId('smartFormColumn').setVisible(false)
      this.getView().byId('OwnershipTableId').setVisible(false)
      this.getView().byId('smartFormColumn1').setVisible(false)
      this.getView().byId('_IDGenFeedInput1').setVisible(false)
      this.getView().byId('idVerticalLayoutSanction').setVisible(false)
      this.getView().byId('idVerticalLayoutOwnership').setVisible(false)
      this.getView().byId('_IDGenList1').setVisible(false)
      this.getView().byId('smartFormColumn2').setVisible(false)
      this.getView().byId('_IDGenFeedInput2').setVisible(false)
      this.getView().byId('_IDGenList2').setVisible(false)
      this.getView().byId('_IDGenList3').setVisible(false)
      this.getView().byId('sanctionTabVerticalID').setVisible(false)
    }

    if (sKey === 'OpenSearch') {
      var run = true
      if (this.getView().getModel('pf12')) {
        var data = this.getView().getModel('pf12').getData()
        if (data) {
          this.getView().byId('smartFormSearch').setVisible(false)
          this.getView().byId('idVerticalLayoutBingSearch').setVisible(true)
          this.getView().byId('smartTable').setVisible(false)
          this.getView().byId('smartFormColumn').setVisible(false)
          this.getView().byId('OwnershipTableId').setVisible(false)
          this.getView().byId('smartFormColumn1').setVisible(false)
          this.getView().byId('_IDGenFeedInput1').setVisible(false)
          this.getView().byId('idVerticalLayoutSanction').setVisible(false)
          this.getView().byId('idVerticalLayoutOwnership').setVisible(false)
          this.getView().byId('_IDGenList1').setVisible(false)
          this.getView().byId('smartFormColumn2').setVisible(true)
          this.getView().byId('_IDGenFeedInput2').setVisible(true)
          this.getView().byId('_IDGenList2').setVisible(true)
          this.getView().byId('_IDGenList3').setVisible(true)
          this.getView().byId('sanctionTabVerticalID').setVisible(false)
        } else {
          sap.m.MessageToast.show('Data Still Loading Please wait...')
          var oIconTabBar = this.getView().byId('idIconTabBar')
          oIconTabBar.setSelectedKey('Match')
        }
      } else {
        sap.m.MessageToast.show('Data Still Loading Please wait...')
        oIconTabBar = this.getView().byId('idIconTabBar')
        oIconTabBar.setSelectedKey('Match')
      }
    }
  },

  titleClickedOwnerShip: function () {
    var oModel3 = new sap.ui.model.json.JSONModel()
    this.onLLM(
      null,
      false,
      this.getOwnerComponent()._companyOwnerShipDataString,
      'With above Data, Show me Ownership Summary?',
      false,
      'pf6',
      oModel3,
      true
    )   
  },
  titleClickedSanction: function () { 
    var oModel2 = new sap.ui.model.json.JSONModel()
    this.onLLM(
      null,
      false,
      this.getOwnerComponent()._companyOwnerShipDataString,
      'With above data tell me about the sanction in summary format(points) highlighting the important notes?',
      false,
      'pf5',
      oModel2,
      true
    )
  },

  onLLM: function (
    oEvent,
    saveToModel,
    sData,
    sQuestion,
    sDisplayText,
    sBindingModel,
    sModel,
    sBusy,
    array
  ) {
    var oDisplay = []
    var oFeedDisplay = { FeedInput: [] }
    var aDisplay = {}
    var aDisplayText = {}
    var that = this

    // inorder to get the token Length
    if (sData) {
      if (sData.length > 12000) {
        sData = sData.substring(0, 12000)
      }
    }

    if (!this.getOwnerComponent()._number) {
      this.getOwnerComponent()._number = '1'
    }

    var keyVal = this.getView().getModel('pf8').getData()
    for (var i = 0; i < keyVal.length; i++) {
      if (keyVal[i].ApiName === 'OPENAI') {
        var API_KEY = keyVal[i].KeyDecryptValue
        break
      }
    }
    if (!API_KEY) {
      sap.m.MessageToast.show('Please Maintain API Key')
      return
    }
    if (!sData) {
      if (!this.getOwnerComponent()._companyOwnerShipDataString) {
        var sValue = 'With the Above Data,' + oEvent.getParameter('value')
        sDisplayText = true
        sBusy = true
      } else {
        if (
          this.getOwnerComponent()._companyOwnerShipDataString.length > 12000
        ) {
          this.getOwnerComponent()._companyOwnerShipDataString =
            this.getOwnerComponent()._companyOwnerShipDataString.substring(
              0,
              12000
            )
          this.getOwnerComponent()._companyOwnerShipDataString =
            this.getOwnerComponent()._companyOwnerShipDataString + ".' "
        }
        sValue =
          this.getOwnerComponent()._companyOwnerShipDataString +
          '. ' +
          oEvent.getParameter('value')
        sDisplayText = true
        sBusy = true
      }
    } else {
      sValue = sData + '. ' + sQuestion
    }

    if (!saveToModel) {
      if (this.getView().getModel('pf7')) {
        var oCommentModel = this.getView().getModel('pf7').getData()
        if (oCommentModel) {
          if (oEvent && !this.getOwnerComponent()._companyOwnerShipDataString) {
            var array = oCommentModel.FeedInput.length - 1
            sValue = oCommentModel.FeedInput[array].text + '.' + sValue
          }
          for (var i = 0; i < oCommentModel.FeedInput.length; i++) {
            oFeedDisplay.FeedInput.push(oCommentModel.FeedInput[i])
          }
        }
      }
    }
    var messages = [
      {
        content: sValue,
        role: 'user'
      }
    ]
    if (!sData) {
      aDisplay.text = oEvent.getParameter('value')
      aDisplay.sender = this.getOwnerComponent()._UserName
      this.getOwnerComponent()._number = this.getOwnerComponent()._number + 1
      aDisplay.Number = this.getOwnerComponent()._number
      oFeedDisplay.FeedInput.push(aDisplay)
    }
    this.oBusy = new sap.m.BusyDialog()
    var oView = this.getView()
    if (sBusy) {
      this.oBusy.open()
    }

    var endpoint = this.getOwnerComponent()._openAIURL
    // Define the request data
    var requestData = {
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
      frequency_penalty: 0,
      presence_penalty: 0,
      top_p: 0.95,
      stop: null
    }

     // BOC - Counter - TARA
     if (sDisplayText) {
      var oData = this.getView().getModel('pf1').getData();
      const finalJSON = {
        Alert: oData.AlertID,
        MoodyOpenSearch: 1
      };
      this._updateCounter(finalJSON);
    }
    // EOC - Counter - TARA

    // Make the AJAX request
    $.ajax({
      url: endpoint,
      type: 'POST',
      contentType: 'application/json',
      headers: {
        'api-key': API_KEY
      },
      data: JSON.stringify(requestData),
      success: function (data) {
        that.oBusy.close()
        if (sDisplayText) {
          aDisplayText.text = data.choices[0].message.content
          aDisplayText.sender = "BIS Copilot (Moody's)"
          that.getOwnerComponent()._number =
            that.getOwnerComponent()._number + 1
          aDisplayText.Number = that.getOwnerComponent()._number
          aDisplayText.icon =
            'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Microsoft_365_Copilot_Icon.svg/1024px-Microsoft_365_Copilot_Icon.svg.png'
          oFeedDisplay.FeedInput.push(aDisplayText)
          var oModel = new sap.ui.model.json.JSONModel()
          oFeedDisplay.FeedInput.sort(function (a, b) {
            return b.Number - a.Number
          })
          oModel.setData(oFeedDisplay)
          oView.setModel(oModel, 'pf7')
        } else {
          if (!array) {
            var aData1 = {
              Sanction: data.choices[0].message.content
            }
            sModel.setData(aData1)
            oView.setModel(sModel, sBindingModel)
          } else {
            oFeedDisplay = { FeedInput: [] }
            aDisplayText.text = data.choices[0].message.content
            aDisplayText.sender = 'Bot'
            oFeedDisplay.FeedInput.push(aDisplayText)
            sModel.setData(oFeedDisplay)
            oView.setModel(sModel, sBindingModel)
          }
        }
      },
      error: function (xhr, status, error) {
        that.oBusy.close()
        console.error(xhr.responseText)
        sap.m.MessageToast.show(xhr.responseText)
      }
    })

    // fetch(`https://api.openai.com/v1/chat/completions`, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${API_KEY}`
    //     },
    //     body: JSON.stringify({
    //         messages,
    //         max_tokens: 500,
    //         model: "gpt-3.5-turbo"
    //     })
    // }).then(response => response.json())
    //     .then(data => {

    //         that.oBusy.close();
    //         if (data.error) {
    //             sap.m.MessageToast.show(data.error.message);
    //             return;
    //         }
    //         if (sDisplayText) {
    //             aDisplayText.text = data.choices[0].message.content;
    //             aDisplayText.sender = "Co-Pilot"
    //             that.getOwnerComponent()._number = that.getOwnerComponent()._number + 1;
    //             aDisplayText.Number = that.getOwnerComponent()._number;
    //             aDisplayText.icon = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Microsoft_365_Copilot_Icon.svg/1024px-Microsoft_365_Copilot_Icon.svg.png";
    //             oFeedDisplay.FeedInput.push(aDisplayText);
    //             var oModel = new sap.ui.model.json.JSONModel();
    //             oFeedDisplay.FeedInput.sort(function (a, b) {
    //                 return b.Number - a.Number;
    //             });
    //             oModel.setData(oFeedDisplay);
    //             oView.setModel(oModel, "pf7");
    //         } else {
    //             // var oModel1 = new sap.ui.model.json.JSONModel();
    //             if (data.error) {
    //                 sap.m.MessageToast.show(data.error.message);
    //                 return;
    //             }
    //             if (!array) {
    //                 var aData1 = {
    //                     "Sanction": data.choices[0].message.content,
    //                 }
    //                 sModel.setData(aData1);
    //                 oView.setModel(sModel, sBindingModel);

    //             } else {
    //                 oFeedDisplay = { FeedInput: [] };
    //                 aDisplayText.text = data.choices[0].message.content;
    //                 aDisplayText.sender = "Bot"
    //                 oFeedDisplay.FeedInput.push(aDisplayText);
    //                 sModel.setData(oFeedDisplay);
    //                 oView.setModel(sModel, sBindingModel);
    //             }

    //         }
    //     });
  },

  onBingSearch: function (oEvent) {
  // BOC - Counter - TARA
  var oData = this.getView().getModel('pf1').getData();
  const finalJSON = {
    Alert: oData.AlertID,
    CopilotOpenSearch: 1
  };
  this._updateCounter(finalJSON);
  // EOC - Counter - TARA

    var sValue = oEvent.getParameter('value')
    var that = this
    var oDisplay = []
    var oFeedDisplay = { FeedInput: [] }
    var aDisplay = {}
    var aDisplayText = {}
    var updResponse = {}
    var that = this
    var oView = this.getView()
    var bingURL = this.getOwnerComponent()._bingURL
    if (!this.getOwnerComponent()._bingNumber) {
      this.getOwnerComponent()._bingNumber = '1'
    } else {
      this.getOwnerComponent()._bingNumber =
        this.getOwnerComponent()._bingNumber + 1
    }
    aDisplay.Number = this.getOwnerComponent()._bingNumber
    oFeedDisplay.FeedInput.push(aDisplay)
    oBusy = new sap.m.BusyDialog()
    oBusy.open()
    aDisplay.text = sValue
    aDisplay.sender = this.getOwnerComponent()._UserName

    oCommentModel = this.getView().getModel('pf14')
    if (oCommentModel) {
      if (oCommentModel.getData()) {
        for (var i = 0; i < oCommentModel.getData().FeedInput.length; i++) {
          oFeedDisplay.FeedInput.push(oCommentModel.getData().FeedInput[i])
        }
      }
    }

    this.getOwnerComponent()._guid = this.generateGUID()
    this.getOwnerComponent()._guid1 = this.generateGUID()
    $.ajax({
      url: 'https://www.bingapis.com/api/v1/chat/create',
      type: 'GET',
      data: {
        appid: this.getOwnerComponent()._bingAPI,
        pid: this.getOwnerComponent()._guid
      },
      success: function (response) {
        console.log(response)
        that.getOwnerComponent()._response = response
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(bingURL, {
            skipNegotiation: true,
            transport: 1,
            withCredentials: false
          })
          .withAutomaticReconnect()
          .build()
        const initialMessage = {
          // source: "BingApiTest",
          // allowedMessageTypes: DEFAULT_ALLOWED_MESSAGE_TYPES,
          source: 'BingApiProd',
          isStartOfSession: true,
          requestId: that.getOwnerComponent()._guid,
          conversationSignature:
            that.getOwnerComponent()._response.conversationSignature,
          conversationId: that.getOwnerComponent()._response.conversationId,
          participant: { id: that.getOwnerComponent()._response.participantId },
          message: {
            text: sValue,
            author: 'user',
            inputMethod: 'Keyboard',
            requestId: that.getOwnerComponent()._guid,
            messageId: that.getOwnerComponent()._guid1,
            market: 'en-US',
            MessageType: 'Chat'
          },
          optionSets: ['stream_writes', 'flux_prompt_v1']
        }
        connection.on('Update', response => {
          if (response.messages?.length) {
            // console.log("Upd message:", response.messages[0]);
            aDisplayText.text = response.messages[0].text
            updResponse = response
          }
        })
        connection.on('send', initialMessage => {
          console.log(initialMessage)
        })

        connection.start().then(function () {
          console.log('Connected!')
          connection.stream('Chat', initialMessage).subscribe({
            complete: () => {
              connection.stop()
              oBusy.close()
            },
            next: function (response) {
              that.getOwnerComponent()._bingNumber =
                that.getOwnerComponent()._bingNumber + 1
              aDisplayText.text =
                updResponse.messages[0].adaptiveCards[0].body[0].text
              aDisplayText.text = aDisplayText.text.replace(/\[\^\d+\^\]/g, '')
              aDisplayText.sender = 'BIS Copilot (Open Media)'
              aDisplayText.text = aDisplayText.text.replace(
                /\*\*(.*?)\*\*/gm,
                '<strong>$1</strong>'
              )
              const urls = aDisplayText.text.match(
                /\[(\d+)\]: (https?:\/\/\S+)/g
              )
              const urlMap = {}
              if (urls) {
                urls.forEach(url => {
                  const [ref, href] = url.split(': ')
                  const index = ref.match(/\[(\d+)\]/)[1]
                  urlMap[index] = href.replace(/"/g, '')
                })
              }
              function replacePlaceholdersWithLinks (text, links) {
                return text.replace(/\[(\d+)\]/g, function (match, p1) {
                  var url = links[p1]
                  return url
                    ? `<a href="${url}" target="_blank">${match}</a>`
                    : match
                })
              }
              // var cleanedString = aDisplayText.text.replace(/\[.*\]: https:\/\/[^\s]+ ""/g, "").trim();
              var finalString = replacePlaceholdersWithLinks(
                aDisplayText.text,
                urlMap
              )
              aDisplayText.text = finalString
              aDisplayText.Number = that.getOwnerComponent()._bingNumber
              aDisplayText.icon =
                'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Microsoft_365_Copilot_Icon.svg/1024px-Microsoft_365_Copilot_Icon.svg.png'
              oFeedDisplay.FeedInput.push(aDisplayText)
              var oBingJSONModel = new sap.ui.model.json.JSONModel()
              oFeedDisplay.FeedInput.sort(function (a, b) {
                return b.Number - a.Number
              })
              oBingJSONModel.setData(oFeedDisplay)
              oView.setModel(oBingJSONModel, 'pf14')
            },
            error: err => {
              oBusy.close()
              console.error('Error:', err)
            }
          })
        })
      },
      error: function (error) {
        oBusy.close()
        console.error('Error:', error)
      }
    })
  },

  onIndustryClassfication: function () {
    if (!this.objDialog) {
      this.objDialog = sap.ui.xmlfragment(
        'copilot.fragmentViews.legalIndustrial',
        this
      )
      this.getView().addDependent(this.objDialog)
    }
    if (this.getView().getModel('pf10')) {
      this.objDialog.open()
    } else {
      sap.m.MessageToast.show('Please wait, data is loading')
    }
  },

  closeDialog: function () {
    this.objDialog.close()
  },

  //Formatter

  _getRowHighlightForSanction: function (oData) {
    if (oData) {
      if (
        oData.CSH_Sanction !== 'No Sanction Found' ||
        oData.CSH_DirectAndDate !== 'No Sanction Found'
      ) {
        return 'Error'
      } else {
        return 'Success'
      }
    }
  },
  get getRowHighlightForSanction () {
    return this._getRowHighlightForSanction
  },
  set getRowHighlightForSanction (value) {
    this._getRowHighlightForSanction = value
  },

  getTextColorForDirectSanctions: function (sValue) {
    return sValue !== 'No Sanction Found' ? 'red' : 'green' // predefined highlight state for red
  },

  getHighlightState: function (sPercentage) {
    var percentage = parseFloat(sPercentage)
    if (percentage >= 0 && percentage <= 50) {
      return 'Warning' // predefined highlight state for red
    } else if (percentage > 50) {
      return 'Error' // predefined highlight state for green
    } else {
      return 'None' // no highlight
    }
  },
  formatDate: function (sDate) {
    // Implement date formatting logic if needed
    return sDate ? new Date(sDate).toLocaleDateString() : ''
  },

  getNumberValueForPercentage: function (sPercentage) {
    sPercentage = parseFloat(sPercentage).toFixed(2)
    return sPercentage
  },

  /*
   * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
   * (NOT before the first rendering! onInit() is used for that one!).
   * @memberOf alertinfo.Alert_Info
   */
  onBeforeRendering: function () {
    if (!this.getOwnerComponent()._accessToken) {
      this.oBusy = new sap.m.BusyDialog()
      var that = this

      var keyVal = this.getView().getModel('pf8').getData()
      for (var i = 0; i < keyVal.length; i++) {
        switch (keyVal[i].ApiName) {
          case 'MODDYS':
            var moodys = keyVal[i].KeyDecryptValue
            var moodysUsername = keyVal[i].Username
            break
          case 'SANCTION360':
            this.getOwnerComponent()._sanctionTokenAPI =
              keyVal[i].KeyDecryptValue
            this.getOwnerComponent()._sactionURL = keyVal[i].ApiUrl
            break
          case 'BINGAPI':
            this.getOwnerComponent()._bingAPI = keyVal[i].KeyDecryptValue
            this.getOwnerComponent()._bingURL = keyVal[i].ApiUrl
            break
          case 'OPENAI':
            this.getOwnerComponent()._openAI = keyVal[i].KeyDecryptValue
            this.getOwnerComponent()._openAIURL = keyVal[i].ApiUrl
            break
        }
      }
      if (!this.getOwnerComponent()._sanctionTokenAPI) {
        sap.m.MessageToast.show('Please check the API Key for Sanction360')
        return
      }
      if (!moodys) {
        sap.m.MessageToast.show("Please check the API Key for Moody's")
        return
      }
      var password = moodys
      // Define your authentication endpoint and credentials
      var tokenEndpoint =
        'https://token.hub.moodysanalytics.com/prod/auth/token'
      // var username = "vibhorarora@microsoft.com";
      var username = moodysUsername

      // Create a base64-encoded string of the credentials (username:password)
      var base64Credentials = btoa(username + ':' + password)

      // Prepare the request headers
      var headers = {
        Authorization: 'Basic ' + base64Credentials,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
      // Prepare the data to send to the token endpoint
      var data = 'grant_type=client_credentials'
      this.oBusy.open()
      // // Send a POST request to the token endpoint with basic authentication
      jQuery.ajax({
        url: tokenEndpoint,
        method: 'POST',
        headers: headers,
        data: data,
        success: function (response) {
          // The response should contain the access token
          that.oBusy.close()
          var accessToken = response.access_token
          that.getOwnerComponent()._accessToken = accessToken
        },
        error: function (error) {
          that.oBusy.close()
          console.error('Error:', error)
        }
      })
    }
  },
  // Remove Null from the JSON
  removeNull: function (obj) {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (obj[key] === null) {
          delete obj[key]
        } else if (typeof obj[key] === 'object') {
          this.removeNull(obj[key])
          if (Object.keys(obj[key]).length === 0) {
            delete obj[key]
          }
        }
      })
    }
  },

  /**
   * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
   * This hook is the same one that SAPUI5 controls get after being rendered.
   * @memberOf alertinfo.Alert_Info
   */
  onAfterRendering: function () {},

  // BOC - Feedback/counter - TAPERI

  onFeedback: function () {

    if (!this.oFeedbackDialog) {
        this.oFeedbackDialog = new sap.ui.xmlfragment('copilot.fragmentViews.feedback', this);
        this.getView().addDependent(this.oFeedbackDialog);
        this._initJSONModel();
    }
    this.oFeedbackDialog.open();
  },

  _initJSONModel: function () {
    this._oJSONModel = new sap.ui.model.json.JSONModel({
      MoodyDI: false,
      BingChatDI: false,
      MoodyBingChatDI: false,
      TechIssue: false,
      DataNotUseful: true,
      IncorrectData: false
    })
    this.oView.setModel(this._oJSONModel, 'feedbackDialogModel')
  },

  onTechIssueSelect: function (oEvent) {  
    var oView = this.getView().getModel('feedbackDialogModel');
    var bSelected = oEvent.getSource().getSelected();
    oView.setProperty('/TechIssue', bSelected);
  },

  onCloseFeedback: function () {
    this.oFeedbackDialog.close()
    var oData = this.getView().getModel('feedbackDialogModel').getData()
    oData.MoodyDI = false
    oData.BingChatDI = false
    oData.MoodyBingChatDI = false
    oData.TechIssue = false
    oData.DataNotUseful = true
    oData.IncorrectData = false
    this.getView().getModel('feedbackDialogModel').setData(oData)
  },

  onSaveFeedback: function () {
    
    this.oFeedbackDialog.close();

    var oData = this.getView().getModel('pf1').getData();
    var oFeedBackData = this.getView().getModel('feedbackDialogModel').getData();

    var that = this;

    // Checking TechIssue selected or not to avoid passing default radio button value to backend
    if (oFeedBackData.TechIssue === true) {
      var IncorrectData = oFeedBackData.IncorrectData ? 'YES' : 'NO';
      var DataNotUseful= oFeedBackData.DataNotUseful ? 'YES' : 'NO';
    } else {
      var IncorrectData = 'NO';
      var DataNotUseful= 'NO';
    };

    // Creting final Json
    const finalJSON = {
      Alert: oData.AlertID,
      MoodyDi: oFeedBackData.MoodyDI ? 'YES' : 'NO',
      BingDi: oFeedBackData.BingChatDI ? 'YES' : 'NO',
      MoodyBingDi: oFeedBackData.MoodyBingChatDI ? 'YES' : 'NO',
      DataNotUseful: DataNotUseful,
      IncorrectData: IncorrectData
    };

    // Call the OData service to submit the data
    var strURL = '/sap/opu/odata/sap/ZBIS_COPILOT_SRV/'; //Set up base call URL

    var objModel = new sap.ui.model.odata.v2.ODataModel(strURL, {
      json: true,
      useBatch: false
    });

    objModel.create('/FeedBackSet', finalJSON, {
      success: function (data) {
        // Handle the success response
        sap.m.MessageToast.show('Feedback Submitted Successfully')
        var oFeedbackModel = that.getView().getModel('feedbackModel'); // To enable/diable buttom
        var oFeedback = oFeedbackModel.getData();
        oFeedback.enableFeedback = false;
        // Refresh the model to reflect the changes
        oFeedbackModel.refresh(true);
      },
      error: function (error) {
        // Handle the error response
        sap.m.MessageToast.show('Error in submitting the feedback, Please try again');
      }
    })
    // Clear feedback popup model
    oFeedBackData.MoodyDI = false
    oFeedBackData.BingChatDI = false
    oFeedBackData.MoodyBingChatDI = false
    oFeedBackData.TechIssue = false
    oFeedBackData.DataNotUseful = true
    oFeedBackData.IncorrectData = false
    this.getView().getModel('feedbackDialogModel').setData(oData)
  },
  _updateCounter: function (finalJSON) {
    // Call the OData service to submit the data
    var strURL = '/sap/opu/odata/sap/ZBIS_COPILOT_SRV/' //Set up base call URL

    var objModel = new sap.ui.model.odata.v2.ODataModel(strURL, {
      json: true,
      useBatch: false
    })

    objModel.create('/CounterSet', finalJSON, {
      success: function (data) {
        // Handle the success response
        console.log(data);
      },
      error: function (error) {
        // Handle the error response
        console.log(error);
      }
    })
  }
  // EOC - Feedback/counter - TAPERI
})
