/**
 * Founders & Builders — platform backend
 * Google Apps Script Web App that uses a Google Sheet as the datastore.
 * One deployment serves every hub (Profiles, Businesses, …), routed by
 * a `type` query/body param. Omitting `type` defaults to "profile" so
 * existing calls from the Member Profiles hub keep working unchanged.
 *
 * SETUP (one time):
 *   1. Open your Google Sheet.
 *   2. Extensions → Apps Script. Delete any code, paste ALL of this file.
 *   3. Click Deploy → New deployment → type "Web app".
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4. Copy the Web app URL (ends in /exec).
 *   5. Paste that URL into config.js (used by every hub).
 *
 * Each sheet tab and its header row are created automatically on first use.
 * To re-deploy after editing: Deploy → Manage deployments → Edit → Version: New.
 * (Existing deployment URLs stay the same after a new version.)
 */

// type -> { sheet name, column order, fields required to accept a submission }
var ENTITIES = {
  profile: {
    sheetName: 'Profiles',
    headers: [
      'id', 'timestamp', 'name', 'building', 'business', 'stage', 'products',
      'skills', 'industry', 'location', 'email', 'website', 'linkedin', 'github',
      'x', 'portfolio', 'bio', 'goals', 'lookingFor', 'canHelp',
      'mentor', 'investor', 'podcast', 'speaker', 'volunteer'
    ],
    required: ['name', 'email']
  },
  business: {
    sheetName: 'Businesses',
    headers: [
      'id', 'timestamp', 'name', 'category', 'logo', 'description', 'website',
      'industry', 'team', 'products', 'services', 'hiring', 'email',
      'linkedin', 'x', 'instagram'
    ],
    required: ['name', 'email']
  },
  listing: {
    sheetName: 'Listings',
    headers: [
      'id', 'timestamp', 'name', 'category', 'description', 'pricing',
      'image', 'demo', 'website', 'email'
    ],
    required: ['name', 'email']
  },
  job: {
    sheetName: 'Jobs',
    headers: [
      'id', 'timestamp', 'title', 'company', 'category', 'location', 'remote',
      'compensation', 'description', 'applyLink', 'email'
    ],
    required: ['title', 'email']
  },
  mentor: {
    sheetName: 'Mentors',
    headers: [
      'id', 'timestamp', 'name', 'title', 'company', 'industry', 'expertise',
      'stages', 'experience', 'availability', 'officeHours', 'bio', 'email',
      'linkedin', 'website'
    ],
    required: ['name', 'email']
  },
  help: {
    sheetName: 'Help',
    headers: [
      'id', 'timestamp', 'name', 'title', 'category', 'urgency',
      'description', 'email', 'linkedin'
    ],
    required: ['title', 'email']
  },
  raise: {
    sheetName: 'Raises',
    headers: [
      'id', 'timestamp', 'company', 'founder', 'stage', 'industry',
      'amountSeeking', 'raisedSoFar', 'useOfFunds', 'description', 'email',
      'website', 'linkedin'
    ],
    required: ['company', 'email']
  },
  investor: {
    sheetName: 'Investors',
    headers: [
      'id', 'timestamp', 'name', 'firm', 'type', 'checkSize', 'stages',
      'industries', 'thesis', 'email', 'website', 'linkedin'
    ],
    required: ['name', 'email']
  }
};

function entityFor_(type) {
  var entity = ENTITIES[type || 'profile'];
  if (!entity) throw new Error('Unknown type: ' + type);
  return entity;
}

function getSheet_(entity) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(entity.sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(entity.sheetName);
  }
  var firstRow = sheet.getRange(1, 1, 1, entity.headers.length).getValues()[0];
  if (firstRow.join('') === '' || firstRow[0] !== 'id') {
    sheet.getRange(1, 1, 1, entity.headers.length).setValues([entity.headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Read: returns all records for the requested type as JSON (supports ?callback= for JSONP). */
function doGet(e) {
  var out;
  try {
    var entity = entityFor_(e && e.parameter && e.parameter.type);
    var sheet = getSheet_(entity);
    var values = sheet.getDataRange().getValues();
    var header = values.shift() || entity.headers;
    var records = values
      .filter(function (row) { return String(row[0]).length > 0; })
      .map(function (row) {
        var obj = {};
        header.forEach(function (key, i) { obj[key] = row[i]; });
        return obj;
      })
      .reverse(); // newest first
    out = { ok: true, count: records.length, profiles: records, records: records };
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return respond_(out, e);
}

/** Write: appends a new record row for the requested type. */
function doPost(e) {
  var out;
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var type = data.type || (e && e.parameter && e.parameter.type);
    var entity = entityFor_(type);

    // Honeypot: bots fill hidden fields. Silently accept, don't store.
    if (data.company_website) {
      return respond_({ ok: true }, e);
    }

    var missing = entity.required.filter(function (key) { return !data[key]; });
    if (missing.length) {
      return respond_({ ok: false, error: 'Required: ' + missing.join(', ') }, e);
    }

    var sheet = getSheet_(entity);
    var id = Utilities.getUuid().slice(0, 8);
    var now = new Date().toISOString();
    var row = entity.headers.map(function (key) {
      if (key === 'id') return id;
      if (key === 'timestamp') return now;
      return data[key] || '';
    });
    sheet.appendRow(row);

    out = { ok: true, id: id };
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return respond_(out, e);
}

/** Serialize as JSON or JSONP depending on ?callback=. */
function respond_(obj, e) {
  var json = JSON.stringify(obj);
  var callback = e && e.parameter && e.parameter.callback;
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
