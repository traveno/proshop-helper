import * as $ from "jquery";

var username: JQuery<HTMLElement> = $("span.user_name");

if (username.length) {
    if (username.text() === "STEPHEN F") {
        chrome.storage.local.set({ perm_cots: true, perm_parts: true, perm_reporting: true });
    }
}