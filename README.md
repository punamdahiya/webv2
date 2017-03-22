# webv2

Instructions to test JSM Module:

* Include module name in mozilla-central/js/xpconnect/loader/moz.build as shown below:

`EXTRA_JS_MODULES += [`
    `'ISO8601DateUtils.jsm',`
    `'PlexusServices.jsm',`
    `'XPCOMUtils.jsm',`
`]`

* Save jsm module in folder mozilla-central/js/xpconnect/loader

* For testing, save icon files under /browser/branding/unofficial/content/ and update respective jar.mn so that its accessible via chrome URL 'chrome://branding/content/filename'

* Build and run nightly using ./mach build and run

* Use scratchpad to test imported module in browser context. See js/example.js on how to import and test API exposed in JSM Module