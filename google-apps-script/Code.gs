/**
 * Code.gs — Google Apps Script Web App untuk LogBook Lite
 *
 * CARA SETUP:
 * 1. Buka https://script.google.com dan buat proyek baru.
 * 2. Salin seluruh isi file ini ke Code.gs.
 * 3. Buat Google Spreadsheet baru, salin Spreadsheet ID-nya,
 *    lalu tempel ke konstanta SPREADSHEET_ID di bawah.
 * 4. Pastikan sheet pertama memiliki header pada baris 1:
 *    ID | Tanggal | Jam | Judul | Kategori | Lokasi | Catatan | Foto | Created At
 * 5. Klik Deploy > New deployment > pilih tipe "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Salin URL deployment, tempelkan ke WEB_APP_URL pada file api.js aplikasi.
 */

const SPREADSHEET_ID = "GANTI_DENGAN_SPREADSHEET_ID_ANDA";
const SHEET_NAME = "Logs";

const HEADERS = [
  "ID",
  "Tanggal",
  "Jam",
  "Judul",
  "Kategori",
  "Lokasi",
  "Catatan",
  "Foto",
  "Created At",
];

/** Ambil sheet target, buat beserta header bila belum ada. */
function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

/** Bangun response JSON dengan header CORS agar bisa diakses dari PWA. */
function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Validasi field wajib pada payload yang diterima. */
function validatePayload_(data) {
  const required = ["id", "tanggal", "jam", "judul", "kategori", "lokasi", "catatan"];
  for (const field of required) {
    if (!data[field] || String(data[field]).trim() === "") {
      return `Field "${field}" wajib diisi.`;
    }
  }
  return null;
}

/**
 * Endpoint utama menerima POST JSON dari PWA dan menambahkan satu baris
 * ke Google Spreadsheet.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ success: false, message: "Tidak ada data yang diterima." });
    }

    const data = JSON.parse(e.postData.contents);

    const validationError = validatePayload_(data);
    if (validationError) {
      return jsonResponse_({ success: false, message: validationError });
    }

    const sheet = getSheet_();
    sheet.appendRow([
      data.id,
      data.tanggal,
      data.jam,
      data.judul,
      data.kategori,
      data.lokasi,
      data.catatan,
      data.foto || "",
      data.createdAt || new Date().toISOString(),
    ]);

    return jsonResponse_({ success: true });
  } catch (err) {
    return jsonResponse_({ success: false, message: err.message || "Terjadi kesalahan pada server." });
  }
}

/** Endpoint GET sederhana untuk memastikan Web App aktif (health check). */
function doGet() {
  return jsonResponse_({ success: true, message: "LogBook Lite API aktif." });
}
