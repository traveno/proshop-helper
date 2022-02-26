import * as $ from "jquery";


// Our base ProShop URL
var baseURL = "";

// Global vars
var cache: PSCache = {} as PSCache;

enum PSWorkOrder_Status { ACTIVE = 0, MANUFACTURING_COMPLETE, INVOIVED, CANCELLED }

interface PSWorkOrder {
    status: string,
    index: string,
    //part: string,
    //description: string,
    //customer: string,
}

interface PSWorkOrders extends Array<PSWorkOrder>{};

interface PSCache {
    timestamp: Date,
    workorders: PSWorkOrders,
}


chrome.storage.local.get(["ps_url"], function(result) {
    if (result.ps_url != undefined)
        baseURL = result.ps_url;
});



$("#cache-input").on("change", function() {
    let reader = new FileReader();
    let file: File = ($(this).get(0) as HTMLInputElement).files[0];

    reader.readAsText(file);

    reader.onloadend = readerEvent => {
        let content: string = readerEvent.target.result as string;

        let parse: PSCache = JSON.parse(content) as PSCache;


        cache = parse;
        console.log(parse);  
    }
});

$("#get-data").on("click", function() {
    $("#cache-status").text("BUILDING");

    fetch(baseURL + "/procnc/workorders/searchresults$queryScope=global&queryName=query56&pName=workorders").then(res => res.text()).then(html => {
        let parser: DOMParser = new DOMParser();
        let doc: Document = parser.parseFromString(html, "text/html");

        let woList: JQuery<HTMLElement> = $(doc).find("table.dataTable tbody tr");

        cache.timestamp = new Date();
        cache.workorders = new Array();

        $(woList).each(function() {
            let woList_index: string = $(this).find("td:first-of-type > a.htmlTooltip").text();
            let woList_status: string = $(this).find("td:nth-of-type(10)").text();

            cache.workorders.push({
                status: woList_status, 
                index: woList_index 
            });
        });
    }).then(() => {
        console.log(cache);
        $("#cache-entries").text(cache.workorders.length);
    });
});

$("#cache_save").on("click", function() {
    if (cache.timestamp == undefined) {
        console.log("undefined")
        return;
    }

    const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cache));

    let downloadButton = document.createElement("a");
    downloadButton.setAttribute("href", data);
    downloadButton.setAttribute("download", "cache_" + new Date() + ".pro_cache");
    downloadButton.click();
});