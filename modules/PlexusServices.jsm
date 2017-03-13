/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

this.EXPORTED_SYMBOLS = ["PlexusServices"];

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "OS",
  "resource://gre/modules/osfile.jsm");

this.PlexusServices = {
  Services: {
    cloudStorage: this.cloudStorageCfg,
  },

  cloudStorageCfg: [
    // Dropbox
    {
      name: "dropbox", // Storage Service Name
      path: "/.dropbox"
    },
  ],

  init() {
  },

  uninit() {

  },

  checkIfFileExist(path) {
    return new Promise(function(resolve, reject) {
      let result = "empty";

      OS.File.stat(path).then(function(info) {
        if (info.isDir) {
          result = 'directory';
        } else if (info.isSymLink) {
          result = 'link';
        } else {
          result = 'file';
        }
        resolve(result);
      },
      function(reason) {
        if (reason instanceof OS.File.Error && reason.becauseNoSuchFile) {
          result = 'notfound';
        } else {
          result = 'not-found-error';
        }
        reject(result);
      });
    });
  },

  
  getServiceList(serviceType) {
    var self = this;
    switch (serviceType) {
      case "cloud-storage": {
        // Let's check for dropbox for now
        // TBD: make it generic to handle multiple storages
        return new Promise(function(resolve, reject) {
          self.checkIfFileExist(OS.Constants.Path.homeDir + '/.dropbox').then(function(result){
            resolve(result);
          }); 
        });
        break;
      }
    }
  }
}
