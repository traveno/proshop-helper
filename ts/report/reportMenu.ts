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

    ProData.loadCache(file);
    ProData.registerStatusUpdateCallback(refreshUI);
});

$("#cache-new").on("click", function() {

    $("#cache-status").text("Building...");

    ProData.newCache();
});

$("#cache-save").on("click", function() {
    ProData.saveCache();
});

$('#generate-tables').on('click', function() {
    populateTables();
});

$('#fetch-all').on('click', function() {
    // Haas and DM
    ProData.buildUpdateList(["query56", "query55"]);
});

export function refreshUI(data: ProData.PS_Status_Update): void {
    if (ProData.getUpdateRemaining() === 0) {
        populateTables();
    }

    $("#cache-entries").text(ProData.getNumberOfEntries());
    $("#cache-timestamp").text(ProData.getDataTimestamp().toString().split("GMT")[0]);

    $("#fetch-progress").css("width",  + "100%");
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
    $('#table-haas').find('tbody').empty();
    for (let i = 1; i <= 7; i++) {
        $('#table-haas').find('tbody').append(`
        <tr>
            <th scope="row">HAAS` + i + `</th>
            <td>` + ProData.getMatchingWorkOrders({ op60Resource: "HAAS" + i, status: PS_WorkOrder_Status.ACTIVE }).length + `</td>
            <td>` + ProData.getMatchingWorkOrders({ op60Resource: "HAAS" + i, status: PS_WorkOrder_Status.COMPLETE }).length + `</td>
            <td>` + ProData.getMatchingWorkOrders({ op60Resource: "HAAS" + i, status: PS_WorkOrder_Status.MANUFACTURING_COMPLETE }).length + `</td>
            <td>` + ProData.getMatchingWorkOrders({ op60Resource: "HAAS" + i, status: PS_WorkOrder_Status.SHIPPED }).length + `</td>
            <td>` + ProData.getMatchingWorkOrders({ op60Resource: "HAAS" + i, status: PS_WorkOrder_Status.INVOICED }).length + `</td>
        </tr>
        `)
    }

    $('#table-haas').find('tbody').append(`
        <tr>
            <th scope="row">ROBO</th>
            <td>` + ProData.getMatchingWorkOrders({ op60Resource: "ROBO", status: PS_WorkOrder_Status.ACTIVE }).length + `</td>
            <td>` + ProData.getMatchingWorkOrders({ op60Resource: "ROBO", status: PS_WorkOrder_Status.COMPLETE }).length + `</td>
            <td>` + ProData.getMatchingWorkOrders({ op60Resource: "ROBO", status: PS_WorkOrder_Status.MANUFACTURING_COMPLETE }).length + `</td>
            <td>` + ProData.getMatchingWorkOrders({ op60Resource: "ROBO", status: PS_WorkOrder_Status.SHIPPED }).length + `</td>
            <td>` + ProData.getMatchingWorkOrders({ op60Resource: "ROBO", status: PS_WorkOrder_Status.INVOICED }).length + `</td>
        </tr>
    `)
}