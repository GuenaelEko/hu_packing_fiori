sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/m/MessageBox", "sap/m/MessageToast"],
  (Controller, MessageBox, MessageToast) => {
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

        this._sDeliveryNumber = sDeliveryNumber;

        //Reset selection state
        this.getOwnerComponent()
          .getModel("appModel")
          .setProperty("/hasSelection", false);

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
          oList.removeSelections(true);
          oList.scrollToIndex(0);
        }
      },

      onBack() {
        this.getOwnerComponent().getRouter().navTo("RouteHome");
      },

      // ----------------------------------------------------------------
      // SELECTION (single HU at a time)
      // ----------------------------------------------------------------
      onSelectionChange() {
        let oList = this.byId("huList");
        let bHasSelection = !!oList.getSelectedItem();
        this.getOwnerComponent()
          .getModel("appModel")
          .setProperty("/hasSelection", bHasSelection);
      },

      // ----------------------------------------------------------------
      // CREATE (navigates to a dedicated screen)
      // ----------------------------------------------------------------
      onCreateHU() {
        this.getOwnerComponent()
          .getRouter()
          .navTo("RouteCreateHandlingUnit", {
            deliveryNumber: encodeURIComponent(this._sDeliveryNumber),
          });
      },

      // ----------------------------------------------------------------
      // DELETE (single HU at a time)
      // ----------------------------------------------------------------
      onDeleteHU() {
        let oList = this.byId("huList");
        let oSelectedItem = oList.getSelectedItem();

        if (!oSelectedItem) {
          MessageToast.show("Please select a Handling Unit to delete.");
          return;
        }

        let oContext = oSelectedItem.getBindingContext();
        let sHUNumber = oContext.getProperty("HandlingUnitNumber");
        let sHUExternalId = oContext.getProperty("ExternalHandlingUnitID");

        MessageBox.confirm("Delete Handling Unit " + sHUExternalId + "?", {
          title: "Confirm Deletion",
          onClose: (sAction) => {
            if (sAction === MessageBox.Action.OK) {
              this._doDelete(sHUNumber);
            }
          },
        });
      },

      _doDelete(sHUNumber) {
        let oODataModel = this.getOwnerComponent().getModel();
        let sPath = "/zc_handling_units('" + sHUNumber + "')";

        oODataModel.remove(sPath, {
          success: () => {
            this._onDeleteComplete();
          },
          error: () => {
            MessageBox.error("Failed to delete the Handling Unit.");
          },
        });
      },

      _onDeleteComplete() {
        // Reset selection state
        this.byId("huList").removeSelections(true);
        this.getOwnerComponent()
          .getModel("appModel")
          .setProperty("/hasSelection", false);

        MessageToast.show("Handling Unit deleted successfully.");

        // Refresh the list
        this.getView().getElementBinding().refresh();
      },

      onHUPress(oEvent) {
        let oItem = oEvent.getSource();
        let oContext = oItem.getBindingContext();
        let sHandlingUnitNumber = oContext.getProperty("HandlingUnitNumber");

        this.getOwnerComponent()
          .getRouter()
          .navTo("RouteHandlingUnitItems", {
            deliveryNumber: this.getOwnerComponent()
              .getModel("appModel")
              .getProperty("/deliveryNumber"),
            handlingUnitNumber: encodeURIComponent(sHandlingUnitNumber),
          });
      },
    });
  },
);
