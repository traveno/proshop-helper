# ProShop Helper

*Like Hamburger Helper but better.*

This is a chrome extension that adds additional functionality to the ProShop ERP system. Current features include:

 - [x] Robust work tag generation tailored for raw materials
 - [ ] COTS tag generation
 - [x] Standardized individual file names
 - [x] Automated file formatting over entire purchase orders

# Quick Overview

* payload.js -- this is the code that is injected into a work order page and will scrape necessary data to send to worktag.js
* worktag.js -- responsible for receiving data from payload.js and filling out worktag.html
* worktag.html -- template file for work order tags
* customButton.html -- this html button is injected onto a work order page
* customButton.js -- executes on work order pages and adds our user interface (customButton.html)
* manifest.json -- chrome manifest file that defines how and where this plugin works

# Future Plans
 
Ideas have been discussed such as simplified file uploading and machine generated COTS tags. I plan to have these implemented by the end of Q1 2022.