// Run the payload after a 200ms delay
setTimeout(scrapeData, 200);

// Define our global variables
if (typeof numPartStocks == "undefined") {
    // Keep track of how many part stocks there are
    // and how many we have looked at
    var numPartStocks = 0;
    var numPartStocksSearched = 0;
}

function isSearchComplete() {
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

        let tables = $(partStockDoc).find("table.dashedTable");
        numPartStocks = tables.length;

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

            if (partStock_poNumber == "") {
                chrome.runtime.sendMessage({ type: "finishedSearch" });
                return false;
            }

            fetch("https://machinesciences.adionsystems.com/procnc/purchaseorders/" + partStock_poNumber).then(res => res.text()).then(html => {
                const poDoc = parser.parseFromString(html, "text/html");

                let poLineInfo = $(poDoc).find("table.poBody tbody tr td table tbody tr");

                if (poLineInfo.length == 0) {
                    chrome.runtime.sendMessage({
                        type: "partStockInfo",
                        po: partStock_poNumber,
                        line: "N/A",
                        arrived: partStock_actualArrived == "" ? "N/R" : partStock_actualArrived,
                        qty: partStock_actualQty == "" ? "N/A" : partStock_actualQty
                    });

                    // Exit this async function
                    return;
                }

                $(poLineInfo).each(function() {
                    let lineWoNumber = $(this).find("td.attValue a");

                    $(lineWoNumber).each(function() {
                        if ($(this).html() == woNumber) {
                            console.log("we found a match");
                            chrome.runtime.sendMessage({
                                type: "partStockInfo",
                                po: partStock_poNumber,
                                line: $(this).parent().siblings().eq(0).text().split(" ")[0],
                                arrived: partStock_actualArrived == "" ? "N/R" : partStock_actualArrived,
                                qty: partStock_actualQty == "" ? "N/A" : partStock_actualQty
                            });
                        }

                        // Exit this async function
                        return;
                    });
                });
            }).then(function() {
                // We need to keep track of this because these fetch() calls are asynchronous
                numPartStocksSearched++;
                isSearchComplete();
            });
        });
    });
}