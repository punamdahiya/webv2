/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

this.EXPORTED_SYMBOLS = ["PlexusStorage"];

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cu = Components.utils;

// Interval in days when preferred services on a machine should be scanned
// Service scan depending on latency could be less frequent
const SCAN_INTERVAL = .0001; // for dev

// Interval in days user should be prompted to opt in to a preferred storage service
const PROMPT_INTERVAL = 7; 

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");


XPCOMUtils.defineLazyModuleGetter(this, "PlexusServices",
  "resource://gre/modules/PlexusServices.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "OS",
  "resource://gre/modules/osfile.jsm");
XPCOMUtils.defineLazyModuleGetter(this, "DownloadsViewUI",
  "resource:///modules/DownloadsViewUI.jsm");

this.PlexusStorage = {
  initialized: false,
  storage: {},

  getPreferredStorageService() {
    return PlexusServices.getCurrentStorageService();
  },

  hasPreferredStorageService() {
    return PlexusServices.hasPreferredStorageService();
  },

  servicesScan() {
    return new Promise(function(resolve, reject) {
      let self = this;
      // Don't bother scanning again if we already did so recently
      if (this._checkScanTimeInterval()) {
        PlexusServices.getServiceList('cloud-storage').then(function(message) {
          if ( message.size > 0 ) {
            // TBD: pick one if return multiple, use dropbox for prototype
            self.storage = message;
            // TBD: Set scan pref
            Services.prefs.setIntPref("plexus.services.lastscan",
                              Math.floor(Date.now() / 1000));
            resolve(true);
          } else {
            // No storage services installed on user desktop
            resolve(false);
          }
        });
      } else {
        reject('scan interval not met');
      }
    }.bind(this));
  },

  _checkScanTimeInterval() {
    // TBD: Check for scan pref, if doesn't exist or scan time from pref 
    // more than scan interval return true, its time to scan again
    // else return false

    try {
      let lastScan = Services.prefs.getIntPref("plexus.services.lastscan", 0);
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

  _checkLastPromptShownTimeInterval() {
    // TBD: Check for scan pref, if its never set or prompt time from pref
    // more than pref interval return true, its time to show prompt
    // else return false;

    // Prototype doesn't have explicit check for last prompt shown time
    // interval and follows scan time interval.

    return true;
  },

  handleStorageNotification(chromeDoc, download) {
    if (this._checkLastPromptShownTimeInterval()) {
      // Default to first service available
      let prefService = {};

      let serviceArr = this.storage.entries().next().value;
      prefService.key = serviceArr[0];
      prefService.value = serviceArr[1];

      // If multiple services installed lookup for DropBox
      if (this.storage.size > 1) {
        this.storage.forEach(function(value, key) {
          // Check if storage metadata value has icon defined
          if (key === 'MAC_DROPBOX') {
            prefService.key = key;
            prefService.value = value;
          }
        });
      }

      this._showPromptUI(chromeDoc, download, prefService);
      // TBD: Set prompt shown pref
    }
  },

  _handleFirstDownload(chromeDoc, download) {
    // HACK: This is needed for the first download when the user opted in to choose
    // preferred storage service. Since the download is already initiated, we need to
    // move that file to preferred storage folder
    if (download.succeeded) {
      let destPath = OS.Constants.Path.homeDir ?
        OS.Path.join(OS.Constants.Path.homeDir,
        "Dropbox", OS.Path.basename(download.target.path)) : '';

      OS.File.move(download.target.path, destPath).then(() => {
        debug('First download moved successfully');

        if (chromeDoc.DownloadsView.richListBox) {
          DownloadsViewUI.DownloadElementShell.prototype.element =
            chromeDoc.DownloadsView.richListBox._currentItem;
          DownloadsViewUI.DownloadElementShell.prototype.download = download;

          // Show the Plexus preferred storage icon on the moved item
          DownloadsViewUI.DownloadElementShell.prototype.showPlexusStorageIcon();
        }

      }).catch((reason) => { debug('Rejected file copy (' + reason + ') here.'); });
    } else {
      // TBD: Handle so that the file is moved after successful download
      // inside view onDownloadChanged
    }
  },

  _showPromptUI(chromeDoc, download, prefService) {
    let message = "Would you like to save this file to your DropBox Downloads folder?";

    let main_action = {
      label: "Save to " + prefService.value.displayName,
      accessKey: "S",
      callback: function() {
        // Set preferred storage service
        PlexusServices.setCurrentStorageService(prefService.key);
        this._handleFirstDownload(chromeDoc, download);
      }.bind(this),
    };

    let secondary_action = [{
      label: "Save Locally",
      accessKey: "X",
      callback: function() {
        // Do nothing
        return;
      },
    }];

    let options = {
                    persistent: true,
                    popupIconURL: prefService.value.icon.default,
                    checkbox: {
                    	show: true,
                    	label: "Always remember my decision",
                    },
                  };
    let notificationid = "plexusServicesInstall";
    chromeDoc.PopupNotifications.show(chromeDoc.gBrowser.selectedBrowser,
                                        notificationid, message, null,
                                        main_action, secondary_action, options);

  },
}
