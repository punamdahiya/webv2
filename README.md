# Webv2
**Instructions to test storage modules in Firefox nightly**

### New files
* Save PlexusServices.jsm and PlexusStorage.jsm in folder mozilla-central/js/xpconnect/loader
* Create new folder plexus at /browser/base/content/ and save icon files in it.
* Save browser-plexus.js in folder /browser/base/content/


### Existing files hook

**js/xpconnect/loader/moz.build**
* Include module names in mozilla-central/js/xpconnect/loader/moz.build as shown below:

`EXTRA_JS_MODULES += [`  
    `'ISO8601DateUtils.jsm',`  
    `'PlexusServices.jsm',`  
    `'PlexusStorage.jsm',`  
    `'XPCOMUtils.jsm',`  
`]`  


**browser/base/jar.mn**
* Update browser/base/jar.mn as below so that its accessible via chrome URL 'chrome://browser/content/plexus/filename'  

  `content/browser/pageinfo/security.js          (content/pageinfo/security.js)`  
  `content/browser/plexus/dropbox_128x128.png    (content/plexus/dropbox_128x128.png)`  
  `content/browser/sync/aboutSyncTabs.xul        (content/sync/aboutSyncTabs.xul)`  

**browser/base/content/global-scripts.inc**
* Include browser-plexus.js in global scripts  

`<script type="application/javascript" src="chrome://browser/content/browser-places.js"/>`  
`<script type="application/javascript" src="chrome://browser/content/browser-plexus.js"/>`  
`<script type="application/javascript" src="chrome://browser/content/browser-plugins.js"/>`  


**browser/base/content/browser.js**
* Hook Plexus.init() at Line 1564

`SocialUI.init();`  
`Plexus.init();`  


## Build
* Build and run nightly using ./mach build and run

* Use scratchpad to test imported module in browser context. See js/example.js to import and test API exposed in PlexusServices Module

* To view storage notification, install a storage service e.g. dropbox on your machine. Run nightly and download file, notification should show up once per session