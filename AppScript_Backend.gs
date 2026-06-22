/**
 * ═══════════════════════════════════════════════════════════════
 *  CEPRO PERCUSSION — Google Apps Script Backend
 *  Mendukung operasi: add, edit, delete jadwal kesenian
 *  Versi: 2.0 (dengan fitur Edit)
 * ═══════════════════════════════════════════════════════════════
 *
 *  CARA DEPLOY:
 *  1. Buka script.google.com → buka/buat project ini
 *  2. Klik "Deploy" → "New Deployment"
 *  3. Pilih "Web app"
 *  4. Execute as: "Me"
 *  5. Who has access: "Anyone"
 *  6. Klik Deploy, copy URL-nya ke App.jsx
 *
 *  SETIAP KALI MENGUBAH KODE INI, WAJIB BUAT "New Deployment" lagi!
 */

// ── KONFIGURASI ─────────────────────────────────────────────────────────────
const SPREADSHEET_ID = 'GANTI_DENGAN_ID_SPREADSHEET_ANDA';
// Cara dapat ID: buka Google Sheet → lihat URL:
//   https://docs.google.com/spreadsheets/d/[INI_ID_NYA]/edit
const SHEET_NAME     = 'Sheet1'; // Ganti jika nama sheet berbeda
const SECRET_PIN     = 'PIN_RAHASIA_ANDA'; // Ganti dengan PIN yang diinginkan

// ── NAMA KOLOM (sesuaikan dengan header di Google Sheet Anda) ───────────────
// Pastikan baris pertama sheet adalah header dengan nama persis seperti ini:
// Tanggal | Acara Dari Siapa | PIC | Kacapi | Kendang | Biola | Perkusi |
// Sinden | Narator | Suling | Keyboard | Drum

// ── CORS HEADERS ────────────────────────────────────────────────────────────
function setCORSHeaders(output) {
  return output
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── HANDLE GET (mengambil semua data jadwal) ─────────────────────────────────
function doGet(e) {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data  = sheet.getDataRange().getValues();

    if (data.length < 2) {
      const output = ContentService
        .createTextOutput(JSON.stringify({ status: 'success', data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
      return setCORSHeaders(output);
    }

    const headers = data[0]; // Baris pertama = header
    const rows    = data.slice(1); // Baris berikutnya = data

    const jadwalList = rows
      .map((row, index) => {
        // Lewati baris yang sepenuhnya kosong
        if (row.every(cell => cell === '' || cell === null)) return null;

        const obj = { rowId: index + 2 }; // +2 karena index 0-based + skip header
        headers.forEach((header, i) => {
          // Format tanggal jika perlu
          if (header === 'Tanggal' && row[i] instanceof Date) {
            obj[header] = Utilities.formatDate(row[i], Session.getScriptTimeZone(), 'yyyy-MM-dd');
          } else {
            obj[header] = row[i] !== undefined && row[i] !== null ? String(row[i]) : '-';
          }
        });
        return obj;
      })
      .filter(Boolean); // Hapus baris null

    const output = ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data: jadwalList }))
      .setMimeType(ContentService.MimeType.JSON);
    return setCORSHeaders(output);

  } catch (err) {
    const output = ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
    return setCORSHeaders(output);
  }
}

// ── HANDLE POST (tambah / edit / hapus jadwal) ───────────────────────────────
function doPost(e) {
  try {
    const params = e.parameter;
    const action = params.action || 'add'; // default: tambah jadwal baru
    const pin    = params.pin || '';

    // Validasi PIN
    if (pin !== SECRET_PIN) {
      Logger.log(`PIN salah! Diterima: "${pin}" | Action: ${action}`);
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'PIN salah' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    // ── ACTION: TAMBAH JADWAL BARU ─────────────────────────────────────────
    if (action === 'add') {
      const newRow = [
        params.tanggal       || '',
        params.acaraDariSiapa || '',
        params.pic           || '',
        params.kacapi        || '',
        params.kendang       || '',
        params.biola         || '',
        params.perkusi       || '',
        params.sinden        || '',
        params.narator       || '',
        params.suling        || '',
        params.keyboard      || '',
        params.drum          || '',
      ];
      sheet.appendRow(newRow);
      Logger.log(`Jadwal baru ditambahkan: ${params.acaraDariSiapa} - ${params.tanggal}`);
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', message: 'Jadwal berhasil ditambahkan' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── ACTION: EDIT JADWAL ────────────────────────────────────────────────
    if (action === 'edit') {
      const rowId = parseInt(params.rowId);
      if (!rowId || isNaN(rowId)) {
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'error', message: 'rowId tidak valid' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      // Ambil header untuk menentukan urutan kolom
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

      // Buat map dari header → nilai baru
      const fieldMap = {
        'Tanggal':          params.tanggal        || '',
        'Acara Dari Siapa': params.acaraDariSiapa || '',
        'PIC':              params.pic            || '',
        'Kacapi':           params.kacapi         || '',
        'Kendang':          params.kendang        || '',
        'Biola':            params.biola          || '',
        'Perkusi':          params.perkusi        || '',
        'Sinden':           params.sinden         || '',
        'Narator':          params.narator        || '',
        'Suling':           params.suling         || '',
        'Keyboard':         params.keyboard       || '',
        'Drum':             params.drum           || '',
      };

      // Update setiap kolom yang ada di fieldMap
      headers.forEach((header, colIndex) => {
        if (fieldMap.hasOwnProperty(header)) {
          sheet.getRange(rowId, colIndex + 1).setValue(fieldMap[header]);
        }
      });

      Logger.log(`Jadwal di baris ${rowId} berhasil diedit`);
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', message: 'Jadwal berhasil diedit' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── ACTION: HAPUS JADWAL ───────────────────────────────────────────────
    if (action === 'delete') {
      const rowId = parseInt(params.rowId);
      if (!rowId || isNaN(rowId)) {
        return ContentService
          .createTextOutput(JSON.stringify({ status: 'error', message: 'rowId tidak valid' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      sheet.deleteRow(rowId);
      Logger.log(`Baris ${rowId} berhasil dihapus`);
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', message: 'Jadwal berhasil dihapus' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Action tidak dikenal
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: `Action tidak dikenal: ${action}` }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Error di doPost: ' + err.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── FUNGSI BANTU: Inisialisasi Header Sheet ──────────────────────────────────
/**
 * Jalankan fungsi ini SATU KALI untuk membuat header di baris pertama sheet.
 * Caranya: pilih fungsi ini di dropdown lalu klik "Run".
 */
function setupSheetHeaders() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);

  const headers = [
    'Tanggal', 'Acara Dari Siapa', 'PIC',
    'Kacapi', 'Kendang', 'Biola', 'Perkusi',
    'Sinden', 'Narator', 'Suling', 'Keyboard', 'Drum'
  ];

  // Cek apakah baris pertama sudah ada header
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (firstRow[0] !== '') {
    Logger.log('Header sudah ada, skip inisialisasi.');
    return;
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#1a73e8')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  Logger.log('Header berhasil dibuat!');
}
