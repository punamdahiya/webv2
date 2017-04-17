# Webv2
**Instructions to build and test cloud storage in nightly**

### New files
**browser/base/content/cloudstorage/dropbox_18x18.png**  
**browser/base/content/cloudstorage/cloudstorage.js**  
**toolkit/modules/CloudStorage.jsm**  


### Existing files hook

**toolkit/modules/moz.build**  


**browser/base/jar.mn**  
**browser/base/content/global-scripts.inc**
* Include cloudstorage.js in global scripts  

**browser/base/content/browser.js**
* Hook CloudStorageUI.init() at Line 1564

**browser/components/downloads/DownloadsViewUI.jsm**  
**browser/components/downloads/content/downloads.js**  

**browser/components/downloads/content/download.xml**  
**browser/components/downloads/content/downloadsOverlay.xul**  
**browser/themes/shared/downloads/allDownloadsViewOverlay.inc.css**  
**browser/themes/shared/downloads/downloads.inc.css**  

* Use nightly code base from commit https://hg.mozilla.org/mozilla-central/file/e03e0c60462c/ and override above files from /hooks 

## Build
* Build and run nightly using ./mach build and run.

* To view storage notification, install a storage service e.g. dropbox on your machine. Run nightly and download file, notification show up on first download once per session
