/**
 * Founders & Builders — Member Profiles backend
 * Google Apps Script Web App that uses a Google Sheet as the datastore.
 *
 * SETUP (one time):
 *   1. Open your Google Sheet.
 *   2. Extensions → Apps Script. Delete any code, paste ALL of this file.
 *   3. Click Deploy → New deployment → type "Web app".
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4. Copy the Web app URL (ends in /exec).
 *   5. Paste that URL into config.js as PROFILES_API.
 *
 * The "Profiles" tab and its header row are created automatically on first use.
 * To re-deploy after editing: Deploy → Manage deployments → Edit → Version: New.
 */

var SHEET_NAME = 'Profiles';

// Column order stored in the sheet. Add new fields at the END to stay compatible.
var HEADERS = [
  'id', 'timestamp', 'name', 'building', 'business', 'stage', 'products',
  'skills', 'industry', 'location', 'email', 'website', 'linkedin', 'github',
  'x', 'portfolio', 'bio', 'goals', 'lookingFor', 'canHelp',
  'mentor', 'investor', 'podcast', 'speaker', 'volunteer'
];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  // Ensure header row exists / is current.
  var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (firstRow.join('') === '' || firstRow[0] !== 'id') {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Read: returns all profiles as JSON (supports ?callback= for JSONP). */
function doGet(e) {
  var out;
  try {
    var sheet = getSheet_();
    var values = sheet.getDataRange().getValues();
    var header = values.shift() || HEADERS;
    var profiles = values
      .filter(function (row) { return String(row[0]).length > 0; })
      .map(function (row) {
        var obj = {};
        header.forEach(function (key, i) { obj[key] = row[i]; });
        return obj;
      })
      .reverse(); // newest first
    out = { ok: true, count: profiles.length, profiles: profiles };
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return respond_(out, e);
}

/** Write: appends a new profile row. */
function doPost(e) {
  var out;
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // Honeypot: bots fill hidden fields. Silently accept, don't store.
    if (data.company_website) {
      return respond_({ ok: true }, e);
    }

    if (!data.name || !data.email) {
      return respond_({ ok: false, error: 'Name and email are required.' }, e);
    }

    var sheet = getSheet_();
    var id = Utilities.getUuid().slice(0, 8);
    var now = new Date().toISOString();
    var record = {
      id: id, timestamp: now, name: data.name, building: data.building,
      business: data.business, stage: data.stage, products: data.products,
      skills: data.skills, industry: data.industry, location: data.location,
      email: data.email, website: data.website, linkedin: data.linkedin,
      github: data.github, x: data.x, portfolio: data.portfolio, bio: data.bio,
      goals: data.goals, lookingFor: data.lookingFor, canHelp: data.canHelp,
      mentor: data.mentor, investor: data.investor, podcast: data.podcast,
      speaker: data.speaker, volunteer: data.volunteer
    };
    var row = HEADERS.map(function (key) { return record[key] || ''; });
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
