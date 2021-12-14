// Run the payload after a 200ms delay
setTimeout(scrapeData, 200);

function scrapeData() {
    let woNumber = null;

    // Keep track of how many part stocks there are
    // and how many we have looked at
    let numPartStocks = 0;
    let numPartStocksSearched = 0;

    try {
        woNumber = document.getElementById("pageTitle").childNodes[0].childNodes[2].innerHTML;
    } catch(error) {
        console.log("Failed to obtain WO number. Are we on a WO page?");
        return;
    }
    
    chrome.runtime.sendMessage({ type: "wo-number", data: woNumber });

    // Load up the part stock information for this WO number
    fetch("https://machinesciences.adionsystems.com/procnc/workorders/" + woNumber + "$formName=partStockStatus").then(res => res.text()).then(html => {
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(html, "text/html");

        let partStockInfos = htmlDoc.getElementsByClassName("dashedTable");
        numPartStocks = partStockInfos.length;

        for (let i = 0; i < partStockInfos.length; i++) {
            // PO number
            let partStock_poNumber = null;
            // Actual received quantity
            let partStock_actualQty = null;
            // Actual arrived date
            let partStock_actualArrived = null;

            // Attempt to scrape the part stock information
            try {
                partStock_poNumber = partStockInfos.item(i).childNodes[1].childNodes[0].childNodes[9].childNodes[1].childNodes[0].innerHTML;
                partStock_actualQty = partStockInfos.item(i).childNodes[1].childNodes[10].childNodes[8].innerHTML;
                partStock_actualArrived = partStockInfos.item(i).childNodes[1].childNodes[14].childNodes[9].innerHTML.split(";")[0];
            } catch (error) {
                // If we have trouble reading the part stock information, finish the search and return
                // i.e. for Customer Supplied Material, there is no PO# in the part stock information
                // Thanks to Chris L. and 21-1015 for helping me discover this bug
                console.log("Part stock info is missing information");
                chrome.runtime.sendMessage({ type: "finishedSearch" }); 
                return;
            }

            fetch("https://machinesciences.adionsystems.com/procnc/purchaseorders/" + partStock_poNumber).then(res => res.text()).then(html => {
                const poDoc = parser.parseFromString(html, "text/html");

                // This is a little ridiculous so hopefully it never breaks
                // There's probably a better way using jQuery but I can't seem to find a way to import the library into this content script
                let poLineInfos = null;
                
                try {
                    poLineInfos = poDoc.getElementsByClassName("poBody").item(0).childNodes[1].childNodes[2].childNodes[3].lastChild.previousSibling.childNodes[2];
                } catch (error) {
                    return;
                }

                let poLineInfos_iterate = poLineInfos.firstChild;

                // Iterate down the rows within the purchase order
                do {
                    // Limit our search to only <tr> elements
                    if (poLineInfos_iterate.tagName == "TR") {
                        // Grab the line number from the current row
                        let lineNumber = parseInt(poLineInfos_iterate.childNodes[0].innerHTML);

                        // Sometimes the line number is highlighted in yellow and therefore
                        // embedded into a further child. This is how we check for that.
                        // For example, lines that are marked FBS appear to be highlighted yellow.
                        if (poLineInfos_iterate.childNodes[0].hasChildNodes()) {
                            if (poLineInfos_iterate.childNodes[0].childNodes[0].hasChildNodes()) {
                                lineNumber = parseInt(poLineInfos_iterate.childNodes[0].childNodes[0].innerHTML);
                            }
                        }

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
                            chrome.runtime.sendMessage({
                                type: "partStockInfo",
                                // We get a substring of the PO# to prevent sending extra text...
                                // 213XXX-Pre-Cut is a good example
                                po: partStock_poNumber.substring(0, 6),
                                line: lineNumber,
                                arrived: partStock_actualArrived,
                                qty: partStock_actualQty
                            });
                        }
                    }

                    // Advance to next candidate
                    poLineInfos_iterate = poLineInfos_iterate.nextSibling;
                } while (poLineInfos_iterate.nextSibling != null);
            }).then(function() {
                // We need to keep track of this because these fetch() calls are asynchronous
                numPartStocksSearched++;
                // Notify worktag.js that we are finished with our search algorithm
                if (numPartStocksSearched == numPartStocks) {
                    chrome.runtime.sendMessage({ type: "finishedSearch" });
                }
            });
        }
    });
}