sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
  ],
  (Controller, MessageBox, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("hupackingfiori.controller.Home", {
      onInit() {
        let oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("RouteHome")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      _onRouteMatched() {
        let oInput = this.byId("deliveryInput");
        if (oInput) {
          setTimeout(function () {
            oInput.focus();
          }, 300);
        }
      },

      onClear() {
        let oModel = this.getOwnerComponent().getModel("appModel");
        oModel.setProperty("/deliveryNumber", "");

        let oInput = this.byId("deliveryInput");
        if (oInput) {
          oInput.setValueState("None");
          oInput.focus();
        }
      },

      onNext() {
        let oAppModel = this.getOwnerComponent().getModel("appModel");
        let sDeliveryNumber = (
          oAppModel.getProperty("/deliveryNumber") || ""
        ).trim();

        // Validate: field must not be empty
        if (!sDeliveryNumber) {
          let oInput = this.byId("deliveryInput");
          oInput.setValueState("Error");
          oInput.setValueStateText("Enter a delivery number");
          return;
        }
        this.byId("deliveryInput").setValueState("None");

        // SAP delivery numbers are zero-padded to 10 digits (VBELN)
        sDeliveryNumber = sDeliveryNumber.padStart(10, "0");

        // OData V2: verify the delivery exists via a read() call
        let oODataModel = this.getOwnerComponent().getModel();
        let oView = this.getView();

        oView.setBusy(true);

        oODataModel.read("/zc_outbound_delivery", {
          filters: [
            new Filter("DeliveryNumber", FilterOperator.EQ, sDeliveryNumber),
          ],
          success: (oData) => {
            oView.setBusy(false);

            let aResults = (oData && oData.results) || [];

            if (!aResults.length) {
              MessageBox.error(
                "No delivery found for number: " + sDeliveryNumber,
              );
              return;
            }

            oAppModel.setProperty("/deliveryNumber", sDeliveryNumber);

            this.getOwnerComponent()
              .getRouter()
              .navTo("RouteHandlingUnits", {
                deliveryNumber: encodeURIComponent(sDeliveryNumber),
              });
          },
          error: (oError) => {
            oView.setBusy(false);
            MessageBox.error(
              "Error while checking delivery: " + oError.message,
            );
          },
        });
      },
    });
  },
);
