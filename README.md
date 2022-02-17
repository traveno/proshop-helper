# ProShop Helper

*Like Hamburger Helper but better.*

**CAUTION: Project is currently undergoing migration to TypeScript**

This is a Chrome extension that adds additional functionality to the ProShop ERP system. Current features include:

 - [x] Robust work tag generation tailored for raw materials
 - [ ] COTS tag generation
 - [x] Standardized individual file names
 - [x] Automated file formatting over entire purchase orders

# Building

Building requires a TypeScript installation. A TypeScript transpiler can be installed using Node.js...

`npm install -g typescript`

Source code can be built by running `tsc` in the root directory of the project.

VSCode seems to work best for this type of project.

# Quick Overview

## Work Tag Generation

A "Create Tag" button is added to all Work Order pages within ProShop. Clicking this button will generate a QR code
sheet using available part stock information.

## All Parts Scraper

`partsMenu.js` records specific data points from all parts within ProShop. Everything works, but the data needs to
be routed into a download file for the user. User interface can be accessed from the extension window.

Currently the algorithm is limited to the first 20 parts to avoid overloading the server during testing.

## Standardized File Renaming

Purchase orders now have the option to bulk rename all applicable pack lists to a standard format.
Renaming individial files has also been added to the rename file dialog.

## COTS Tag Generation

Not fully implemented yet.

# Future Plans
 
Ideas have been discussed such as simplified file uploading and machine generated COTS tags. I plan to have these implemented by the end of Q1 2022.