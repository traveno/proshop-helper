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
    enableCloseDialog();
});

$("#cache-new").on("click", function() {

    $("#cache-status").text("Building...");

    ProData.registerStatusUpdateCallback(refreshUI);
    ProData.newCache(["query55", "query56", "query57", "query58", "query59"]);
    enableCloseDialog();
});

$("#cache-save").on("click", function() {
    ProData.saveCache();
    enableCloseDialog();
});

$('#generate-tables').on('click', function() {
    populateTables();
});

$('#fetch-updates').on('click', function() {
    let options: ProData.PS_Update_Options = {
        // Status
        fetchActive: $("#fetch-active").prop("checked"),
        fetchMfgCompelete: $("#fetch-mfgcomplete").prop("checked"),
        fetchShipped: $("#fetch-shipped").prop("checked"),
        fetchOnHold: $("#fetch-onhold").prop("checked"),
        fetchCanceled: $("#fetch-canceled").prop("checked"),
        fetchComplete: $("#fetch-complete").prop("checked"),
        fetchInvoiced: $("#fetch-invoiced").prop("checked"),
        fetchInternal: $("#fetch-internal").prop("checked")
    }

    let depts: string[] = new Array();

    if ($("#fetch-haas").prop("checked"))
        depts.push("query56");
    if ($("#fetch-dmu").prop("checked"))
        depts.push("query55");
    if ($("#fetch-matsuura").prop("checked"))
        depts.push("query58");
    if ($("#fetch-makino").prop("checked"))
        depts.push("query57");
    if ($("#fetch-lathe").prop("checked"))
        depts.push("query59");

    ProData.buildUpdateList(depts, options);
});

export function refreshUI(data: ProData.PS_Status_Update): void {
    $("#fetch-progress-header").text(data.status);
    populateTables();

    // Only run when the last fetch call returns
    if (ProData.getUpdateRemaining() === 0 && data.status) {
        populateTables();
        $("#fetch-progress-header").text("Idle");
        log("Update complete");
    }

    $("#cache-entries").text(ProData.getNumberOfEntries());
    $("#cache-timestamp").text(getSimpleDate(ProData.getDataTimestamp()));

    if (data.percent)
        if (data.percent === 100)
            $("#fetch-progress").css("width", "0%");
        else
            $("#fetch-progress").css("width", data.percent.toString() + "%");

    // Add data to the log
    if (data.log)
        log(data.log);

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

function enableCloseDialog() {
    window.onbeforeunload = event => {
        event.preventDefault();
        event.returnValue = "Sure?";
        return;
    }
}

function log(info: string) {
    let log: JQuery<HTMLFormElement> = $("#logtext");
    log.val($("#logtext").val() + info + "\r\n");
    log.get(0).scrollTop = log.get(0).scrollHeight;
}