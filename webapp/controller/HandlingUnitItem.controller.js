sap.ui.define(["sap/ui/core/mvc/Controller"], (Controller) => {
  "use strict";

  return Controller.extend("hupackingfiori.controller.HandlingUnitItems", {
    onInit() {
      let oRouter = this.getOwnerComponent().getRouter();
      oRouter
        .getRoute("RouteHandlingUnitItems")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched(oEvent) {
      let oArgs = oEvent.getParameter("arguments");
      let sHandlingUnitNumber = decodeURIComponent(oArgs.handlingUnitNumber);

      let oView = this.getView();

      // OData V2: bind the view to the specific Handling Unit entity,
      // expanding its item navigation property
      oView.bindElement({
        path: "/zc_handling_units('" + sHandlingUnitNumber + "')",
        parameters: {
          expand: "to_Item",
        },
      });

      let oList = this.byId("huItemsList");
      if (oList) {
        oList.scrollToIndex(0);
      }
    },

    onBack() {
      // Go back to the HU list, preserving the delivery number from the model
      let oAppModel = this.getOwnerComponent().getModel("appModel");
      let sDeliveryNumber = oAppModel.getProperty("/deliveryNumber");

      this.getOwnerComponent()
        .getRouter()
        .navTo("RouteHandlingUnits", {
          deliveryNumber: encodeURIComponent(sDeliveryNumber),
        });
    },
  });
});
