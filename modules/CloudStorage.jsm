/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

this.EXPORTED_SYMBOLS = ["CloudStorage"];

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "OS",
  "resource://gre/modules/osfile.jsm");

// Set to true to see debug messages.
var DEBUG = true;

// Interval in days to scan desktop for storage services
const SCAN_INTERVAL = .0001; // for dev

/**
 * Global functions
 */

// URI to access icon files
function getIconURI(name) {
  let dirPath = "chrome://browser/content/cloudstorage/";
  return dirPath + name;
}

var CloudServicesMetaData = {
    // Default location is homedirectory Dropbox folder
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

this.CloudStorage = {
  _cloudStorage: CloudServicesMetaData,
  initialized: false,

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

  _handleMultipleServices(storages) {
    // Default to first service available
    let prefService = {};

    let serviceArr = storages.entries().next().value;
    prefService.key = serviceArr[0];
    prefService.value = serviceArr[1];

    // lookup for Dropbox
    storages.forEach(function(value, key) {
      if (key === 'MAC_DROPBOX') {
        prefService.key = key;
        prefService.value = value;
      }
    });
    return prefService;
  },

  _checkScanInterval() {
    // Check for scan pref, if doesn't exist or scan time from pref 
    // more than scan interval return true, its time to scan again
    // else return false

    try {
      let lastScan = Services.prefs.getIntPref("cloud.storage.lastscan", 0);
      let now = Math.floor(Date.now() / 1000);
      let interval = now - lastScan;

      // Convert SCAN_INTERVAL to seconds
      let maxAllow = SCAN_INTERVAL * 24 * 60 * 60;

      return interval > maxAllow ? true : false;

    } catch (ex) {
      // Exception: Pref not set or found
      return true;
    }

  },

  scan() {
    return new Promise(function(resolve, reject) {
      let self = this;
      // Don't bother scanning again if we already did so recently
      if (this._checkScanInterval()) {
        this.getStorageServices().then(function(result) {
          Services.prefs.setIntPref("cloud.storage.lastscan",
                              Math.floor(Date.now() / 1000));
          if ( result.size < 1 ) {
            // No storage services installed on user desktop
            resolve(null);
          } else if ( result.size == 1 ) {
            let service = result.entries().next().value;
            resolve({ key: service[0],
                      value: service[1]
            });
          } else {
            // multiple storage services detected on user desktop
            // check for dropbox and return it as preferred
            // else return first entry
            resolve(this._handleMultipleServices(result));
          }
        }.bind(this));
      } else {
        reject('scan time too soon..');
      }
    }.bind(this));
  },

  /**
   *
   * Checks if the asset with input path exist on
   * file system
   */
  _checkIfAssetExist(path) {
    return new Promise((resolve, reject) => {
      OS.File.exists(path).then((exists) => {
        resolve(exists);
      }).catch(e => { debug("\n error while looking for asset");});
    });
  },

  /**
   *
   * Returns Promise containing data map with local storage
   * services found on user desktop
   */
  getStorageServices() {
    return new Promise(function(resolve, reject) {

      let result = new Map();
      // Returns array of promises with data as true or false for storage drive
      // exists in the same order as enumerable property provided

      let arrPromises =
      Object.getOwnPropertyNames(this._cloudStorage).map(prop => {
        return this._checkIfAssetExist(this._cloudStorage[prop].path).then(
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

  hasPreferredStorageService() {
    try {
      return Services.prefs.getCharPref("cloud.services.storage");
    } catch (ex) {
      // Exception: Pref not set or found
      return null;
    }
  },

  /**
   *
   * returns metdata of storage service
   * set in pref settings
   */

  getCurrentStorageService() {
    // Storing as self as scope of this changing to BackStagePass while
    // accessing Services.prefs.getCharPref("cloud.services.storage"), why?
    let self = this;
    try {
      let key = Services.prefs.getCharPref("cloud.services.storage");

      // Use key to retrieve metadata from CloudServicesMetaData
      return self._cloudStorage.hasOwnProperty(key) ?
        self._cloudStorage[key] : null;
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
    // CloudServicesMetaData
    let downloadDir = FileUtils.File(this.getFolderPathByType(key, 'default'));

    // Using download directory downloadDir.path
    Services.prefs.setComplexValue("browser.download.dir", Ci.nsIFile, downloadDir);
    Services.prefs.setCharPref("cloud.services.storage", key);
  },

};

var debug;
if (DEBUG) {
  debug = function(msg) {
    dump("cloud storage: " + msg + "\n");
  };
} else {
  debug = function(msg) {};
}
