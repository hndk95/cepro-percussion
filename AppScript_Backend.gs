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
// Pastikan baris pertama sheet adalah header dengan urutan persis seperti ini:
// Tanggal | Kacapi | Kendang | Biola | Perkusi | Sinden | Narator | PIC | Acara dari Siapa | Suling | Drum | Keyboard | Tanggal Input

// Catatan: CORS ditangani otomatis oleh Google ketika deployment
// di-set ke "Who has access: Anyone". Tidak perlu setHeader manual.

// ── HANDLE GET (mengambil semua data jadwal) ─────────────────────────────────
function doGet(e) {
  try {
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    const data  = sheet.getDataRange().getValues();

    if (data.length < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'success', data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
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

    // Coba baca sheet Data Pemain jika ada
    let pemainList = [];
    const sheetPemain = ss.getSheetByName("Data Pemain");
    if (sheetPemain) {
      const dataPemain = sheetPemain.getDataRange().getValues();
      if (dataPemain.length > 1) {
        const headersPemain = dataPemain[0];
        const rowsPemain = dataPemain.slice(1);
        pemainList = rowsPemain.map(row => {
          let obj = {};
          headersPemain.forEach((h, i) => {
            // Trim spaces from headers just in case
            if(h) obj[h.toString().trim()] = row[i];
          });
          return obj;
        }).filter(p => p.Nama && p.Nama !== '');
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', data: jadwalList, pemain: pemainList }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
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
        params.tanggal        || '',
        params.kacapi         || '',
        params.kendang        || '',
        params.biola          || '',
        params.perkusi        || '',
        params.sinden         || '',
        params.narator        || '',
        params.pic            || '',
        params.acaraDariSiapa || '',
        params.suling         || '',
        params.drum           || '',
        params.keyboard       || '',
        new Date() // Kolom Tanggal Input
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
        'Kacapi':           params.kacapi         || '',
        'Kendang':          params.kendang        || '',
        'Biola':            params.biola          || '',
        'Perkusi':          params.perkusi        || '',
        'Sinden':           params.sinden         || '',
        'Narator':          params.narator        || '',
        'PIC':              params.pic            || '',
        'Acara dari Siapa': params.acaraDariSiapa || '',
        'Suling':           params.suling         || '',
        'Drum':             params.drum           || '',
        'Keyboard':         params.keyboard       || ''
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
    'Tanggal', 'Kacapi', 'Kendang', 'Biola',
    'Perkusi', 'Sinden', 'Narator', 'PIC',
    'Acara dari Siapa', 'Suling', 'Drum', 'Keyboard', 'Tanggal Input'
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

// ── FUNGSI MIGRASI OTOMATIS ──────────────────────────────────────────────────
function jalankanMigrasiOtomatis() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Pastikan nama sheet lama dan baru sesuai dengan yang ada di file Anda
  const sheetLama = ss.getSheetByName("EVENT CEPRO"); // Ganti jika namanya beda
  const sheetBaru = ss.getSheetByName("Source Jadwalku"); 
  
  // Ambil semua data dari sheet lama (Mulai baris ke-2, mengabaikan header)
  const dataLama = sheetLama.getRange(2, 1, sheetLama.getLastRow() - 1, 6).getValues();
  
  // Siapkan penampung untuk baris-baris data baru
  const barisBaru = [];
  const timestamp = new Date();
  
  for (let i = 0; i < dataLama.length; i++) {
    const row = dataLama[i];
    const tanggal = row[1];
    const pemusikText = row[2];
    const ket = row[3];
    const pic = row[4];
    
    // Abaikan jika baris kosong
    if (!tanggal && !pemusikText) continue;
    
    // Filter khusus: Hanya masukkan jadwal mulai Juni 2026

    // Ubah apapun format tanggalnya menjadi teks biasa berskala huruf kecil
    let textTanggal = String(tanggal).toLowerCase();
    let isTargetDate = false;
    
    // Pastikan itu adalah tahun 2026
    if (textTanggal.includes("2026")) {
      // Kita "buang" (abaikan) bulan-bulan sebelum Juni
      if (!textTanggal.includes("januari") && !textTanggal.includes("jan ") && 
          !textTanggal.includes("februari") && !textTanggal.includes("feb ") &&
          !textTanggal.includes("maret") && !textTanggal.includes("mar ") &&
          !textTanggal.includes("april") && !textTanggal.includes("apr ") &&
          !textTanggal.includes("mei") && !textTanggal.includes("may ")) {
        
        isTargetDate = true;
      }
    }
    
    if (!isTargetDate) continue; // Lewati jika bukan jadwal yang diinginkan
    
    // Objek untuk menyimpan nama pemain sementara
    let pemain = {
      kacapi: "-", kendang: "-", biola: "-", perkusi: "-", 
      sinden: "-", narator: "-", suling: "-", keyboard: "-", drum: "-"
    };
    
    // Proses Auto-Split dari teks pemusik
    if (pemusikText) {
      // Pecah berdasarkan garis baru (Enter)
      const lines = pemusikText.split('\n');
      
      lines.forEach(line => {
        // Pecah berdasarkan titik dua (:)
        if (line.includes(':')) {
          let parts = line.split(':');
          let alatMusik = parts[0].trim().toLowerCase();
          let namaOrang = parts[1].trim();
          
          // Deteksi alat musik dan masukkan ke kolom yang benar
          if (alatMusik.includes("kacapi")) pemain.kacapi = namaOrang;
          else if (alatMusik.includes("kendang")) pemain.kendang = namaOrang;
          else if (alatMusik.includes("biola")) pemain.biola = namaOrang;
          else if (alatMusik.includes("perkusi")) pemain.perkusi = namaOrang;
          else if (alatMusik.includes("sinden")) pemain.sinden = namaOrang;
          else if (alatMusik.includes("narator") || alatMusik.includes("dalang")) pemain.narator = namaOrang;
          else if (alatMusik.includes("suling")) pemain.suling = namaOrang;
          else if (alatMusik.includes("keyboard")) pemain.keyboard = namaOrang;
          else if (alatMusik.includes("drum")) pemain.drum = namaOrang;
        }
      });
    }
    
    // Format tanggal jika objek date (DI PERBAIKI UNTUK TIMEZONE)
    let formattedTanggal = tanggal;
    if (tanggal instanceof Date) {
      formattedTanggal = Utilities.formatDate(tanggal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    
    // Susun sesuai urutan kolom Sheet1 kita:
    // Tanggal, Kacapi, Kendang, Biola, Perkusi, Sinden, Narator, PIC, Acara dari Siapa, Suling, Drum, Keyboard, Tanggal Input
    barisBaru.push([
      formattedTanggal || "-",
      pemain.kacapi,
      pemain.kendang,
      pemain.biola,
      pemain.perkusi,
      pemain.sinden,
      pemain.narator,
      pic || "-",
      ket || "-",
      pemain.suling,
      pemain.drum,
      pemain.keyboard,
      timestamp
    ]);
  }
  
  // Tuliskan semua data sekaligus ke Sheet1 (Mulai baris ke-2)
  if (barisBaru.length > 0) {
    // Kita hapus isi Sheet1 (kecuali header) agar tidak numpuk jika dijalankan berulang
    if (sheetBaru.getLastRow() > 1) {
      sheetBaru.getRange(2, 1, sheetBaru.getLastRow() - 1, 13).clearContent();
    }
    
    // Masukkan data baru
    sheetBaru.getRange(2, 1, barisBaru.length, 13).setValues(barisBaru);
  }
}
