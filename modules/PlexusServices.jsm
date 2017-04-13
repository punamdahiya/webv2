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
Cu.import("resource://gre/modules/FileUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "OS",
  "resource://gre/modules/osfile.jsm");

/**
 * Global functions
 */

// URI to access icon files
function getIconURI(name) {
  let dirPath = "chrome://browser/content/plexus/";
  return dirPath + name;
}
// TBD: Move constants such as display name, icon file name in a separate config file?

// Cloud Storage Services metadata
var PlexusStorageServices = {
    // Default location of a dropbox folder is /Users/<USERNAME>/Dropbox
    // If a user changes dropbox folder location, it can be found from
    // ~/.dropbox/info.json Path variable

    MAC_DROPBOX: {
      displayName: "DropBox", // Storage Service Name
      get path() { return OS.Constants.Path.homeDir ?
                          OS.Path.join(OS.Constants.Path.homeDir, "Dropbox") :
                          '' },
      icon: {
        get default() { return getIconURI("dropbox_18x18.png") },
        get tiny() { return getIconURI("dropbox_30x30.png") }
      },
      typeSpecificData: {
        default: "Downloads",
        photo: "Photos",
        screenshot: "Screenshots"
      },
    },

    WINNT_DROPBOX: {
      displayName: "DropBox",
      get path() { return OS.Constants.Path.winAppDataDir ?
                          OS.Path.join(OS.Constants.Path.winAppDataDir, "Dropbox") :
                          '' },
      icon: {
        get default() { return getIconURI("winnt_18x18.png") },
        get tiny() { return getIconURI("winnt_30x30.png") }
      },
      typeSpecificData: {
        default: "Downloads",
        photo: "Photos",
        screenshot: "Screenshots"
      },
    },

    MAC_GDRIVE: {
      displayName: "Google Drive",
      get path() { return OS.Constants.Path.macUserLibDir ?
                          OS.Path.join(OS.Constants.Path.macUserLibDir, "Application Support/Google/Drive") :
                          '' },
      icon: {
        get default() { return getIconURI("gdrive_18x18.png") },
        get tiny() { return getIconURI("gdrive_30x30.png") }
      },
      typeSpecificData: {
        default: "Downloads",
        photo: "Photos",
        screenshot: "Screenshots"
      },
    },

    WINNT_GDRIVE: {
      displayName: "Google Drive",
      get path() { return OS.Constants.Path.winAppDataDir ?
                          OS.Path.join(OS.Constants.Path.winAppDataDir, "Local\Google\Drive") :
                          '' },
      icon: {
        get default() { return getIconURI("gdrive_18x18.png") },
        get tiny() { return getIconURI("gdrive_30x30.png") }
      },
      typeSpecificData: {
        default: "Downloads",
        photo: "Photos",
        screenshot: "Screenshots"
      },
    },
};

this.PlexusServices = {
  _cloudStorage: PlexusStorageServices,

  getDisplayName(key) {
    let storage = this._cloudStorage[key];
    return storage ? storage.displayName : null;
  },

  getIconURLBySize(key, size) {
     let storage = this._cloudStorage[key];
     return storage ? storage.icon[size] : null;
  },

  getFolderPathByType(key, type) {
    let storage = this._cloudStorage[key];
    return storage ?
      OS.Path.join(storage.path, storage.typeSpecificData[type]) :
      null;
  },

  /**
   *
   * Checks if the asset with input path exist on
   * file system
   */
  checkIfAssetExist(path) {
    return new Promise((resolve, reject) => {
      OS.File.exists(path).then((exists) => {
        resolve(exists);
      }).catch(e => { debug("\n Error while looking for asset");});
    });
  },

  /**
   *
   * Returns Promise containing data map with local storage
   * services found on machine.
   */
  getStorageServices() {
    return new Promise(function(resolve, reject) {

      let result = new Map();
      // Returns array of promises with data as true or false for storage drive
      // exists in the same order as enumerable property provided

      let arrPromises =
      Object.getOwnPropertyNames(this._cloudStorage).map(prop => {
        return this.checkIfAssetExist(this._cloudStorage[prop].path).then(
          function onSuccess(exist) {
            return exist;
          },
          function onError(err) {
            debug("Error ", err);
          }
        );
      });


      Promise.all(arrPromises).then(results => {
        // Array of storage keys
        let storageKeys = Object.keys(this._cloudStorage);

        // update result map for each storage key with exist as true
        // and the metdata from _cloudStorage
        results.forEach((exist, idx) => {
          if (exist) {
            let key = storageKeys[idx];
            // TBD: consider return of limited set of data to optimize scan?
            result.set(key, this._cloudStorage[key]);
          }
        });

        resolve(result);
      });
    }.bind(this));
  },

  /**
   *
   * returns metdata of storage service
   * set in pref settings
   */

  getCurrentStorageService() {
    // Storing as self as scope of this changing to BackStagePass while
    // accessing Services.prefs.getCharPref("plexus.services.storage"), why?
    let self = this;
    try {
      let key = Services.prefs.getCharPref("plexus.services.storage");

      // Use key to retrieve metadata from PlexusStorageServices
      return self._cloudStorage.hasOwnProperty(key) ?
        self._cloudStorage[key] : null;
    } catch (ex) {
      // Exception: Pref not set or found
      return null;
    }
  },

  hasPreferredStorageService() {
    try {
      return Services.prefs.getCharPref("plexus.services.storage");
    } catch (ex) {
      // Exception: Pref not set or found
      return null;
    }
  },


  /**
   *
   * set storage service pref settings with provided key
   *
   */
  setCurrentStorageService(key) {
    Services.prefs.setIntPref("browser.download.folderList", 2);

    // Use to the key to retrieve default download folder path from
    // PlexusServicesStorage
    let downloadDir = FileUtils.File(this.getFolderPathByType(key, 'default'));

    // Using download directory downloadDir.path
    Services.prefs.setComplexValue("browser.download.dir", Ci.nsIFile, downloadDir);
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
