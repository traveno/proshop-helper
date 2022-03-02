import * as $ from "jquery";
import "bootstrap";

import { PS_Cache_Status } from "./Cache";
import * as ProData from "./ProData";
import { PS_WorkOrder_Status } from "./WorkOrder";


chrome.storage.local.get(["ps_url"], function(result) {
    if (result.ps_url != undefined)
        ProData.setBaseURL(result.ps_url);
});

$("#cache-input").on("change", function() {
    let reader = new FileReader();
    let file: File = ($(this).get(0) as HTMLInputElement).files[0];

    ProData.registerStatusUpdateCallback(refreshUI);
    ProData.loadCache(file);
});

$("#cache-new").on("click", function() {

    $("#cache-status").text("Building...");

    ProData.registerStatusUpdateCallback(refreshUI);
    ProData.newCache();
});

$("#cache-save").on("click", function() {
    ProData.saveCache();
});

$('#generate-tables').on('click', function() {
    populateTables();
});

$('#fetch-updates').on('click', function() {
    let options: ProData.PS_Update_Options = {
        fetchInvoiced: $("#fetch-invoiced").prop("checked")
    }

    // All departments
    ProData.buildUpdateList(["query55", "query56", "query57", "query58", "query59"], options);
});

export function refreshUI(data: ProData.PS_Status_Update): void {
    if (ProData.getUpdateRemaining() === 0) {
        populateTables();
    }

    $("#cache-entries").text(ProData.getNumberOfEntries());

    $("#cache-timestamp").text(getSimpleDate(ProData.getDataTimestamp()));

    if (data.percent)
        $("#fetch-progress").css("width", data.percent.toString() + "%");
        
    $("#fetch-progress-header").text(data.status);

    let cacheStatus = ProData.getCacheStatus();
    if      (cacheStatus === PS_Cache_Status.EMPTY)
        $("#cache-status").text("Empty");
    else if (cacheStatus === PS_Cache_Status.OUTDATED)
        $("#cache-status").text("Outdated");
    else if (cacheStatus === PS_Cache_Status.UNSAVED_CHANGES)
        $("#cache-status").text("Unsaved Changes");
    else if (cacheStatus === PS_Cache_Status.OK)
        $("#cache-status").text("OK");
    else if (cacheStatus === PS_Cache_Status.ERROR)
        $("#cache-status").text("ERROR");
    else
        $("#cache-status").text("UNKNOWN");
}

function populateTables(): void {
    deptDataToTable($('#table-haas').find('tbody'), "HAAS", 7);
    deptDataToTable($('#table-haas').find('tbody'), "ROBO", 1, false, true);

    deptDataToTable($('#table-dmu').find('tbody'), "DMU", 4);

    deptDataToTable($('#table-makino').find('tbody'), "MAK", 7)

    deptDataToTable($('#table-matsuura').find('tbody'), "MAM", 3)

    deptDataToTable($('#table-lathe').find('tbody'), "NL2500",  1, true,  true)
    deptDataToTable($('#table-lathe').find('tbody'), "NLX2500", 1, false, true)
    deptDataToTable($('#table-lathe').find('tbody'), "NT1000",  1, false, true)
    deptDataToTable($('#table-lathe').find('tbody'), "NTX2000", 1, false, true)
    deptDataToTable($('#table-lathe').find('tbody'), "L2-20",   1, false, true)
}

function deptDataToTable(tableBody: JQuery<HTMLElement>, dept: string, count: number, clear: boolean = true, single: boolean = false): void {
    if (clear)
        tableBody.empty();
    for (let i = 1; i <= count; i++) {
        let resource = single ? dept : dept + i.toString();
        tableBody.append(`
        <tr>
            <th scope="row">` + resource + `</th>
            <td>` + ProData.getMatchingWorkOrders({ resource: resource, status: PS_WorkOrder_Status.ACTIVE }).length + `</td>
            <td>` + ProData.getMatchingWorkOrders({ resource: resource, status: PS_WorkOrder_Status.COMPLETE }).length + `</td>
            <td>` + ProData.getMatchingWorkOrders({ resource: resource, status: PS_WorkOrder_Status.MANUFACTURING_COMPLETE }).length + `</td>
            <td>` + ProData.getMatchingWorkOrders({ resource: resource, status: PS_WorkOrder_Status.SHIPPED }).length + `</td>
            <td>` + ProData.getMatchingWorkOrders({ resource: resource, status: PS_WorkOrder_Status.INVOICED }).length + `</td>
        </tr>
        `)
    }
}

function getSimpleDate(time: Date): string {
    let temp: string = "";

    temp += (time.getMonth() + 1) + "/";
    temp +=  time.getDate()       + "/";
    temp +=  time.getFullYear()   + " ";
    temp +=  time.getHours()      + ":";
    temp +=  time.getMinutes();

    return temp;
}

window.onbeforeunload = event => {
    event.preventDefault();
    event.returnValue = "Sure?";
    return;
}