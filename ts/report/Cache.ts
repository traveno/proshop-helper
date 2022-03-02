import * as $ from 'jquery';
import { PS_WorkOrder, PS_WorkOrder_OpRows, PS_WorkOrder_OpRow, PS_WorkOrder_Status } from './WorkOrder';
import { BASE_URL, PS_Update_Options } from './ProData';

export enum PS_Cache_Status { EMPTY = 0, OUTDATED, OK, ERROR, UNSAVED_CHANGES }

export interface PS_Cache_Filter {
    resource?: string,
    status?: PS_WorkOrder_Status
    upToOp?: number
}

export class PS_Cache {
    private timestamp_data: Date;
    private timestamp_save: Date;
    private workorders: PS_WorkOrder[] = new Array();;

    constructor() {
        this.timestamp_data = new Date();
        this.workorders = new Array();
    }

    loadFromFile(initFile: File): Promise<void> {
        return new Promise(resolve => {
            let reader = new FileReader();
            reader.readAsText(initFile);

            reader.onloadend = event => {
                let content: string = event.target.result as string;
                let parse: any = JSON.parse(content);

                // Copy timestamps from file
                this.timestamp_data = new Date(parse.timestamp_data);
                this.timestamp_save = new Date(parse.timestamp_save);

                // Bring in all work orders from file
                for (let wo of parse.workorders) {
                    this.workorders.push(new PS_WorkOrder(wo));
                }
                resolve();
            }
        });
    }

    getStatus(): PS_Cache_Status {
        if (this.timestamp_data === undefined)
            return PS_Cache_Status.EMPTY;
        else if (this.timestamp_data.getDate() != new Date().getDate())
            return PS_Cache_Status.OUTDATED;
        else if (this.timestamp_data > this.timestamp_save)
            return PS_Cache_Status.UNSAVED_CHANGES;
        else if (this.timestamp_data.getDate() === new Date().getDate())
            return PS_Cache_Status.OK
        else
            return PS_Cache_Status.ERROR;
    }

    getMatchingUpdateCriteria(options: PS_Update_Options): string[] {
        let temp: string[] = new Array();

        for (let wo of this.workorders) {
            if (wo.matchesUpdateCriteria(options))
                temp.push(wo.index);
        }
        
        return temp;
    }

    getDataTimestamp(): Date {
        return this.timestamp_data;
    }

    getNumberOfEntries(): number {
        return this.workorders.length;
    }

    updateDataTimestamp(): void {
        this.timestamp_data = new Date();
    }

    updateSaveTimestamp(): void {
        this.timestamp_save = new Date();
    }

    containsWorkOrder(index: string) {
        return this.workorders.find(elem => elem.index === index);
    }

    filter(options: PS_Cache_Filter): PS_WorkOrder[] {
        let temp: PS_WorkOrder[] = new Array();
        
        // We begin
        for (let wo of this.workorders) {
            // Filter by work order status if defined
            if (options.status !== undefined) 
                if (wo.status !== options.status) 
                    continue;
               
            // Filter by machine resource (op60) if defined
            if (options.resource !== undefined)
                if (!wo.containsResource(options.resource))
                    continue;

            temp.push(wo);
        }
        return temp;
    }

    fetchWorkOrder(index: string, callback?: any): Promise<void> {
        return new Promise(resolve => {
            if (index === undefined) {
                console.log("null index");
                resolve();
            }

            fetch(BASE_URL + "/procnc/workorders/" + index).then(handleFetchErrors).then(res => res.text()).then(html => {
                let parser: DOMParser = new DOMParser();
                let doc: Document = parser.parseFromString(html, "text/html");
    
                let wo_Status: string = $(doc).find("#horizontalMainAtts_status_value").text();
                let opTable: JQuery<HTMLElement> = $(doc).find("table.proshop-table").eq(5);
    
                let wo: PS_WorkOrder = new PS_WorkOrder({
                    index: index,
                    status: parseStatusToEnum(wo_Status),
                    opTable: processOpTable(opTable)
                });
    
                // If this already exists in our cache, delete old and insert new
                let duplicateFinder = this.workorders.find(elem => elem.index === wo.index);
                if (duplicateFinder !== undefined) 
                    this.workorders.splice(this.workorders.indexOf(duplicateFinder), 1);
    
                this.workorders.push(wo);
                console.log(wo);
            }).then(() => {
                if (callback)
                    callback();
                resolve();
            }).catch(error => {
                console.log(error); 
            });
        });
    }

    verify(): boolean {
        console.log("Check for duplicates...");
        for (let wo of this.workorders) {
            for (let test of this.workorders) {
                if (this.workorders.indexOf(wo) !== this.workorders.indexOf(test) &&
                    wo == test) {
                    console.log("I found a duplicate! Invalid cache");
                    return false;
                }
            }
        }

        console.log("All checks passed!");
        return true;
    }
}

function processOpTable(table: JQuery<HTMLElement>): PS_WorkOrder_OpRows {
    let tableRows: JQuery<HTMLElement> = $(table).find("tbody tr");
    let result: PS_WorkOrder_OpRows = new Array();

    $(tableRows).each(function() {
        let rowOp: string = $(this).find("td:first-of-type > a").text();
        let rowDesc: string = $(this).find("td:nth-of-type(2)").text();
        let rowResource: string = $(this).find("td:nth-of-type(3)").text()
        let rowComplete: boolean = $(this).find("td:nth-of-type(10) span").hasClass("glyphicon-ok");
        let rowCompleteDate: Date = undefined;

        if (rowComplete) {
            let temp: string = $(this).find("td:nth-of-type(10) span").attr("title");

            let month: number = parseInt(temp.split("/")[0].slice(-2));
            let day: number = parseInt(temp.split("/")[1]);
            let year: number = parseInt(temp.split("/")[2].slice(0, 4));
            let hour: number = parseInt(temp.split(":")[1].slice(-2));

            // Convert 12hr to 24hr
            if (temp.split(";")[1].slice(-2) === "PM" && hour !== 12)
                hour += 12;

            let minute: number = parseInt(temp.split(":")[2]);
            let second: number = parseInt(temp.split(":")[3].slice(0, 2));

            rowCompleteDate = new Date(year, month - 1, day, hour, minute, second);
        }

        let temp: PS_WorkOrder_OpRow = {
            op: rowOp,
            opDesc: rowDesc,
            resource: rowResource,
            complete: rowComplete,
            completeDate: rowCompleteDate
        }
        
        result.push(temp);
    });

    return result;
}

export function parseStatusToEnum(inputString: string): PS_WorkOrder_Status {
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


function handleFetchErrors(response) {
    if (!response.ok)
        throw Error(response.statusText);
    return response;
}