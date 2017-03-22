/*
 * This is a JavaScript Scratchpad.
 *
 * Enter some JavaScript, then Right Click or choose from the Execute Menu:
 * 1. Run to evaluate the selected text (Cmd-R),
 * 2. Inspect to bring up an Object Inspector on the result (Cmd-I), or,
 * 3. Display to insert the result in a comment after the selection. (Cmd-L)
 */

Components.utils.import('resource://gre/modules/PlexusServices.jsm');

PlexusServices.getServiceList('cloud-storage').then(function(message) {

  console.log(message);
  console.log(message.get('MAC_DROPBOX'));
  if ( message.size > 0 ) {
    message.forEach(function(value, key) {
    // Check if storage metadata value has icon defined
      if (value.icon) {
        console.log(value.icon.default);
        console.log(value.icon.tiny);
      }
    });
  }
});

PlexusServices.setCurrentService('cloud-storage', 'MAC_DROPBOX');

console.log(PlexusServices.getCurrentService('cloud-storage'));

function showImage(src) {
  var img = document.createElement("img");
  img.width = 128;
  img.height = 128;
  Object.assign(img.style, { display: "block", position: "absolute",
    zIndex: "1000", left: "0", top: "0", background: "url(" + src + ")" });
  document.documentElement.appendChild(img);
}

// TBD: Resource URL to import icons?
showImage('chrome://branding/content/dropbox_128x128.png')
