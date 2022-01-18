$("table.poBody td.clsdHeader:contains(Other Files)").append("<button class=\"btn btn-raised btn-secondary\" type=\"button\" id=\"prettifyPO\" title=\"Prettify this PO\">Make Pretty</button>");

var numLines = 0;
var numLinesProcessed = 0;

$("#prettifyPO").click(doWork);

async function doWork() {
    let editList = $("td.attValue[align='left'] div.hidden-buttons-wrapper a[title='Edit']");
    numLines = editList.length;

    $(editList).each(async function() {
        await delay();
        fetch("https://machinesciences.adionsystems.com" + $(this).attr("onclick").split("'")[1]).then(res => res.text()).then(html => {
            let parser = new DOMParser();
            let editFileDoc = parser.parseFromString(html, "text/html");

            let filename = $(editFileDoc).find("form#linkEditForm input").eq(2);
    
            $(filename).val(makePretty($(filename).val()));

            $(editFileDoc).find("form#linkEditForm").submit();

            const data = new URLSearchParams(new FormData(editFileDoc.getElementById("linkEditForm")));

            fetch("https://machinesciences.adionsystems.com" + $(editFileDoc).find("form#linkEditForm").attr("action"), {
                method: "POST",
                body: data
            }).then(function() {
                numLinesProcessed++;

                if (numLinesProcessed == numLines) {
                    location.reload();
                }
            });
        });
    });
}

const delay = (ms = 1000) => new Promise(r => setTimeout(r, ms));

function makePretty(string) {
    // Check if it's empty, or if we've already prettified the text
    if (string == "" || string.includes("PO") || string.includes("PS"))
        return string;

    const textExplode = string.split("_");

    // Create our prettified version and insert it into the input field
    let newText = "PO" + textExplode[1].split("-")[0] + " PS" + textExplode[4];
    console.log(string + " -> " + newText);
    return newText;
}

function debug(info) {
    chrome.runtime.sendMessage({ type: "debug", file: "customPO.js", info: info });
};