sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/m/MessageBox", "sap/m/MessageToast"],
  (Controller, MessageBox, MessageToast) => {
    "use strict";

    return Controller.extend("hupackingfiori.controller.CreateHandlingUnit", {
      onInit() {
        let oRouter = this.getOwnerComponent().getRouter();
        oRouter
          .getRoute("RouteCreateHandlingUnit")
          .attachPatternMatched(this._onRouteMatched, this);
      },

      _onRouteMatched(oEvent) {
        let sDeliveryNumber = decodeURIComponent(
          oEvent.getParameter("arguments").deliveryNumber,
        );

        this._sDeliveryNumber = sDeliveryNumber;

        // Reset the form on every entry into this screen
        let oDescInput = this.byId("inputHUDescription");
        if (oDescInput) {
          oDescInput.setValue("");
          oDescInput.setValueState("None");
          setTimeout(() => oDescInput.focus(), 300);
        }
      },

      onBack() {
        this.getOwnerComponent()
          .getRouter()
          .navTo("RouteHandlingUnits", {
            deliveryNumber: encodeURIComponent(this._sDeliveryNumber),
          });
      },

      onCreate() {
        let oDescInput = this.byId("inputHUDescription");
        let sHUDescription = (oDescInput.getValue() || "").trim();

        if (!sHUDescription) {
          oDescInput.setValueState("Error");
          oDescInput.setValueStateText("HU Description is required");
          return;
        }
        oDescInput.setValueState("None");

        let sPackagingMaterial = this.byId("inputPackagingMaterial").getValue();
        let sDeliveryNumber = this._sDeliveryNumber;

        let oODataModel = this.getOwnerComponent().getModel();

        this.byId("createHUPage").setBusy(true);

        oODataModel.create(
          "/zc_handling_units",
          {
            PackagingMaterial: sPackagingMaterial,
            HandlingUnitDescription: sHUDescription,
            HUObject: sDeliveryNumber,
          },
          {
            success: () => {
              this.byId("createHUPage").setBusy(false);
              MessageToast.show("Handling Unit created successfully.");
              this.onBack();
            },
            error: (oError) => {
              this.byId("createHUPage").setBusy(false);
              let sMsg = "Failed to create Handling Unit";
              try {
                let oResponse = JSON.parse(oError.responseText);
                sMsg = oResponse.error?.message?.value || sMsg;
              } catch (_) {
                /* keep default */
              }
              MessageBox.error(sMsg);
            },
          },
        );

        oODataModel.submitChanges();
      },
    });
  },
);
