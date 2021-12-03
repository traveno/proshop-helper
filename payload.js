// Run the payload after a 100ms delay
setTimeout(scrapeData, 100);

function scrapeData() {
    let woNumber = null;

    try {
        woNumber = document.getElementById("pageTitle").childNodes[0].childNodes[2].innerHTML;
    } catch(error) {
        console.log("Failed to obtain WO number. Are we on a WO page?");
    }

    if (woNumber == undefined) {
        return;
    }
    
    console.log("Captured WO number " + woNumber);
    chrome.runtime.sendMessage({ type: "wo-number", data: woNumber });

    // Load up the part stock information for this WO number
    fetch("https://machinesciences.adionsystems.com/procnc/workorders/" + woNumber + "$formName=partStockStatus").then(res => res.text()).then(html => {
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(html, "text/html");

        let partStockInfos = htmlDoc.getElementsByClassName("dashedTable");

        for (let i = 0; i < partStockInfos.length; i++) {
            // PO number
            let partStock_poNumber = partStockInfos.item(i).childNodes[1].childNodes[0].childNodes[9].childNodes[1].childNodes[0].innerHTML;

            // Actual qty
            let partStock_actualQty = partStockInfos.item(i).childNodes[1].childNodes[10].childNodes[8].innerHTML;

            // Actual arrived date
            let partStock_actualArrived = partStockInfos.item(i).childNodes[1].childNodes[14].childNodes[9].innerHTML.split(";")[0];

            // Get line item number
            let partStock_lineItem = 0;

            fetch("https://machinesciences.adionsystems.com/procnc/purchaseorders/" + partStock_poNumber).then(res => res.text()).then(html => {
                const poDoc = parser.parseFromString(html, "text/html");

                console.log(partStock_poNumber);

                // This is a little ridiculous so hopefully it never breaks
                // There's probably a better way using jQuery but I can't seem to find a way to import the library into this content script
                let poLineInfos = poDoc.getElementsByClassName("poBody").item(0).childNodes[1].childNodes[2].childNodes[3].lastChild.previousSibling.childNodes[2];

                let poLineInfos_iterate = poLineInfos.firstChild;

                // Iterate down the rows within the purchase order
                do {
                    // Limit our search to only <tr> elements
                    if (poLineInfos_iterate.tagName == "TR") {
                        // Line number of row within the purchase order
                        let lineNumber = parseInt(poLineInfos_iterate.childNodes[0].innerHTML);

                        // If the <tr> does not contain a number, skip to next candidate
                        if (isNaN(lineNumber)) {
                            poLineInfos_iterate = poLineInfos_iterate.nextSibling;
                            continue;
                        }

                        let lineWoNumber = poLineInfos_iterate.childNodes[9].childNodes[1];

                        // It is possible we have multiple WO #'s on a single line
                        if (lineWoNumber == undefined) {
                            lineWoNumber = poLineInfos_iterate.childNodes[9].childNodes[0];

                            // We need to iterate through all WO #'s within this line
                            lineWoNumber_iterate = lineWoNumber.firstChild;

                            do {
                                console.log(lineWoNumber_iterate.innerHTML);
                                if (lineWoNumber_iterate.innerHTML == woNumber) {
                                    // We found a match
                                    lineWoNumber = lineWoNumber_iterate;
                                    break;
                                }

                                // Advance to next candidate
                                lineWoNumber_iterate = lineWoNumber_iterate.nextSibling;
                            } while (lineWoNumber_iterate.nextSibling != null);
                        }
                        

                        // Do we have a result?
                        if (lineWoNumber.innerHTML == woNumber) {
                            console.log(woNumber + " is line item " + lineNumber + " on PO " + partStock_poNumber);

                            chrome.runtime.sendMessage({
                                type: "partStockInfo",
                                po: partStock_poNumber,
                                line: lineNumber,
                                arrived: partStock_actualArrived,
                                qty: partStock_actualQty
                            });

                            // Notify worktag.js that we are finished with our search algorithm
                            if (i == partStockInfos.length - 1) {
                                chrome.runtime.sendMessage({ type: "finishedSearch" });
                            }
                        }
                    }

                    // Advance to next candidate
                    poLineInfos_iterate = poLineInfos_iterate.nextSibling;
                } while (poLineInfos_iterate.nextSibling != null);
            });
        }
    });
}