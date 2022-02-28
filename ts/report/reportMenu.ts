import * as $ from "jquery";
import "bootstrap";

import { PS_Cache_Status } from "./Cache";
import { setBaseURL, loadCache, saveCache, newCache, cache_updateListProgress, cache_updateListLength, getCacheStatus, getMatchingWorkOrders, buildUpdateListAndExecute, getNumberOfEntries, getDataTimestamp } from "./ProData";
import { PS_WorkOrder_Status } from "./WorkOrder";


chrome.storage.local.get(["ps_url"], function(result) {
    if (result.ps_url != undefined)
        setBaseURL(result.ps_url);
});

$("#cache-input").on("change", function() {
    let reader = new FileReader();
    let file: File = ($(this).get(0) as HTMLInputElement).files[0];

    loadCache(file); 
});

$("#cache-new").on("click", function() {

    $("#cache-status").text("Building...");

    newCache();
});

$("#cache-save").on("click", function() {
    saveCache();
});

$('#generate-tables').on('click', function() {
    populateTables();
});

$('#fetch-all').on('click', function() {
    buildUpdateListAndExecute();
});

export function refreshUI(): void {
    let percentageDone: number = (cache_updateListProgress / cache_updateListLength) * 100;
    if (percentageDone === 100) {
        populateTables();
    }

    $("#cache-entries").text(getNumberOfEntries());
    $("#cache-timestamp").text(getDataTimestamp().toString().split("GMT")[0]);

    $("#fetch-progress").css("width", percentageDone + "%");
    $("#fetch-progress-header").text(cache_updateListProgress + " processed out of " + cache_updateListLength);

    let cacheStatus = getCacheStatus();
    if      (cacheStatus === PS_Cache_Status.EMPTY)
        $("#cache-status").text("Empty");
    else if (cacheStatus === PS_Cache_Status.OUTDATED)
        $("#cache-status").text("Outdated");
    else if (cacheStatus === PS_Cache_Status.UNSAVED_CHANGES)
        $("#cache-status").text("Unsaved Changes");
    else if (cacheStatus === PS_Cache_Status.OK)
        $("#cache-status").text(PS_Cache_Status.OK);
    else if (cacheStatus === PS_Cache_Status.ERROR)
        $("#cache-status").text("ERROR");
    else
        $("#cache-status").text("UNKNOWN");
}

function populateTables(): void {
    $('#table-haas').find('tbody').empty();
    for (let i = 1; i <= 7; i++) {
        $('#table-haas').find('tbody').append(`
        <tr>
            <th scope="row">HAAS` + i + `</th>
            <td>` + getMatchingWorkOrders({ op60Resource: "HAAS" + i, status: PS_WorkOrder_Status.ACTIVE }).length + `</td>
            <td>` + getMatchingWorkOrders({ op60Resource: "HAAS" + i, status: PS_WorkOrder_Status.COMPLETE }).length + `</td>
            <td>` + getMatchingWorkOrders({ op60Resource: "HAAS" + i, status: PS_WorkOrder_Status.MANUFACTURING_COMPLETE }).length + `</td>
            <td>` + getMatchingWorkOrders({ op60Resource: "HAAS" + i, status: PS_WorkOrder_Status.SHIPPED }).length + `</td>
            <td>` + getMatchingWorkOrders({ op60Resource: "HAAS" + i, status: PS_WorkOrder_Status.INVOICED }).length + `</td>
        </tr>
        `)
    }

    $('#table-haas').find('tbody').append(`
        <tr>
            <th scope="row">ROBO</th>
            <td>` + getMatchingWorkOrders({ op60Resource: "ROBO", status: PS_WorkOrder_Status.ACTIVE }).length + `</td>
            <td>` + getMatchingWorkOrders({ op60Resource: "ROBO", status: PS_WorkOrder_Status.COMPLETE }).length + `</td>
            <td>` + getMatchingWorkOrders({ op60Resource: "ROBO", status: PS_WorkOrder_Status.MANUFACTURING_COMPLETE }).length + `</td>
            <td>` + getMatchingWorkOrders({ op60Resource: "ROBO", status: PS_WorkOrder_Status.SHIPPED }).length + `</td>
            <td>` + getMatchingWorkOrders({ op60Resource: "ROBO", status: PS_WorkOrder_Status.INVOICED }).length + `</td>
        </tr>
    `)
}