import { PS_Update_Options } from "./ProData";

export enum PS_WorkOrder_Status { ACTIVE = 0, CANCELED, COMPLETE, INVOICED, MANUFACTURING_COMPLETE, ON_HOLD, SHIPPED, UNKNOWN }

export interface PS_WorkOrder_OpRows extends Array<PS_WorkOrder_OpRow>{};
export interface PS_WorkOrder_OpRow {
    op: string,
    opDesc: string,
    resource: string,
    complete: boolean,
    completeDate?: Date;

}

export class PS_WorkOrder {
    index: string;
    status: PS_WorkOrder_Status;
    opTable: PS_WorkOrder_OpRows;

    constructor(copy?: PS_WorkOrder) {
        if (copy) {
            this.index = copy.index;
            this.status = copy.status;
            this.opTable = new Array();

            for (let row of copy.opTable) {
                this.opTable.push({
                    op: row.op,
                    opDesc: row.opDesc,
                    resource: row.resource,
                    complete: row.complete,
                    completeDate: row.completeDate !== undefined ? new Date(row.completeDate) : undefined
                });
            }
        }
    }

    processOpTable(table: JQuery<HTMLElement>): PS_WorkOrder_OpRows {
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

    matchesUpdateCriteria(options: PS_Update_Options): boolean {
        if (!options.statuses.includes(this.status))
            return false;

        for (let row of this.opTable) 
            for (let machine of options.machines) {
                if (row.resource.slice(0, machine.length).toLowerCase() === machine.toLocaleLowerCase())
                    return true;
            }
        return false;
    }

    // Return first op row that matches op code
    getOpTableRow(opCode: string): PS_WorkOrder_OpRow {
        return this.opTable.find(elem => elem.op === opCode);
    }

    containsResource(resource: string): boolean {
        for (let row of this.opTable) {
            if (row.resource.toLowerCase() === resource.trim().toLowerCase())
                return true;
        }
        return false;
    }

    getStatus(): PS_WorkOrder_Status {
        return this.status;
    }

    setStatusFromString(inputString: string): boolean {
        let inputStringCleaned: string = inputString.trim().toLowerCase();

        if (inputStringCleaned === 'active')
            this.status = PS_WorkOrder_Status.ACTIVE;
        else if (inputStringCleaned === 'canceled')
            this.status = PS_WorkOrder_Status.CANCELED;
        else if (inputStringCleaned === 'complete')
            this.status = PS_WorkOrder_Status.COMPLETE;
        else if (inputStringCleaned === 'invoiced')
            this.status = PS_WorkOrder_Status.INVOICED;
        else if (inputStringCleaned === 'manufacturing complete')
            this.status = PS_WorkOrder_Status.MANUFACTURING_COMPLETE;
        else if (inputStringCleaned === 'on hold')
            this.status = PS_WorkOrder_Status.ON_HOLD;
        else if (inputStringCleaned === 'shipped')
            this.status = PS_WorkOrder_Status.SHIPPED;
        else {
            this.status = PS_WorkOrder_Status.UNKNOWN;
            return false;
        }

        return true;
    }
}