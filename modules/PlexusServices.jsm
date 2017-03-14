/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

this.EXPORTED_SYMBOLS = ["PlexusServices"];

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "OS",
  "resource://gre/modules/osfile.jsm");

// Cloud Storage Services metadata
var PlexusStorageServices = {
    MAC_DROPBOX: {
      displayname: "DropBox", // Storage Service Name
      get path() { return OS.Constants.Path.homeDir ?
                          OS.Path.join(OS.Constants.Path.homeDir, ".dropbox/") :
                          '' },
      dataURI: "data:image/png;base64,iBsdf...", // TBD: Icon handle multiple sizes?
      typeSpecificData: {
        photo: "/Photos",
        screenshot: "/Screenshots"
      },
    },

    WINDOW_DROPBOX: {
      displayname: "DropBox", // Storage Service Name
      get path() { return OS.Constants.Path.winAppDataDir ?
                          OS.Path.join(OS.Constants.Path.winAppDataDir, "Dropbox") :
                          '' },
      dataURI: "data:image/png;base64,iBsdf...",
      typeSpecificData: {
        photo: "/Photos",
        screenshot: "/Screenshots"
      },
    },

    MAC_GDRIVE: {
      displayname: "Google Drive", // Storage Service Name
      get path() { return OS.Constants.Path.homeDir ?
                          OS.Path.join(OS.Constants.Path.homeDir, ".gdrive/") :
                          '' },
      dataURI: "data:image/png;base64,isdf...",
    },
};

this.PlexusServices = {
  _cloudStorage: PlexusStorageServices,

  /**
   *
   * Checks if the asset with input path exist on
   * file system
   */
  checkIfAssetExist(path) {
    return new Promise((resolve, reject) => {
      OS.File.stat(path).then((exists) => {
        if (exists) {
          resolve(exists);
        }
      }).catch(e => { debug("\n Asset not found");});
    });
  },

  /**
   *
   * Returns Promise containing data with local storage
   * services found on machine.
   */
  getStorageServices() {
    return new Promise(function(resolve, reject) {
      let result = new Map();

      Object.getOwnPropertyNames(this._cloudStorage).forEach((prop) => {
        this.checkIfAssetExist(this._cloudStorage[prop].path).then((info) => {
          if (info) {
            // TBD: consider return of limited set of data to optimize scan?
            result.set(prop, this._cloudStorage[prop]);
          }
        });
      });
      resolve(result);
    }.bind(this));
  },

  /**
   *
   * returns metdata of storage service
   * set in pref settings
   */

  getCurrentStorageService() {
    if (Services.prefs.getCharPref("plexus.services.storage")) {
      let key = Services.prefs.getCharPref("plexus.services.storage");
      // TBD: Use key to retrieve metadata from PlexusStorageServices
      return key;
    }
  },

  /**
   *
   * set storage service pref settings with provided key
   * TBD: can a user set multiple storage or pick one as default?
   *
   */
  setCurrentStorageServices(key) {
    Services.prefs.setCharPref("plexus.services.storage", key);
  },

  /**
   *
   * returns a promise with key value pair of serviceType found
   */
  getServiceList(serviceType) {
    switch (serviceType) {
      case "cloud-storage": {
          return this.getStorageServices();
        break;
      }
    }
  },

  getCurrentService(serviceType) {
    switch (serviceType) {
      case "cloud-storage": {
          return this.getCurrentStorageService();
        break;
      }
    }
  },


  setCurrentService(serviceType, key) {
    switch (serviceType) {
      case "cloud-storage": {
          return this.setCurrentStorageServices(key);
        break;
      }
    }
  },

}
