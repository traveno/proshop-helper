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

    let options: ProData.PS_Update_Options = {
        statuses: new Array(),
        queries: new Array(),
        machines: new Array(),
        fetchExternal: $("#fetch-external").prop("checked"),
        fetchInternal: $("#fetch-internal").prop("checked")
    };


    // Status criteria
    if ($("#fetch-active").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.ACTIVE);
    if ($("#fetch-mfgcomplete").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.MANUFACTURING_COMPLETE);
    if ($("#fetch-shipped").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.SHIPPED);
    if ($("#fetch-onhold").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.ON_HOLD);
    if ($("#fetch-canceled").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.CANCELED);
    if ($("#fetch-invoiced").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.INVOICED);
    if ($("#fetch-complete").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.COMPLETE);

    // Department criteria
    if ($("#fetch-haas").prop("checked"))
        options.queries.push("query56");
    if ($("#fetch-dmu").prop("checked"))
        options.queries.push("query55");
    if ($("#fetch-matsuura").prop("checked"))
        options.queries.push("query58");
    if ($("#fetch-makino").prop("checked"))
        options.queries.push("query57");
    if ($("#fetch-lathe").prop("checked"))
        options.queries.push("query59");

    ProData.newCache(options);
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
    // Create our update criteria
    let options: ProData.PS_Update_Options = {
        statuses: new Array(),
        queries: new Array(),
        machines: new Array(),
        fetchExternal: $("#fetch-external").prop("checked"),
        fetchInternal: $("#fetch-internal").prop("checked")
    };

    // Status criteria
    if ($("#fetch-active").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.ACTIVE);
    if ($("#fetch-mfgcomplete").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.MANUFACTURING_COMPLETE);
    if ($("#fetch-shipped").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.SHIPPED);
    if ($("#fetch-onhold").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.ON_HOLD);
    if ($("#fetch-canceled").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.CANCELED);
    if ($("#fetch-invoiced").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.INVOICED);
    if ($("#fetch-complete").prop("checked"))
        options.statuses.push(PS_WorkOrder_Status.COMPLETE);

    // Department criteria
    if ($("#fetch-haas").prop("checked"))
        options.queries.push("query56");
    if ($("#fetch-dmu").prop("checked"))
        options.queries.push("query55");
    if ($("#fetch-matsuura").prop("checked"))
        options.queries.push("query58");
    if ($("#fetch-makino").prop("checked"))
        options.queries.push("query57");
    if ($("#fetch-lathe").prop("checked"))
        options.queries.push("query59");

    // Machine criteria
    if ($("#fetch-haas").prop("checked"))
        options.machines.push("HAAS");
    if ($("#fetch-dmu").prop("checked"))
        options.machines.push("DMU");
    if ($("#fetch-matsuura").prop("checked"))
        options.machines.push("MAM");
    if ($("#fetch-makino").prop("checked"))
        options.machines.push("MAK");
    if ($("#fetch-lathe").prop("checked")) {
        options.machines.push("NL2500");
        options.machines.push("NLX2500");
        options.machines.push("NT1000");
        options.machines.push("NTX2000");
        options.machines.push("L2-20");
    }

    ProData.buildUpdateList(options);
});

export function refreshUI(data: ProData.PS_Status_Update): void {
    $("#fetch-progress-header").text(data.status);
    populateTables();

    if (data.disableFetchButton !== undefined) {
        if (data.disableFetchButton)
            $("#fetch-all").prop("disabled", true);
        else
            $("#fetch-all").prop("disabled", false);
    }

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
    // Check if cache is ready
    if (!ProData.isCacheInitialized())
        return;

    if (clear)
        tableBody.empty();
    for (let i = 1; i <= count; i++) {
        let resource = single ? dept : dept + i.toString();
        tableBody.append(`
        <tr data-toggle="collapse" data-target="#demo` + resource + `" role="button">
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