/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

XPCOMUtils.defineLazyModuleGetter(this, "Downloads",
                                  "resource://gre/modules/Downloads.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "PlexusStorage",
                                  "resource://gre/modules/PlexusStorage.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "Task",
                                  "resource://gre/modules/Task.jsm");

XPCOMUtils.defineLazyModuleGetter(this, "OS",
                                  "resource://gre/modules/osfile.jsm");


/*
 * Plexus object to discover and shows offers to try preferred service.
 */

var Plexus = {
  init: function plexus_init() {
    console.log('plexus init');
    this.addObserver();
  },

  addObserver: function plexus_addObserver() {
    Task.spawn(function () {
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
          if (!PlexusStorage.hasPreferredStorageService()) {
            // If not check once every session
            if (!PlexusStorage.initialized) {
              // Set session initialized to true
              PlexusStorage.initialized = true;

              // Scan for services on user desktop
              PlexusStorage.servicesScan().then(function(exists) {
                if (exists) {
                  // Offers to existing users - show notification after checking prompt_interval
                  PlexusStorage.handleStorageNotification(window, download);
                } else {
                  // TBD: Offers to new users with no storage services installed 
                  // Prompt to install cloud storage such as dropbox
                }
              }).catch((reason) => { console.log('Handle rejected promise (' + reason + ') here.'); });
            }
          } else {
            console.log('User has preferred storage service set in nightly');
          }
        },
      };

      yield list.addView(view);

    }).then(null, Components.utils.reportError);
  },
};
