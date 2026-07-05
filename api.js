/**
 * api.js — Klien komunikasi ke Google Apps Script Web App
 *
 * GANTI nilai WEB_APP_URL di bawah dengan URL deployment
 * Google Apps Script Anda (Deploy > New deployment > Web app).
 */

const API_CONFIG = {
  WEB_APP_URL: "https://script.google.com/macros/s/AKfycbwcpssM2h81_kDK3Oh5wP9K8ZOliuNKxwn1cYoxaSb2VT3ANWpMLaJbajjh7-QyJpemjQ/exec",
};

const Api = {
  /**
   * Kirim satu log ke Google Apps Script.
   * Mengembalikan { success: true } atau { success: false, message }.
   */
  async sendLog(log) {
    const payload = {
      id: log.id,
      tanggal: escapeText(log.tanggal),
      jam: escapeText(log.jam),
      judul: escapeText(log.judul),
      kategori: escapeText(log.kategori),
      lokasi: escapeText(log.lokasi),
      catatan: escapeText(log.catatan),
      foto: log.foto || "",
      createdAt: log.createdAt,
    };

    try {
      const response = await fetch(API_CONFIG.WEB_APP_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return { success: false, message: `HTTP ${response.status}` };
      }

      const result = await response.json();
      return result;
    } catch (err) {
      return { success: false, message: err.message || "Gagal terhubung ke server" };
    }
  },
};

/** Escape input teks sederhana untuk mencegah karakter berbahaya ikut terkirim. */
function escapeText(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .trim();
}
