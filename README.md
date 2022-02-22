# ProShop Helper

*Like Hamburger Helper but better.*

**CAUTION: Project is currently undergoing migration to TypeScript**

This is a Chrome extension that adds additional functionality to the ProShop ERP system. Current features include:

 - [x] Robust work tag generation tailored for raw materials
 - [ ] COTS tag generation
 - [x] Standardized individual file names
 - [x] Automated file formatting over entire purchase orders

# Building

The following commands are executed from the root project directory.

Install the project's dependencies:

`npm install`

Source code can be built by running:

`npm run build`

Then add the plugin to Chrome by navigating to Extensions and enabling Developer Mode. Load the `dist` folder as an unpacked extension.

# Quick Overview

## Work Tag Generation

A "Create Tag" button is added to all Work Order pages within ProShop. Clicking this button will generate a QR code
sheet using available part stock information.

Relevant files: `customButton.ts`, `payload.ts`, `worktag.ts`

## All Parts Scraper

At a high level, the All Parts Scraper navigates to each part within ProShop and records specific data points.
A CSV file is provided to the user when the algorithm is complete.

Relevant files: `partsMenu.ts`

## Standardized File Renaming

Purchase orders now have the option to bulk rename all applicable pack lists to a standard format.
Renaming individial files has also been added to the rename file dialog.

Relevant files: `customPO.ts`, `customRename.ts`

## COTS Tag Generation

Not fully implemented yet.

Relevant files: `customCots.ts`, `cotsMenu.ts`, `cotstag.ts`

# Future Plans
 
Ideas have been discussed such as simplified file uploading and machine generated COTS tags. I plan to have these implemented by the end of Q1 2022.