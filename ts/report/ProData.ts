import * as $ from 'jquery';
import { parseStatusToEnum, PS_Cache, PS_Cache_Filter, PS_Cache_Status } from "./Cache"
import { refreshUI } from './reportMenu';
import { PS_WorkOrder, PS_WorkOrder_Status } from './WorkOrder';

// Constants
const MAX_CONCURRENT_REQUESTS: number = 10;
export var BASE_URL: string;

// Global vars
var cache: PS_Cache;
var cache_updateList: string[] = new Array();
export var cache_updateListLength: number = 0;
export var cache_updateListProgress: number = 0;

export function newCache(): void {
    if (!cache)
        cache = new PS_Cache();

    buildUpdateListAndExecute();
}

export function loadCache(file: File): void {
    cache = new PS_Cache(file);
}

export function saveCache(): void {
    if (!cache) {
        console.log("Cache does not exist");
        return;
    }

    console.log("Saving cache");

    const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cache, null, 2));

    let download = document.createElement("a");
    download.setAttribute("href", data);
    download.setAttribute("download", "cache_" + new Date() + ".pro_cache");
    download.click();

    cache.updateSaveTimestamp();
}

export function buildUpdateListAndExecute(): void {
    // Reset related cache vars
    cache_updateList = new Array();
    cache_updateListLength = 0;
    cache_updateListProgress = 0;

    fetch(BASE_URL + "/procnc/workorders/searchresults$queryScope=global&queryName=query56&pName=workorders").then(res => res.text()).then(html => {
        let parser: DOMParser = new DOMParser();
        let doc: Document = parser.parseFromString(html, "text/html");

        let woList: JQuery<HTMLElement> = $(doc).find("table.dataTable tbody tr");

        $(woList).each(function() {
            let woList_index: string = $(this).find("td:first-of-type > a.htmlTooltip").text();
            let woList_status: PS_WorkOrder_Status = parseStatusToEnum($(this).find("td:nth-of-type(10)").text());

            if (!cache.containsWorkOrder(woList_index))
                cache_updateList.push(woList_index);
            else
                if (cache.containsWorkOrder(woList_index).getStatus() === PS_WorkOrder_Status.ACTIVE ||
                    woList_status === PS_WorkOrder_Status.ACTIVE) 
                    cache_updateList.push(woList_index);
        });

        cache_updateListLength = cache_updateList.length;
    }).then(() => {
        for (var i = 0; i < MAX_CONCURRENT_REQUESTS; i++) 
            updateCache();
    });
}

function updateCache(): void {
    refreshUI();

    let toUpdate: string = cache_updateList.pop();

    if (!toUpdate)
        return;

    cache_updateListProgress++;

    cache.fetchWorkOrder(toUpdate, updateCache);
}

export function setBaseURL(url: string) {
    BASE_URL = url;
}

export function getCacheStatus(): PS_Cache_Status {
    if (!cache)
        return PS_Cache_Status.EMPTY;
    return cache.getStatus();
}

export function getNumberOfEntries(): number {
    return cache.getNumberOfEntries();
}

export function getDataTimestamp(): Date {
    return cache.getDataTimestamp();
}

export function getMatchingWorkOrders(options: PS_Cache_Filter): PS_WorkOrder[] {
    return cache.filter(options);
}