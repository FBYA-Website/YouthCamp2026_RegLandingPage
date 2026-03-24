# YouthCamp2026

## Google Sheets Database Setup

This project is connected to Google Sheets through a Google Apps Script Web App.

### 1. Create the Google Sheet

1. Create a new Google Sheet.
2. Rename the first sheet to `Youth Registration`.
3. Add two more sheets named:
	- `PastorsMissionaries Registration`
	- `Merch Orders`

### 2. Create the Apps Script backend

1. In your Google Sheet, go to **Extensions > Apps Script**.
2. Replace the default code with the content from [google-apps-script/Code.gs](google-apps-script/Code.gs).
3. Save the project.

### 3. Deploy as Web App

1. Click **Deploy > New deployment**.
2. Select **Web app**.
3. Set:
	- **Execute as**: Me
	- **Who has access**: Anyone
4. Click **Deploy** and copy the generated Web App URL.

### 4. Paste the Web App URL in frontend files

Replace `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` in these files:

- [YouthRegForm.html](YouthRegForm.html)
- [PastorsMissionariesReg.html](PastorsMissionariesReg.html)
- [index.html](index.html)

### 5. Test submissions

1. Open each form in the browser.
2. Submit one test entry per form:
	- Youth Registration
	- Pastors/Missionaries Registration
	- Merch Order
3. Confirm rows are appended in their correct tabs.

## Important Notes

- The forms currently send receipt file name only (not the actual file bytes) to Google Sheets.
- If you need actual receipt file uploads, use Google Drive upload flow in Apps Script and store the Drive link in Sheets.