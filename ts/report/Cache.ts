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
                    this.workorders.push(new PS_WorkOrder(wo.index, wo.status, wo.routingTable));
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

    async fetchWorkOrder(index: string, callback?: any): Promise<void> {
        // If this already exists in our cache, fetch new data
        let duplicateFinder = this.workorders.find(elem => elem.index === index);
        if (duplicateFinder !== undefined) {
            this.workorders.splice(this.workorders.indexOf(duplicateFinder), 1);
        }

        let wo: PS_WorkOrder = new PS_WorkOrder(index);
        await wo.fetch();


        this.workorders.push(wo);
        console.log(wo);
    
        if (callback)
            callback();
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

function handleFetchErrors(response) {
    if (!response.ok)
        throw Error(response.statusText);
    return response;
}