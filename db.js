/**
 * db.js — Lapisan penyimpanan IndexedDB (Offline Queue)
 * Struktur data log:
 *   id, tanggal, jam, judul, kategori, lokasi, catatan, foto (base64|null),
 *   status ("pending" | "synced" | "failed"), retry, createdAt, updatedAt
 */

const DB_NAME = "logbook_lite_db";
const DB_VERSION = 1;
const STORE_LOGS = "logs";

/** Buka koneksi IndexedDB, buat object store bila belum ada. */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_LOGS)) {
        const store = db.createObjectStore(STORE_LOGS, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("tanggal", "tanggal", { unique: false });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/** Buat UUID v4 sebagai ID unik dan aman untuk setiap log. */
function generateUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const LogDB = {
  /** Simpan log baru. Mengembalikan object log yang tersimpan. */
  async add(log) {
    const db = await openDB();
    const now = new Date().toISOString();
    const record = {
      id: generateUUID(),
      tanggal: log.tanggal,
      jam: log.jam,
      judul: log.judul,
      kategori: log.kategori,
      lokasi: log.lokasi,
      catatan: log.catatan,
      foto: log.foto || null,
      status: "pending",
      retry: 0,
      createdAt: now,
      updatedAt: now,
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOGS, "readwrite");
      tx.objectStore(STORE_LOGS).add(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  /** Perbarui field-field log tertentu berdasarkan id. */
  async update(id, changes) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOGS, "readwrite");
      const store = tx.objectStore(STORE_LOGS);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (!record) return reject(new Error("Log tidak ditemukan"));
        const updated = { ...record, ...changes, updatedAt: new Date().toISOString() };
        store.put(updated);
        tx.oncomplete = () => resolve(updated);
      };
      getReq.onerror = (e) => reject(e.target.error);
    });
  },

  /** Hapus log berdasarkan id. */
  async remove(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOGS, "readwrite");
      tx.objectStore(STORE_LOGS).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  /** Ambil satu log berdasarkan id. */
  async getById(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOGS, "readonly");
      const req = tx.objectStore(STORE_LOGS).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  /** Ambil seluruh log, diurutkan dari yang terbaru. */
  async getAll() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOGS, "readonly");
      const req = tx.objectStore(STORE_LOGS).getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(items);
      };
      req.onerror = (e) => reject(e.target.error);
    });
  },

  /** Ambil seluruh log dengan status tertentu (mis. "pending"). */
  async getByStatus(status) {
    const all = await this.getAll();
    return all.filter((item) => item.status === status);
  },

  /** Ambil log yang tanggalnya sama dengan hari ini (YYYY-MM-DD). */
  async getByDate(tanggal) {
    const all = await this.getAll();
    return all.filter((item) => item.tanggal === tanggal);
  },

  /**
   * Simpan log hasil tarik dari server hanya jika id-nya belum ada secara
   * lokal, supaya tidak menimpa perubahan yang belum sempat disinkronkan
   * di device ini. Mengembalikan true jika data baru ditambahkan.
   */
  async upsertFromServer(remote) {
    const db = await openDB();
    const existing = await this.getById(remote.id);
    if (existing) return false;

    const now = new Date().toISOString();
    const record = {
      id: remote.id,
      tanggal: remote.tanggal,
      jam: remote.jam,
      judul: remote.judul,
      kategori: remote.kategori,
      lokasi: remote.lokasi,
      catatan: remote.catatan,
      foto: remote.foto || null,
      status: "synced",
      retry: 0,
      createdAt: remote.createdAt || now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOGS, "readwrite");
      tx.objectStore(STORE_LOGS).put(record);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  },
};
