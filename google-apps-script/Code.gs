const SHEET_NAME_MAP = {
  youth_registration: 'Youth Registration',
  pastors_missionaries_registration: 'PastorsMissionaries Registration',
  merch_order: 'Merch Orders'
};

// Shared folder for both registration forms (youth + pastors/missionaries)
const REGISTRATION_RECEIPT_FOLDER_ID = '1P5Br2tmeyfV1qzY452gmMwfRlNnUnyfP';
// Separate folder for merch receipts
const MERCH_RECEIPT_FOLDER_ID = '1976HmVgVLZTta-Kvt6nh5ieL3uOLfA2X';

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const formType = String(payload.formType || '').trim();
    if (!formType) {
      throw new Error('Missing formType in payload.');
    }

    const sheetName = SHEET_NAME_MAP[formType] || String(payload.targetSheet || 'Submissions').trim();
    const sheet = getOrCreateSheet_(sheetName);
    appendSubmission_(sheet, formType, payload);

    return jsonResponse_({ ok: true, sheet: sheetName });
  } catch (err) {
    return jsonResponse_({ ok: false, error: err.message });
  }
}

function doGet() {
  return jsonResponse_({
    ok: true,
    message: 'YouthCamp2026 Google Sheets endpoint is running.'
  });
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('No request body received.');
  }

  const raw = e.postData.contents;
  let payload;

  try {
    payload = JSON.parse(raw);
  } catch (jsonErr) {
    const maybePayload = (e.parameter && e.parameter.payload) ? e.parameter.payload : '';
    if (!maybePayload) {
      throw new Error('Invalid JSON payload.');
    }
    payload = JSON.parse(maybePayload);
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a JSON object.');
  }

  return payload;
}

function getOrCreateSheet_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function appendSubmission_(sheet, formType, payload) {
  if (formType === 'youth_registration') {
    const headers = [
      'submittedAt',
      'churchName',
      'pastorName',
      'churchAddress',
      'delegationHeadName',
      'delegationHeadEmail',
      'totalDelegates',
      'totalFee',
      'paymentMethod',
      'referenceNo',
      'amountPaid',
      'paymentDate',
      'accountName',
      'receiptLink',
      'delegateNo',
      'firstName',
      'middleName',
      'lastName',
      'nickname',
      'gender',
      'birthDate',
      'education',
      'contact',
      'email',
      'emergencyContact',
      'emergencyNumber',
      'ministry',
      'accommodation',
      'firstTime'
    ];
    ensureHeader_(sheet, headers);

    const summary = payload.summary || {};
    const payment = payload.payment || {};
    const receiptLink = saveReceiptToDrive_(payment, formType);
    const delegates = payload.delegates || [];

    // Shared columns repeated on every delegate row
    const sharedCols = [
      payload.submittedAt || new Date().toISOString(),
      payload.churchName || '',
      payload.pastorName || '',
      payload.churchAddress || '',
      payload.delegationHeadName || '',
      payload.delegationHeadEmail || '',
      Number(summary.total || 0),
      Number(summary.totalFee || 0),
      payment.method || '',
      payment.referenceNo || '',
      Number(payment.amountPaid || 0),
      payment.paymentDate || '',
      payment.accountName || '',
      receiptLink || payment.receiptFileName || ''
    ];

    // One row per delegate
    delegates.forEach(function(d, i) {
      const row = sharedCols.concat([
        i + 1,
        d.firstName || '',
        d.middleName || '',
        d.lastName || '',
        d.nickname || '',
        d.gender || '',
        d.birthDate || '',
        d.education || '',
        d.contact || '',
        d.email || '',
        d.emergency || '',
        d.emergencyNum || '',
        d.ministry || '',
        d.accommodation || '',
        d.firstTime || ''
      ]);
      sheet.appendRow(row);
    });
    return;
  }

  if (formType === 'pastors_missionaries_registration') {
    const headers = [
      'submittedAt',
      'role',
      'firstName',
      'middleName',
      'lastName',
      'gender',
      'birthDate',
      'civilStatus',
      'contactNumber',
      'email',
      'emergencyContactPerson',
      'emergencyContactNumber',
      'homeAddress',
      'churchName',
      'churchAddress',
      'yearsInMinistry',
      'ministryInterest',
      'paymentMethod',
      'referenceNo',
      'amountPaid',
      'paymentDate',
      'accountName',
      'receiptLink'
    ];
    ensureHeader_(sheet, headers);

    const personal = payload.personalInfo || {};
    const church = payload.churchInfo || {};
    const payment = payload.payment || {};
    const receiptLink = saveReceiptToDrive_(payment, formType);
    const row = [
      payload.submittedAt || new Date().toISOString(),
      payload.role || '',
      personal.firstName || '',
      personal.middleName || '',
      personal.lastName || '',
      personal.gender || '',
      personal.birthDate || '',
      personal.civilStatus || '',
      personal.contactNumber || '',
      personal.email || '',
      personal.emergencyContactPerson || '',
      personal.emergencyContactNumber || '',
      personal.homeAddress || '',
      church.churchName || '',
      church.churchAddress || '',
      church.yearsInMinistry || '',
      church.ministryInterest || '',
      payment.method || '',
      payment.referenceNo || '',
      Number(payment.amountPaid || 0),
      payment.paymentDate || '',
      payment.accountName || '',
      receiptLink || payment.receiptFileName || ''
    ];
    sheet.appendRow(row);
    return;
  }

  if (formType === 'merch_order') {
    const headers = [
      'submittedAt',
      'firstName',
      'lastName',
      'churchName',
      'facebookLink',
      'quantity',
      'size',
      'unitPrice',
      'totalAmount',
      'receiptLink'
    ];
    ensureHeader_(sheet, headers);

    const receiptLink = saveReceiptToDrive_(payload, formType);

    const row = [
      payload.submittedAt || new Date().toISOString(),
      payload.firstName || '',
      payload.lastName || '',
      payload.churchName || '',
      payload.facebookLink || '',
      Number(payload.quantity || 0),
      payload.size || '',
      Number(payload.unitPrice || 0),
      Number(payload.totalAmount || 0),
      receiptLink || payload.receiptFileName || ''
    ];
    sheet.appendRow(row);
    return;
  }

  const headers = ['submittedAt', 'formType', 'rawJson'];
  ensureHeader_(sheet, headers);
  sheet.appendRow([
    payload.submittedAt || new Date().toISOString(),
    formType,
    JSON.stringify(payload)
  ]);
}

function ensureHeader_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
}

function saveReceiptToDrive_(source, formType) {
  const base64Data = source && source.receiptFileBase64 ? String(source.receiptFileBase64) : '';
  if (!base64Data) {
    return '';
  }

  if (base64Data.length > 5 * 1024 * 1024) {
    throw new Error('Receipt file is too large. Please upload an image under 3MB.');
  }

  const mimeType = source && source.receiptMimeType ? String(source.receiptMimeType) : 'application/octet-stream';
  const fileName = source && source.receiptFileName ? String(source.receiptFileName) : 'receipt';

  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  const folder = getReceiptFolder_(formType);
  const file = folder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (sharingErr) {
    Logger.log('Could not set sharing: ' + sharingErr.message);
  }
  return file.getUrl();
}

function getReceiptFolder_(formType) {
  const isMerch = String(formType || '').trim() === 'merch_order';
  const scriptProperties = PropertiesService.getScriptProperties();

  // Optional Script Properties overrides:
  // - RECEIPT_FOLDER_ID_REGISTRATION
  // - RECEIPT_FOLDER_ID_MERCH
  const configuredId = isMerch
    ? (scriptProperties.getProperty('RECEIPT_FOLDER_ID_MERCH') || MERCH_RECEIPT_FOLDER_ID)
    : (scriptProperties.getProperty('RECEIPT_FOLDER_ID_REGISTRATION') || REGISTRATION_RECEIPT_FOLDER_ID);

  if (!configuredId || configuredId.indexOf('PASTE_YOUR_') === 0) {
    return DriveApp.getRootFolder();
  }
  return DriveApp.getFolderById(configuredId);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function testDriveAccess() {
  const folder = getReceiptFolder_('youth_registration');
  const testBlob = Utilities.newBlob('test', 'text/plain', 'auth_test.txt');
  const file = folder.createFile(testBlob);
  file.setTrashed(true);
  Logger.log('Drive write access confirmed: ' + folder.getName());
}

function testMerchDriveAccess() {
  const folder = getReceiptFolder_('merch_order');
  const testBlob = Utilities.newBlob('test', 'text/plain', 'auth_test_merch.txt');
  const file = folder.createFile(testBlob);
  file.setTrashed(true);
  Logger.log('Merch drive write access confirmed: ' + folder.getName());
}