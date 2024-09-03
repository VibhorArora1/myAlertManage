sap.ui.define(
  [
    'sap/ui/core/UIComponent',
    'sap/ui/model/resource/ResourceModel',
    'sap/ui/model/odata/v2/ODataModel',
    'copilot/libs/signalr'
  ],
  function (UIComponent, ResourceModel, ODataModel, signalr) {
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
        sap.ui.getCore().loadLibrary('sap.ui.commons')
        sap.ui.getCore().loadLibrary('sap.ui.table')
        this.oView = sap.ui.view({
          viewName: 'copilot.copilot',
          type: sap.ui.core.mvc.ViewType.XML
        })

        return this.oView
      },

      setAlertDBKey: function (sAlertDBKey) {
        if (sAlertDBKey !== this.getProperty('AlertDBKey')) {
          this.setProperty('AlertDBKey', sAlertDBKey)
          var strRequestURLBase = '/sap/opu/odata/sap/ZBIS_C_ALERTBP_CDS/' //Set up base call URL
          var strServicePath = "/ZBIS_C_ALERTBP(guid'" + sAlertDBKey + "')" //Set up dynamic part with AlertID

          //Create the default Model object oData Service.
          var objDefaultModel = new ODataModel(strRequestURLBase, {
            json: true,
            useBatch: false
          })

          var strURLEncryption = '/sap/opu/odata/sap/ZBIS_COPILOT_SRV/' //Set up base call URL
          var strServicePathEncryption = '/ZBIS_C_FETCH_API_KEY' //Set up dynamic part with AlertID
          var strServicePathParamVal = '/ZBIS_C_FETCH_PARAM_VALUE' //Get the value of Param Table

          var objDefaultEncryption = new ODataModel(strURLEncryption, {
            json: true,
            useBatch: false
          })

          var objDefaultModelParamValue = new ODataModel(strURLEncryption, {
            json: true,
            useBatch: false
          })
          var view = this.oView
          this.oBusy = new sap.m.BusyDialog()
          var that = this
          this.cleanSlate(view)
          this.oBusy.open()
          var oBusyTable = view.byId('smartTable')
          oBusyTable.setBusy(true)

          objDefaultEncryption.read(strServicePathEncryption, {
            success: function (encryptionData) {
              //Instantiate a JSON model with return data from oData Service. We will bind this as default model.
              var oJSONModelEncryption = new sap.ui.model.json.JSONModel(
                encryptionData.results
              )
              //Set the view model.
              view.setModel(oJSONModelEncryption, 'pf8')

              view.byId('smartTable').setVisible(true)
              view.byId('smartFormColumn').setVisible(false)
              view.byId('OwnershipTableId').setVisible(false)
              view.byId('smartFormColumn1').setVisible(false)
              view.byId('_IDGenFeedInput1').setVisible(false)
              view.byId('_IDGenList1').setVisible(false)
              view.byId('smartFormColumn2').setVisible(false)
              view.byId('_IDGenFeedInput2').setVisible(false)
              view.byId('idVerticalLayoutSanction').setVisible(false)
              view.byId('idVerticalLayoutOwnership').setVisible(false)
              view.byId('_IDGenList1').setVisible(false)
              view.byId('_IDGenFeedInput2').setVisible(false)
              view.byId('_IDGenList2').setVisible(false)
              view.byId('_IDGenList3').setVisible(false)
              view.byId('sanctionTabVerticalID').setVisible(false)
              view.byId('smartFormSearch').setVisible(false)
              view.byId('idVerticalLayoutBingSearch').setVisible(false)
              var oIconTabBar = view.byId('idIconTabBar')
              if (oIconTabBar) {
                oIconTabBar.removeItem(oIconTabBar.getItems()[3])
                oIconTabBar.removeItem(oIconTabBar.getItems()[3])
                oIconTabBar.setSelectedKey('Match')
              }
              //Grab an instance of the view, and set data retrieved to its default model.

              objDefaultModel.read(strServicePath, {
                urlParameters: {
                  $expand:
                    'to_AlertOrgAddressV2,to_AlertPersonAddressV2,to_BPOtherInfoV2'
                },
                success: function (data) {
                  //Instantiate a JSON model with return data from oData Service. We will bind this as default model.
                  var dataModel = new sap.ui.model.json.JSONModel(data)

                  var keyVal = view.getModel('pf8').getData()
                  for (var i = 0; i < keyVal.length; i++) {
                    if (keyVal[i].ApiName === 'MODDYS') {
                      var moodys = keyVal[i].KeyDecryptValue
                      var moodysUsername = keyVal[i].Username
                      that.oBusy.close()
                    }
                    if (keyVal[i].ApiName === 'BINGAPI') {
                      var bing = keyVal[i].KeyDecryptValue
                      var bingURL = keyVal[i].ApiUrl
                      that.oBusy.close()
                    }
                  }
                  if (!moodys) {
                    oBusyTable.setBusy(false)
                    that.oBusy.close()
                    sap.m.MessageToast.show(
                      "Please check the API Key for Moody's"
                    )
                    return
                  }

                  if (!bing) {
                    oBusyTable.setBusy(false)
                    that.oBusy.close()
                    sap.m.MessageToast.show('Please check the API Key for Bing')
                    return
                  }
                  var tokenEndpoint =
                    'https://token.hub.moodysanalytics.com/prod/auth/token'
                  // var username = "vibhorarora@microsoft.com";
                  var username = moodysUsername
                  var password = moodys

                  // Create a base64-encoded string of the credentials (username:password)
                  var base64Credentials = btoa(username + ':' + password)

                  // Prepare the request headers
                  var headers = {
                    Authorization: 'Basic ' + base64Credentials,
                    'Content-Type': 'application/x-www-form-urlencoded'
                  }

                  // Prepare the data to send to the token endpoint
                  var dataCrednetials = 'grant_type=client_credentials'
                  // Send a POST request to the token endpoint with basic authentication
                  jQuery.ajax({
                    url: tokenEndpoint,
                    method: 'POST',
                    headers: headers,
                    data: dataCrednetials,
                    success: function (response) {
                      // The response should contain the access token
                      var accessToken = response.access_token
                      // that.getOwnerComponent()._accessToken = accessToken;
                      var url =
                        'https://api.bvdinfo.com/v1/orbis/companies/match'
                      var aTitleValue = {}
                      var oModel4 = new sap.ui.model.json.JSONModel()
                      // BOC - ADO CR 12449751
                      // Sort the data based on the RequestID and CustomerType
                      data.to_AlertOrgAddressV2.results.sort(function (a, b) {
                        if (a.RequestID < b.RequestID) return -1
                        if (a.RequestID > b.RequestID) return 1
                        if (a.CustomerType < b.CustomerType) return -1
                        if (a.CustomerType > b.CustomerType) return 1
                        return 0
                      })
                      // EOC - ADO CR 12449751
                      for (
                        var i = 0;
                        i < data.to_AlertOrgAddressV2.results.length;
                        i++
                      ) {
                        if (
                          data.to_AlertOrgAddressV2.results[i]
                            .AlertItemNumber === 1
                        ) {
                          if (
                            data.to_AlertOrgAddressV2.results[i]
                              .CustomerType === 'ZC'
                          ) {
                            for (var j = i - 1; j >= 0; j--) {
                              if (
                                data.to_AlertOrgAddressV2.results[j]
                                  .CustomerType === 'ZB'
                              ) {
                                i = j
                                break
                              }
                            }
                          }
                          var oIndex = i
                          aTitleValue.CompanyName =
                            data.to_AlertOrgAddressV2.results[i].CompanyName
                          aTitleValue.Country =
                            data.to_AlertOrgAddressV2.results[i].Country
                          aTitleValue.Street =
                            data.to_AlertOrgAddressV2.results[i].Street
                          aTitleValue.City =
                            data.to_AlertOrgAddressV2.results[i].City
                          aTitleValue.PostalCode =
                            data.to_AlertOrgAddressV2.results[i].PostalCode
                          oModel4.setData(aTitleValue)
                          view.setModel(oModel4, 'pf9')
                          break
                        }
                        if (!oIndex) {
                          var oIndex = 0
                        }
                      }

                      objDefaultModelParamValue.read(strServicePathParamVal, {
                        success: function (paramDataValue) {
                          if (paramDataValue) {
                            var generatedValues = []
                            paramDataValue.results.forEach(function (item) {
                              var question = item.question
                              var display = true
                              question = question.replace(
                                /&(\d+)&/g,
                                function (match, capture) {
                                  var index = parseInt(capture) - 1
                                  var fields = item.odatafieldvalue.split(',')
                                  var parameterValue =
                                    item.parametervalue.split(',')
                                  if (
                                    parameterValue[index] === 'OtherInfoValue'
                                  ) {
                                    var otherinfotype =
                                      item.otherinfotype.split(',')
                                    for (
                                      var i = 0;
                                      i < data.to_BPOtherInfoV2.results.length;
                                      i++
                                    ) {
                                      if (
                                        data.to_BPOtherInfoV2.results[i]
                                          .OtherInfoType ===
                                        otherinfotype[index]
                                      ) {
                                        var fieldValue =
                                          data.to_BPOtherInfoV2.results[i]
                                            .OtherInfoValue
                                        return fieldValue ? fieldValue : ''
                                      }
                                    }
                                    if (!fieldValue) {
                                      display = false
                                    }
                                  } else {
                                    // Build the replacement value based on odatafieldvalue and parametervalue
                                    fieldValue = fields[index]
                                      ? data.to_AlertOrgAddressV2.results[
                                          oIndex
                                        ][parameterValue[index]]
                                      : ''
                                    return fieldValue ? fieldValue : ''
                                  }
                                }
                              )

                              // Add the modified question to the generatedValues array
                              if (display) {
                                generatedValues.push(question)
                              }
                            })
                            console.log(generatedValues)
                            that.bingSearch(
                              generatedValues,
                              bing,
                              that,
                              bingURL
                            )
                          }
                        }
                      })

                      var dataCompany = {
                        MATCH: {
                          Criteria: {
                            Name: data.to_AlertOrgAddressV2.results[oIndex]
                              .CompanyName,
                            Country:
                              data.to_AlertOrgAddressV2.results[oIndex].Country,
                            Address:
                              data.to_AlertOrgAddressV2.results[oIndex].Street,
                            City: data.to_AlertOrgAddressV2.results[oIndex].City
                          },
                          Options: {
                            ExclusionFlags: ['None'],
                            ScoreLimit: 0.8
                          }
                        },
                        SELECT: [
                          'Match.Hint',
                          'Match.Score',
                          'Match.Name',
                          'Match.Name_Local',
                          'Match.MatchedName',
                          'Match.MatchedName_Type',
                          'Match.Address',
                          'Match.Postcode',
                          'Match.City',
                          'Match.Country',
                          'Match.Address_Type',
                          'Match.PhoneOrFax',
                          'Match.EmailOrWebsite',
                          'Match.National_Id',
                          'Match.NationalIdLabel',
                          'Match.State',
                          'Match.Region',
                          'Match.LegalForm',
                          'Match.ConsolidationCode',
                          'Match.Status',
                          'Match.Ticker',
                          'Match.CustomRule',
                          'Match.Isin',
                          'Match.BvDId'
                        ]
                      }
                      const requestOptions = {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${accessToken}`
                        },
                        body: JSON.stringify(dataCompany)
                      }

                      var oJSONModel = new sap.ui.model.json.JSONModel()
                      fetch(url, requestOptions)
                        .then(response => response.json())
                        .then(dataMatch => {
                          // Handle the response data here

                          // that.cleanSlate(view);
                          if (dataMatch.length === 0) {
                            sap.m.MessageToast.show(
                              'No Data Found with CO-PILOT'
                            )
                            oBusyTable.setBusy(false)
                            that.oBusy.close()
                            return
                          }
                          oJSONModel.setData(dataMatch)
                          view.setModel(oJSONModel, 'pf2')
                          oBusyTable.setBusy(false)
                          that.oBusy.close()
                          // that.onLLM(null, false, JSON.stringify(data[0]), "Phrase the above data into English as per the company view", false, true);
                        })
                        .catch(error => {
                          oBusyTable.setBusy(false)
                          that.oBusy.close()
                          // Handle any errors that occurred during the fetch
                          console.error('Error:', error)
                        })
                      //Set the view model.
                      view.setModel(dataModel, 'pf1') //TAPERI
                      dataModel.refresh()
                    }
                  })
                  // BOC - Feedback button disable - TAPERI
                  var AlertID = data.AlertID;
                  var strURLFeedback = '/sap/opu/odata/sap/ZBIS_COPILOT_SRV/'; //Set up base call URL
                  var strFeedbackServPath = "/FeedBackSet(Alert='" + AlertID + "')";

                  const feedback = {
                    enableFeedback: true
                  };

                  var feedbackModel = new sap.ui.model.json.JSONModel(feedback);
                  view.setModel(feedbackModel, 'feedbackModel');

                  var objFeedbackDet = new ODataModel(strURLFeedback, {
                    json: true,
                    useBatch: false
                  });
                  objFeedbackDet.read(strFeedbackServPath, {
                    success: function (FeedbackData) {
                      var enableFeedback = FeedbackData.FeedbackUpd === 'X' ? false : true;
                      feedbackModel.setProperty(
                        '/enableFeedback',
                        enableFeedback
                      )
                    }
                  });
                  // EOC - Feedback button disable - TAPERI
                },
                error: function (jqXHR, textStatus, errorThrown) {
                  oBusyTable.setBusy(false)
                  console.error('Error:', errorThrown)
                }
              })
            },
            error: function (jqXHR, textStatus, errorThrown) {
              that.oBusy.close()
              oBusyTable.setBusy(false)
              console.error('Error:', errorThrown)
            }
          })
        }
        return this
      },
      init: function () {
        // call super init (will call function "create content")
        sap.ui.core.UIComponent.prototype.init.apply(this, arguments)

        var i18nModel = new ResourceModel({
          bundleName: 'copilot.i18n.i18n'
        })

        this.oView.setModel(i18nModel, 'i18n')

        var sCssPath = jQuery.sap.getModulePath('copilot/css')
        sCssPath = sCssPath + '/style.css'
        jQuery.sap.includeStyleSheet(sCssPath)
      },

      bingSearch: async function (generatedValues, pid, that, url) {
        var guid = that.generateGUID()
        var guid1 = that.generateGUID()
        var aResult = []
        var oResut = {}
        $.ajax({
          url: 'https://www.bingapis.com/api/v1/chat/create',
          type: 'GET',
          data: {
            appid: pid,
            pid: guid
          },
          success: async function (response) {
            that.iterationChatHub(
              generatedValues,
              that,
              response,
              guid,
              guid1,
              aResult,
              oResut,
              url
            )
          }
        })
      },

      iterationChatHub: async function (
        generatedValues,
        that,
        response,
        guid,
        guid1,
        aResult,
        oResut,
        url
      ) {
        var i = 0 // Initialize index variable
        var view = that.oView
        var Updresponse = {}
        var oFeedDisplay = { FeedInput: [] }
        var aDisplayText = {}
        var chatHubCallback = async function () {
          if (i < generatedValues.length) {
            const connection = new signalR.HubConnectionBuilder()
              .withUrl(url, {
                skipNegotiation: true,
                transport: 1,
                // Specify the allowed origin
                withCredentials: false
              })
              .withAutomaticReconnect()
              .build()
            await connection
              .start()
              .then(async function () {
                if (i === 0) {
                  var session = true
                } else {
                  session = false
                }
                var generatedValuesStr
                // var generatedValuesStr = JSON.stringify(generatedValues);
                for (var j = 0; j < generatedValues.length; j++) {
                  if (!generatedValuesStr) {
                    generatedValuesStr = generatedValues[j]
                  } else {
                    generatedValuesStr =
                      generatedValuesStr + ', ' + generatedValues[j]
                  }
                }
                const initialMessage = {
                  // source: "BingApiTest",
                  // allowedMessageTypes: DEFAULT_ALLOWED_MESSAGE_TYPES,
                  source: 'BingApiProd',
                  isStartOfSession: session,
                  requestId: guid,
                  conversationSignature: response.conversationSignature,
                  conversationId: response.conversationId,
                  participant: { id: response.participantId },
                  message: {
                    text:
                      generatedValuesStr +
                      ' Answer the above question in detail with phrasing them in order of question and answer? and Result should be english Language. In the end can you also provide the summary?',
                    author: 'user',
                    inputMethod: 'Keyboard',
                    requestId: guid,
                    messageId: guid1,
                    market: 'en-US',
                    MessageType: 'Chat'
                  },
                  optionSets: ['stream_writes', 'flux_prompt_v1']
                }

                connection.on('Update', response => {
                  if (response.messages?.length) {
                    // console.log("Upd message:", response.messages[0]);
                    // aDisplayText.text = response.messages[0].text
                    Updresponse = response
                  }
                })
                await connection.stream('Chat', initialMessage).subscribe({
                  complete: () => {
                    // connection.stop()

                    console.log('Stream completed')
                    that.connectionStop(connection)
                    // i++; // Increment the index variable
                    // chatHubCallback(); // Call the chatHubCallback for the next iteration
                  },
                  next: function (response) {
                    aDisplayText.text =
                      Updresponse.messages[0].adaptiveCards[0].body[0].text
                    aDisplayText.text = aDisplayText.text.replace(
                      /\*\*(.*?)\*\*/gm,
                      '<strong>$1</strong>'
                    )
                    // response.result.message = response.result.message.replace(/\*\*(.*?)\*\*/gm, "");
                    aDisplayText.text = aDisplayText.text.replace(
                      /\[\^\d+\^\]/g,
                      ''
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
                    aDisplayText.sender = 'Bot'
                    oFeedDisplay.FeedInput.push(aDisplayText)
                    var JSONoModelBing = new sap.ui.model.json.JSONModel(
                      oFeedDisplay
                    )
                    view.setModel(JSONoModelBing, 'pf12')
                    sap.m.MessageToast.show(
                      'Open Search Data Successfully Loaded'
                    )
                  },
                  error: err => {
                    console.error('Error:', err)
                  }
                })
              })
              .catch(function (err) {
                return console.error(err.toString())
              })
          }
        }
        chatHubCallback() // Call the chatHubCallback for the first iteration
      },

      connectionStop: async function (connection) {
        await connection.stop()
      },

      chatHub: async function (
        connection,
        generatedValues,
        guid,
        guid1,
        response,
        i,
        aResult,
        oResut
      ) {
        if (i === 0) {
          var session = true
        } else {
          session = false
        }

        const initialMessage = {
          source: 'BingApiProd',
          isStartOfSession: session,
          requestId: guid,
          conversationSignature: response.conversationSignature,
          conversationId: response.conversationId,
          participant: { id: response.participantId },
          message: {
            text:
              generatedValues +
              'Answer the above question in detail with phrasing them in order of question and answer?',
            author: 'user',
            inputMethod: 'Keyboard',
            requestId: guid,
            messageId: guid1,
            market: 'en-US',
            MessageType: 'Chat'
          },
          optionSets: ['stream_writes', 'flux_prompt_v1']
        }

        await connection.stream('Chat', initialMessage).subscribe({
          complete: () => {
            // connection.stop()
            console.log('Stream completed')
          },
          next: function (response) {
            console.log('Received message:', response)
            oResut.question = generatedValues
            oResut.answer = response.result.message
            return oResut
          },
          error: err => {
            console.error('Error:', err)
          }
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

      cleanSlate: function (view) {
        if (view.getModel('pf2')) {
          view.getModel('pf2').setData(null)
        }
        if (view.getModel('pf3')) {
          view.getModel('pf3').setData(null)
        }
        if (view.getModel('pf4')) {
          view.getModel('pf4').setData(null)
        }
        if (view.getModel('pf5')) {
          view.getModel('pf5').setData(null)
        }
        if (view.getModel('pf6')) {
          view.getModel('pf6').setData(null)
        }
        if (view.getModel('pf7')) {
          view.getModel('pf7').setData(null)
        }
        if (view.getModel('pf8')) {
          view.getModel('pf8').setData(null)
        }
        if (view.getModel('pf9')) {
          view.getModel('pf9').setData(null)
        }
        if (view.getModel('pf10')) {
          view.getModel('pf10').setData(null)
        }
        if (view.getModel('pf11')) {
          view.getModel('pf11').setData(null)
        }
        if (view.getModel('pf12')) {
          view.getModel('pf12').setData(null)
        }

        if (view.getModel('pf13')) {
          view.getModel('pf13').setData(null)
        }
        if (view.getModel('pf14')) {
          view.getModel('pf14').setData(null)
        }
      }
    })
  }
)
