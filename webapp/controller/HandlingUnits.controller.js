sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/VBox",
  ],
  (
    Controller,
    MessageBox,
    MessageToast,
    Dialog,
    Button,
    Label,
    Input,
    VBox,
  ) => {
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
      // CREATE
      // ----------------------------------------------------------------
      onCreateHU() {
        // Lazy-init dialog
        if (!this._oCreateDialog) {
          this._oCreateDialog = new Dialog({
            title: "Create Handling Unit",
            contentWidth: "400px",
            content: new VBox({
              renderType: "Bare",
              items: [
                new Label({ text: "Packaging Material", required: true }),
                new Input({
                  id: this.createId("inputPackagingMaterial"),
                  placeholder: "e.g. CARTON",
                  maxLength: 15,
                }),
                new Label({
                  text: "HU Description",
                }),
                new Input({
                  id: this.createId("inputHUDescription"),
                  placeholder: "e.g. Pallet for delivery 1234567890",
                  maxLength: 40,
                }),
              ],
            }),
            beginButton: new Button({
              text: "Create",
              type: "Emphasized",
              press: this._onCreateConfirm.bind(this),
            }),
            endButton: new Button({
              text: "Cancel",
              press: () => this._oCreateDialog.close(),
            }),
            afterClose: () => {
              // Reset input fields on close
              let oMatInput = this.byId("inputPackagingMaterial");
              if (oMatInput) {
                oMatInput.setValue("");
                oMatInput.setValueState("None");
              }
              let oDescInput = this.byId("inputHUDescription");
              if (oDescInput) {
                oDescInput.setValue("");
              }
            },
          });
          this.getView().addDependent(this._oCreateDialog);
        }
        this._oCreateDialog.open();
      },

      _onCreateConfirm() {
        let oMatInput = this.byId("inputPackagingMaterial");
        let oDescInput = this.byId("inputHUDescription");

        let sPackagingMaterial = (oMatInput.getValue() || "").trim();
        let sHUDescription = (oDescInput.getValue() || "").trim();

        if (!sPackagingMaterial) {
          oMatInput.setValueState("Error");
          oMatInput.setValueStateText("Packaging material is required");
          return;
        }
        oMatInput.setValueState("None");

        let sDeliveryNumber = this.getOwnerComponent()
          .getModel("appModel")
          .getProperty("/deliveryNumber");

        let oODataModel = this.getOwnerComponent().getModel();

        console.log(
          "[onCreateHU] Submitting create for delivery:",
          sDeliveryNumber,
          "material:",
          sPackagingMaterial,
          "desc:",
          sHUDescription,
        );

        // oODataModel.create() sends the POST immediately - no
        // submitChanges() needed (that's only required for createEntry()).
        oODataModel.create(
          "/zc_outbound_delivery('" + sDeliveryNumber + "')/to_HandlingUnit",
          {
            PackagingMaterial: sPackagingMaterial,
            HandlingUnitDescription: sHUDescription,
            HUObject: sDeliveryNumber,
          },
          {
            success: (oData, oResponse) => {
              console.log("[onCreateHU] create() SUCCESS - oData:", oData);
              console.log(
                "[onCreateHU] create() SUCCESS - response:",
                oResponse,
              );
              this._oCreateDialog.close();
              MessageToast.show("Handling Unit created successfully.");
              this.getView().getElementBinding().refresh();
            },
            error: (oError) => {
              console.error("[onCreateHU] create() ERROR - raw:", oError);
              console.error(
                "[onCreateHU] create() ERROR - status:",
                oError && oError.statusCode,
              );
              console.error(
                "[onCreateHU] create() ERROR - responseText:",
                oError && oError.responseText,
              );
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
