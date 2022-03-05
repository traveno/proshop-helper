import * as $ from 'jquery';
import { PS_Cache, PS_Cache_Filter, PS_Cache_Status } from "./Cache"
import { PS_WorkOrder, PS_WorkOrder_Status } from './WorkOrder';

// Interfaces
export interface PS_Status_Update {
    status?: string;
    log?: string;
    percent?: number;
    disableFetchButton?: boolean;
}

export interface PS_Update_Options {
    // Status
    statuses: PS_WorkOrder_Status[];
    // Department queries for remote fetching
    queries: string[];
    // Machines for matching within cache
    machines: string[];
    // Fetch from ProShop?
    fetchExternal: boolean;
    fetchInternal: boolean;
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

export function newCache(options: PS_Update_Options): void {
    cache = new PS_Cache();
    buildUpdateList(options);
}

export async function loadCache(file: File): Promise<void> {
    cache = new PS_Cache();
    await cache.loadFromFile(file);
    signalStatusUpdateCallback({ log: "Imported cache" });

    if (cache.verify())
        signalStatusUpdateCallback({ log: "Cache passed all checks" });
    else
        signalStatusUpdateCallback({ log: "ERROR: Cache failed integrity test" });
}

export function saveCache(): void {
    if (!cache) {
        console.log("Cache does not exist");
        return;
    }

    cache.updateSaveTimestamp();

    signalStatusUpdateCallback({ log: "Saving cache" });

    const data = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cache));
    const date: Date = new Date();

    let download = document.createElement("a");
    download.setAttribute("href", data);
    download.setAttribute("download", getSaveFileDate() + ".pro_cache");
    download.click();
}

export async function buildUpdateList(options: PS_Update_Options): Promise<void> {
    // Check if cache is initialized
    if (cache === undefined)
        return;

    // Reset related cache vars
    cache_updateList = new Array();

    // Disable fetch button
    signalStatusUpdateCallback({ disableFetchButton: true });

    // Fetch that data!
    if (options.fetchExternal)
        for (let query of options.queries) {
            signalStatusUpdateCallback({ log: "Processing query: " + query });
            await fetchProShopQuery(query, options);
        }

    // Does the user want to also search internal cache?
    if (options.fetchInternal) {
        signalStatusUpdateCallback({ log: "Searching internal cache" });
        // Search for applicable work orders in our cache
        let matches: string[] = cache.getMatchingUpdateCriteria(options);
        for (let s of matches)
            if (!cache_updateList.includes(s))
                 cache_updateList.push(s);

        signalStatusUpdateCallback({ log: "Found " + matches.length + " matching criteria" });
    }    

    cache_updateTotal = cache_updateList.length;
    cache_updateIndex = 0;

    // Begin updating our cache
    for (let i = 0; i < MAX_CONCURRENT_REQUESTS; i++)
        updateCache();

    cache.updateDataTimestamp();
}

export function fetchProShopQuery(query: string, options?: PS_Update_Options): Promise<boolean> {
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
                    if (options.statuses.includes(woList_status))
                        cache_updateList.push(woList_index);

                    /*if (cache.containsWorkOrder(woList_index).getStatus() === PS_WorkOrder_Status.ACTIVE ||
                        woList_status === PS_WorkOrder_Status.ACTIVE) 
                        cache_updateList.push(woList_index);*/
            });
    
            signalStatusUpdateCallback({ log: "Found " + woList.length + " entries for " + query });
            signalStatusUpdateCallback({ log: "Found " + (cache_updateList.length - temp) + " matching criteria" });
        }).then(() => {
            resolve(true);
        });
    });
}

async function updateCache(): Promise<void> {
    if (!cache_updateList.length) {
        // We are done updating, re-enable the fetch button
        signalStatusUpdateCallback({ disableFetchButton: false });
        return;
    } else if (cache_updateList.length === 1) {
        await cache.fetchWorkOrder(cache_updateList.pop());
        console.log(new Date());
    } else {
        await cache.fetchWorkOrder(cache_updateList.pop(), updateCache);
    }

    cache_updateIndex++;
    signalStatusUpdateCallback({
        status: getUpdateRemaining() + " remaining",
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
    // Check if cache is initialized
    if (cache === undefined)
        throw Error("Tried to access uninitialized cache");
    return cache.filter(options);
}

export function isCacheInitialized(): boolean {
    return cache !== undefined;
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

function getSaveFileDate(): string {
    const date = new Date();
    let temp: string = "";

    temp += date.getFullYear()    + "-";
    temp += (date.getMonth() + 1) + "-";
    temp += date.getDate()        + " ";
    temp += date.getHours()       + "-";
    temp += date.getMinutes();

    return temp;
}

function parseStatusToEnum(inputString: string): PS_WorkOrder_Status {
    let inputStringCleaned: string = inputString.trim().toLowerCase();

    if (inputStringCleaned === 'active')
        return PS_WorkOrder_Status.ACTIVE;
    else if (inputStringCleaned === 'cancelled')
        return PS_WorkOrder_Status.CANCELED;
    else if (inputStringCleaned === 'complete')
        return PS_WorkOrder_Status.COMPLETE;
    else if (inputStringCleaned === 'invoiced')
        return PS_WorkOrder_Status.INVOICED;
    else if (inputStringCleaned === 'manufacturing complete')
        return PS_WorkOrder_Status.MANUFACTURING_COMPLETE;
    else if (inputStringCleaned === 'on hold')
        return PS_WorkOrder_Status.ON_HOLD;
    else if (inputStringCleaned === 'shipped')
        return PS_WorkOrder_Status.SHIPPED;
    else 
        return PS_WorkOrder_Status.UNKNOWN;
}