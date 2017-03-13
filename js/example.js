/*
 * This is a JavaScript Scratchpad.
 *
 * Enter some JavaScript, then Right Click or choose from the Execute Menu:
 * 1. Run to evaluate the selected text (Cmd-R),
 * 2. Inspect to bring up an Object Inspector on the result (Cmd-I), or,
 * 3. Display to insert the result in a comment after the selection. (Cmd-L)
 */

Components.utils.import('resource://gre/modules/PlexusServices.jsm');


PlexusServices.getServiceList('cloud-storage').then(function(successMessage) {
    console.log("Yay! " + successMessage);
    alert(successMessage);
});

//alert(PlexusServices.getServiceList('cloud-storage'));