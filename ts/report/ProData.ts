import * as $ from 'jquery';
import { parseStatusToEnum, PS_Cache, PS_Cache_Filter, PS_Cache_Status } from "./Cache"
import { PS_WorkOrder, PS_WorkOrder_Status } from './WorkOrder';

// Interfaces
export interface PS_Status_Update {
    status?: string
    percent?: number;
}

export interface PS_Update_Options {
    fetchInvoiced?: boolean;
}

// Constants
const MAX_CONCURRENT_REQUESTS: number = 3;
export var BASE_URL: string;

// Global vars
var cache: PS_Cache;
var cache_updateList: string[] = new Array();
var cache_updateIndex: number = 0;
var cache_updateTotal: number = 0;
var statusUpdateCallback: any = undefined;

export function newCache(): void {
    cache = new PS_Cache();

    // Haas and DMU
    buildUpdateList(["query55", "query56", "query57", "query58", "query59"]);
}

export async function loadCache(file: File): Promise<void> {
    cache = new PS_Cache();
    await cache.loadFromFile(file);
    cache.verify();
    signalStatusUpdateCallback({ status: "Imported cache" });
}

export function saveCache(): void {
    if (!cache) {
        console.log("Cache does not exist");
        return;
    }

    cache.updateSaveTimestamp();

    console.log("Saving cache");

    const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cache, null, 2));

    let download = document.createElement("a");
    download.setAttribute("href", data);
    download.setAttribute("download", "cache_" + new Date() + ".pro_cache");
    download.click();
}

export async function buildUpdateList(queries: string[], options?: PS_Update_Options): Promise<void> {
    // Reset related cache vars
    cache_updateList = new Array();
    console.log(new Date());

    // Fetch that data!
    for (let query of queries) {
        console.log("Processing query: " + query);
        signalStatusUpdateCallback({ status: "Running " + query });
        await fetchProShopQuery(query);
    }

    cache_updateTotal = cache_updateList.length;
    cache_updateIndex = 0;

    // Begin updating our cache
    for (let i = 0; i < MAX_CONCURRENT_REQUESTS; i++)
        updateCache();

    cache.updateDataTimestamp();
}

export function fetchProShopQuery(query: string): Promise<boolean> {
    return new Promise(resolve => {
        fetch(BASE_URL + "/procnc/workorders/searchresults$queryScope=global&queryName=" + query + "&pName=workorders").then(res => res.text()).then(html => {
            let parser: DOMParser = new DOMParser();
            let doc: Document = parser.parseFromString(html, "text/html");
    
            let woList: JQuery<HTMLElement> = $(doc).find("table.dataTable tbody tr");

            let temp: number = cache_updateList.length;
    
            $(woList).each(function() {
                let woList_index: string = $(this).find("td:first-of-type > a.htmlTooltip").text();
                let woList_status: PS_WorkOrder_Status = parseStatusToEnum($(this).find("td:nth-of-type(10)").text());
    
                if (!cache.containsWorkOrder(woList_index))
                    cache_updateList.push(woList_index);
                else
                    if (woList_status !== PS_WorkOrder_Status.INVOICED && woList_status !== PS_WorkOrder_Status.COMPLETE &&
                        woList_status !== PS_WorkOrder_Status.CANCELED)
                        cache_updateList.push(woList_index);

                    /*if (cache.containsWorkOrder(woList_index).getStatus() === PS_WorkOrder_Status.ACTIVE ||
                        woList_status === PS_WorkOrder_Status.ACTIVE) 
                        cache_updateList.push(woList_index);*/
            });
    
            console.log("Found " + woList.length + " entries for " + query);
            console.log("Found " + (cache_updateList.length - temp) + " active entries to fetch");
        }).then(() => {
            resolve(true);
        });
    });
}

async function updateCache(): Promise<void> {
    if (!cache_updateList.length)
        return;
    else if (cache_updateList.length === 1) {
        await cache.fetchWorkOrder(cache_updateList.pop());
        console.log(new Date());
    } else {
        await cache.fetchWorkOrder(cache_updateList.pop(), updateCache);
    }

    cache_updateIndex++;
    signalStatusUpdateCallback({
        status: getUpdateRemaining() + " remaining...",
        percent: cache_updateIndex / cache_updateTotal * 100 
    });
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

export function getUpdateRemaining(): number {
    return cache_updateTotal - cache_updateIndex;
}

export function registerStatusUpdateCallback(callback: any) {
    statusUpdateCallback = callback;
}

function signalStatusUpdateCallback(data: PS_Status_Update): void {
    if (statusUpdateCallback !== undefined)
        statusUpdateCallback(data);
}