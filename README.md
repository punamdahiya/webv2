# Webv2
**Instructions to build and test cloud storage in nightly**

### New files
**browser/base/content/browser-plexus.js**  
**browser/base/content/plexus/dropbox_18x18.png**  
**js/xpconnect/loader/PlexusServices.jsm**  
**js/xpconnect/loader/PlexusStorage.jsm**  

* Save PlexusServices.jsm and PlexusStorage.jsm in folder mozilla-central/js/xpconnect/loader
* Create new folder plexus at /browser/base/content/ and save icon files in it.
* Save browser-plexus.js in folder /browser/base/content/


### Existing files hook

**js/xpconnect/loader/moz.build**
**browser/base/jar.mn**

**browser/base/content/global-scripts.inc**
* Include browser-plexus.js in global scripts  

**browser/base/content/browser.js**
* Hook Plexus.init() at Line 1564

**browser/components/downloads/DownloadsViewUI.jsm**  
**browser/components/downloads/content/download.xml**  
**browser/components/downloads/content/downloads.js**  
**browser/components/downloads/content/downloadsOverlay.xul**  
**browser/themes/shared/downloads/allDownloadsViewOverlay.inc.css**  
**browser/themes/shared/downloads/downloads.inc.css**  
* Use nightly code base from commit https://hg.mozilla.org/mozilla-central/file/e03e0c60462c/ and override above files from /hooks 

## Build
* Build and run nightly using ./mach build and run.

* Use scratchpad to test imported module in browser context. See js/example.js to import and test API exposed in PlexusServices Module

* To view storage notification, install a storage service e.g. dropbox on your machine. Run nightly and download file, notification should show up on first download once per session
