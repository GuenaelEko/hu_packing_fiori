sap.ui.define(["sap/ui/core/mvc/Controller"], (Controller) => {
  "use strict";

  return Controller.extend("hupackingfiori.controller.HandlingUnits", {
    onInit() {
      let oRouter = this.getOwnerComponent().getRouter();
      oRouter
        .getRoute("RouteHandlingUnits")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched(oEvent) {
      let sDeliveryNumber = decodeURIComponent(
        oEvent.getParameter("arguments").deliveryNumber,
      );

      let oView = this.getView();

      // OData V2: bind the view to the specific Delivery entity,
      // expanding its HandlingUnit navigation property
      oView.bindElement({
        path: "/zc_outbound_delivery('" + sDeliveryNumber + "')",
        parameters: {
          expand: "to_HandlingUnit",
        },
      });

      let oList = this.byId("huList");
      if (oList) {
        oList.scrollToIndex(0);
      }
    },

    onBack() {
      this.getOwnerComponent().getRouter().navTo("RouteHome");
    },
  });
});
