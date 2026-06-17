sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "hupackingfiori/model/models",
    "sap/ui/model/json/JSONModel",
  ],
  (UIComponent, models, JSONModel) => {
    "use strict";

    return UIComponent.extend("hupackingfiori.Component", {
      metadata: {
        manifest: "json",
        interfaces: ["sap.ui.core.IAsyncContentCreation"],
      },

      init() {
        // call the base component's init function
        UIComponent.prototype.init.apply(this, arguments);

        // Shared runtime model (holds the currently selected delivery's data)
        let oAppModel = new JSONModel({
          deliveryNumber: "",
          hasSelection: false,
        });
        this.setModel(oAppModel, "appModel");

        // Load the mock data file and expose it as "mockModel"
        /* let oMockModel = new JSONModel();
            oMockModel.loadData("localData/mockData.json", null, false);
            this.setModel(oMockModel, "mockModel"); */

        // set the device model
        this.setModel(models.createDeviceModel(), "device");

        // enable routing
        this.getRouter().initialize();
      },
    });
  },
);
