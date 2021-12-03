fetch(chrome.runtime.getURL("customButton.html")).then(r => r.text()).then(html => {
    try {
        document.getElementById("dropdownMenu").parentElement.insertAdjacentHTML('beforebegin', html);
    } catch (error) {
        console.log("Could not inject button");
    }
});

setTimeout(registerButton, 100);

function registerButton() {
    if (document.getElementById("generateTag") != null) {
        let button = document.getElementById("generateTag");
        button.onclick = function() {
            chrome.runtime.sendMessage({ type: "generateTag" });
        };
    }
}