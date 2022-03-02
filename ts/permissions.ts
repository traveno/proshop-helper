import * as $ from "jquery";

var username: JQuery<HTMLElement> = $("span.user_name");

if (username.length) {
    if (username.text() !== undefined) {
        chrome.storage.local.set({ perm_cots: true, perm_parts: true, perm_reporting: true });
    }
}


// Get ProShop base url
chrome.storage.local.set({ ps_url: document.location.origin });