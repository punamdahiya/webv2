/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

XPCOMUtils.defineLazyModuleGetter(this, "Downloads",
                                  "resource://gre/modules/Downloads.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "CloudStorage",
                                  "resource://gre/modules/CloudStorage.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "OS",
                                  "resource://gre/modules/osfile.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "DownloadsViewUI",
                                  "resource:///modules/DownloadsViewUI.jsm");


/*
 * Object to observe download invoked and prompt user to opt-in to download
 * in local storage service folder such as dropbox
 */

var CloudStorageUI = {
  init: function() {
    this.addObserver();
  },

  addObserver: function() {
    Task.spawn(function() {
      let list = yield Downloads.getList(Downloads.ALL);

      let view = {

        onDownloadChanged: download => {
         if (download.succeeded) {
            // TBD: Fix as code hits this point before
            // user can select Save to my preferred drive in prompt
            // For now below call is invoked from PlexusStorage.jsm
            // right after user accepts preferred storage
            // PlexusStorage._handleFirstDownload(download);
          }
        },
        onDownloadAdded: download => {
          // Check if user has set preferred storage service
          if (!CloudStorage.hasPreferredStorageService()) {
            // If not check once every session
            if (!CloudStorage.initialized) {
              // Set session initialized to true
              CloudStorage.initialized = true;

              // Scan for services on user desktop
              CloudStorage.scan().then(function(service) {
                if (service) {
                  // Offers to existing users
                  console.log('local storage service found', service);
                  this.showPrompt(window, download, service);
                } else {
                  // TBD: Offers to new users with no storage services installed 
                  // Prompt to install cloud storage such as dropbox
                }
              }.bind(this)).catch((reason) => { console.log('Handle rejected promise (' + reason + ') here.'); });
            }
          } else {
            // Set Annotation for this download from here or it should be done from back-end
            //
            console.log('User has preferred storage service set in nightly');
          }
        },
      };

      yield list.addView(view);

    }.bind(this)).then(null, Components.utils.reportError);
  },

  showPrompt: function(chromeDoc, download, prefService) {
    let message = "Would you like to save this file to your " +
      prefService.value.displayName  + " Downloads folder?";

    let main_action = {
      label: "Save to " + prefService.value.displayName,
      accessKey: "S",
      callback: function() {
        // Set preferred storage service
        CloudStorage.setCurrentStorageService(prefService.key);
        this.handleFirstDownload(chromeDoc, prefService, download);
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

  handleFirstDownload: function(chromeDoc, pref, download) {
    // HACK: This is needed for the first download when the user opted in to choose
    // preferred storage service. Since the download is already initiated, we need to
    // move that file to preferred storage folder
    // Use the prefService from calling function to get the destPath
    // Need a methd to return default download folder path when passed key

    if (download.succeeded) {
      let downloadPath = CloudStorage.getFolderPathByType(pref.key, 'default');

      // create download directory if it doesn't exist
      OS.File.makeDir(downloadPath, {ignoreExisting: true}).then(() => {

        let destPath = downloadPath ?
        OS.Path.join(downloadPath, OS.Path.basename(download.target.path)) :
        '';

        OS.File.move(download.target.path, destPath).then(() => {

          if (chromeDoc.DownloadsView.richListBox) {
            DownloadsViewUI.DownloadElementShell.prototype.element =
              chromeDoc.DownloadsView.richListBox._currentItem;
            DownloadsViewUI.DownloadElementShell.prototype.download = download;

            // Show the Plexus preferred storage icon on the moved item
            // Pass the pref key to retrieve icon URL
            DownloadsViewUI.DownloadElementShell.prototype.showPlexusStorageIcon();
          }

        }).catch((reason) => { console.log('Rejected file move (' + reason + ') here.'); });
      }).catch((reason) => { console.log('Failed creating directory (' + reason + ') here.'); });
    } else {
      // TBD: Handle so that file is moved after successful download
      // inside view onDownloadChanged
    }
  },

};
