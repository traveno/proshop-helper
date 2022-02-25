import * as $ from "jquery";

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

var workorderCache: PSWorkOrders = new Array();

$("#cache-input").on("change", function() {
    let reader = new FileReader();
    let file: File = ($(this).get(0) as HTMLInputElement).files[0];

    reader.readAsText(file);

    reader.onloadend = readerEvent => {
        let content: string = readerEvent.target.result as string;

        let parse: PSWorkOrders = JSON.parse(content) as PSWorkOrders;

        for (let index of parse) {
            //console.log(index);
            //console.log(index.status === PSWorkOrder_Status.ACTIVE);
        }    
    }
});

$("#get-data").on("click", function() {
    $("#cache-status").text("BUILDING");

    fetch("https://machinesciences.adionsystems.com/procnc/workorders/searchresults$queryScope=global&queryName=query56&pName=workorders").then(res => res.text()).then(html => {
        let parser: DOMParser = new DOMParser();
        let doc: Document = parser.parseFromString(html, "text/html");

        let woList: JQuery<HTMLElement> = $(doc).find("table.dataTable tbody tr");

        $(woList).each(function() {
            let woList_index: string = $(this).find("td:first-of-type > a.htmlTooltip").text();
            let woList_status: string = $(this).find("td:nth-of-type(10)").text();

            workorderCache.push({ status: woList_status, index: woList_index });
        });
    }).then(() => {
        console.log(workorderCache);
        $("#cache-entries").text(workorderCache.length);
    });
});