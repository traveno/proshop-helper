import * as $ from "jquery";

function injectButton(): void {
    /*fetch(chrome.runtime.getURL("customButton.html")).then(r => r.text()).then(html => {
        // Attempt to inject the "Create Work Tag" button into the page
        try {
            document.getElementById("dropdownMenu").parentElement.insertAdjacentHTML('beforebegin', html);
        } catch (error) {
            console.log("Could not inject button");
            return;
        }
    
        // Set onclick() of the injected button
        if (document.getElementById("generateTag") != null) {
            let button = document.getElementById("generateTag");
            button.onclick = function() {
                chrome.runtime.sendMessage({ type: "generateTag" });
            };
        }
    });*/

    $("#dropdownMenu").before("<button class=\"btn btn-raised btn-secondary\" type=\"button\" id=\"generateTag\" title=\"Generate QR sheet\">Work Tag</button>");
    $("#generateTag").on("click", () => {
        chrome.runtime.sendMessage({ type: "generateTag" });
    });
}

// Only inject our custom button if we are on the main WO page
if (!location.href.includes("formName="  ) &&
    !location.href.includes("pageType="  ) &&
    !location.href.includes("pagetype="  ) &&
    !location.href.includes("form="      ) &&
    !location.href.includes("customView=") &&
    !location.href.includes("viewName="  ))
    chrome.storage.local.get(["enabled"], function(result) {
        if (result.enabled)
            injectButton();
    });