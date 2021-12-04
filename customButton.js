fetch(chrome.runtime.getURL("customButton.html")).then(r => r.text()).then(html => {
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
});