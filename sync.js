/**
 * sync.js — Mesin sinkronisasi antrean offline ke Google Apps Script
 *
 * - Mengirim semua log berstatus "pending"/"failed" satu per satu secara berurutan.
 * - Berjalan otomatis saat browser kembali online.
 * - Mampu memproses ratusan data (mis. 200 log offline) tanpa intervensi pengguna,
 *   karena diproses dalam satu antrean sekuensial sampai habis.
 */

const Sync = {
  isSyncing: false,
  lastSyncAt: null,
  listeners: [],

  /** Daftarkan callback yang dipanggil setiap kali status sinkronisasi berubah. */
  onChange(cb) {
    this.listeners.push(cb);
  },

  _emit(eventName, detail) {
    this.listeners.forEach((cb) => cb(eventName, detail));
  },

  /** Jalankan sinkronisasi seluruh antrean pending/failed secara berurutan. */
  async runSync() {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    if (!navigator.onLine) return { synced: 0, failed: 0 };

    this.isSyncing = true;
    this._emit("start");

    let synced = 0;
    let failed = 0;

    try {
      const queue = await LogDB.getAll();
      const pendingItems = queue.filter((item) => item.status === "pending" || item.status === "failed");

      for (const item of pendingItems) {
        // Kirim satu per satu — menjaga urutan dan mencegah membanjiri server.
        const result = await Api.sendLog(item);

        if (result && result.success) {
          await LogDB.update(item.id, { status: "synced" });
          synced++;
          this._emit("item-synced", item);
        } else {
          await LogDB.update(item.id, { status: "failed", retry: (item.retry || 0) + 1 });
          failed++;
          this._emit("item-failed", { item, message: result && result.message });
        }
      }

      this.lastSyncAt = new Date().toISOString();
    } finally {
      this.isSyncing = false;
      this._emit("done", { synced, failed });
    }

    return { synced, failed };
  },

  /** Pasang listener otomatis: online -> sync, dan pengecekan berkala ringan. */
  initAutoSync() {
    window.addEventListener("online", () => {
      this._emit("connectivity", { online: true });
      this.runSync();
    });

    window.addEventListener("offline", () => {
      this._emit("connectivity", { online: false });
    });

    // Jalankan sekali saat aplikasi dibuka apabila sedang online.
    if (navigator.onLine) {
      this.runSync();
    }
  },
};
