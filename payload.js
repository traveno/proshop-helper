// Run the payload after a 200ms delay
setTimeout(scrapeData, 200);

// Define our global variables
if (typeof numPartStocks == "undefined") {
    // Keep track of how many part stocks there are
    // and how many we have looked at
    var numPartStocks = 0;
    var numPartStocksSearched = 0;
}

function checkSearchComplete() {
    if (numPartStocksSearched == numPartStocks && numPartStocks != 0) {
        chrome.runtime.sendMessage({ type: "finishedSearch" });
        numPartStocks = numPartStocksSearched = 0;
    }
}

function scrapeData() {
    let woNumber = null;

    try {
        woNumber = $("font#pageTitleContent.pageTitleContent a.htmlTooltip").text();
    } catch (error) {
        console.log("Failed to obtain WO number. Are we on a WO page?");
        return;
    }
    
    chrome.runtime.sendMessage({ type: "wo-number", data: woNumber });

    // Load up the part stock information for this WO number
    fetch("https://machinesciences.adionsystems.com/procnc/workorders/" + woNumber + "$formName=partStockStatus").then(res => res.text()).then(html => {
        const parser = new DOMParser();
        const partStockDoc = parser.parseFromString(html, "text/html");

        // Get a list of the part stocks
        let tables = $(partStockDoc).find("table.dashedTable");
        numPartStocks = tables.length;

        // Loop through each part stock
        $(tables).each(function() {
            // PO number
            let partStock_poNumber = null;
            // Actual received quantity
            let partStock_actualQty = null;
            // Actual arrived date
            let partStock_actualArrived = null;

            // Attempt to scrape the part stock information
            try {
                partStock_poNumber = $(this).find("a.htmlTooltip span").eq(0).text().split("-")[0];
                partStock_actualQty = $(this).find("tr td.plainValue").eq(11).text();
                partStock_actualArrived = $(this).find("tr td.plainValue").eq(15).text().split(";")[0];
            } catch (error) {
                console.log("Something went wrong");
                chrome.runtime.sendMessage({ type: "finishedSearch" });
                return;
            }

            // In case this is CSM and there is no ProShop material assigned
            // therefore, there is no purchase order
            if (partStock_poNumber == "") {
                chrome.runtime.sendMessage({ type: "finishedSearch" });

                // Return false so that jQuery discontinues this each() loop
                return false;
            }

            // Load up the purchase order
            fetch("https://machinesciences.adionsystems.com/procnc/purchaseorders/" + partStock_poNumber).then(res => res.text()).then(html => {
                const poDoc = parser.parseFromString(html, "text/html");

                // Get a list of all line items in this purchase order
                let poLineInfo = $(poDoc).find("table.poBody tbody tr td table tbody tr");

                // If the user lacks permission to view purchase orders
                // poLineInfo.length will be zero.
                // A better way to go about this should be to check user
                // permissions. This works for now, though.
                if (poLineInfo.length == 0) {
                    chrome.runtime.sendMessage({
                        type: "partStockInfo",
                        po: partStock_poNumber,
                        line: "N/A",
                        arrived: partStock_actualArrived == "" ? "N/R" : partStock_actualArrived,
                        qty: partStock_actualQty == "" ? "N/A" : partStock_actualQty
                    });

                    // Exit this async fetch
                    return;
                }

                // Loop through each line of the purchase order
                $(poLineInfo).each(function() {
                    let lineWoNumber = $(this).find("td.attValue a");

                    // Loop through each column
                    $(lineWoNumber).each(function() {
                        if ($(this).text() == woNumber) {
                            chrome.runtime.sendMessage({
                                type: "partStockInfo",
                                po: partStock_poNumber,
                                line: $(this).parent().siblings().eq(0).text().split(" ")[0],
                                arrived: partStock_actualArrived == "" ? "N/R" : partStock_actualArrived,
                                qty: partStock_actualQty == "" ? "N/A" : partStock_actualQty
                            });
                        }

                        // Exit this async fetch
                        return;
                    });
                });
            }).then(function() {
                // We need to keep track of this because these fetch() calls are asynchronous
                numPartStocksSearched++;
                checkSearchComplete();
            });
        });
    });
}