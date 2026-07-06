/**
 * app.js — Logika UI: routing antar halaman, form, daftar log, dashboard,
 * toast notification, dan pengikatan seluruh event pengguna.
 */

(() => {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Referensi elemen                                                    */
  /* ------------------------------------------------------------------ */
  const pages = {
    home: document.getElementById("page-home"),
    form: document.getElementById("page-form"),
    detail: document.getElementById("page-detail"),
    search: document.getElementById("page-search"),
  };

  const topbarTitle = document.getElementById("topbarTitle");
  const btnBack = document.getElementById("btnBack");
  const btnSearchOpen = document.getElementById("btnSearchOpen");
  const btnAddLog = document.getElementById("btnAddLog");
  const btnSyncNow = document.getElementById("btnSyncNow");
  const btnPullData = document.getElementById("btnPullData");

  const logList = document.getElementById("logList");
  const emptyState = document.getElementById("emptyState");
  const todayDate = document.getElementById("todayDate");
  const todayCount = document.getElementById("todayCount");
  const pendingCount = document.getElementById("pendingCount");
  const syncedCount = document.getElementById("syncedCount");
  const lastSyncEl = document.getElementById("lastSync");

  const pillOnline = document.getElementById("pillOnline");
  const pillOnlineText = document.getElementById("pillOnlineText");
  const pillSync = document.getElementById("pillSync");
  const pillSyncText = document.getElementById("pillSyncText");

  const logForm = document.getElementById("logForm");
  const fId = document.getElementById("logId");
  const fTanggal = document.getElementById("fTanggal");
  const fJam = document.getElementById("fJam");
  const fJudul = document.getElementById("fJudul");
  const fTim = document.getElementById("fTim");
  const fKegiatan = document.getElementById("fKegiatan");
  const fLokasi = document.getElementById("fLokasi");
  const fCatatan = document.getElementById("fCatatan");
  const fFoto = document.getElementById("fFoto");
  const fotoPreview = document.getElementById("fotoPreview");

  const detailCard = document.getElementById("detailCard");
  const btnEdit = document.getElementById("btnEdit");
  const btnResync = document.getElementById("btnResync");
  const btnDelete = document.getElementById("btnDelete");

  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  const toastEl = document.getElementById("toast");

  let currentDetailId = null;
  let navStack = [];

  /* ------------------------------------------------------------------ */
  /* Utilitas umum                                                       */
  /* ------------------------------------------------------------------ */

  function todayISO() {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  }

  function nowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function formatTanggalIndo(iso) {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const d = new Date(iso + "T00:00:00");
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function escapeHTML(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showToast(message, type = "info") {
    toastEl.textContent = message;
    toastEl.className = `toast show ${type}`;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toastEl.classList.remove("show");
    }, 2600);
  }

  /* ------------------------------------------------------------------ */
  /* Navigasi antar halaman                                              */
  /* ------------------------------------------------------------------ */

  function showPage(name, title, pushToStack = true) {
    Object.values(pages).forEach((p) => p.classList.remove("active"));
    pages[name].classList.add("active");
    topbarTitle.textContent = title;
    btnBack.classList.toggle("hidden", name === "home");
    if (pushToStack) navStack.push(name);
    window.scrollTo(0, 0);
  }

  function goHome() {
    navStack = ["home"];
    showPage("home", "LogBook Lite", false);
    renderHome();
  }

  btnBack.addEventListener("click", () => {
    navStack.pop();
    const prev = navStack.pop() || "home";
    if (prev === "home") return goHome();
    showPage(prev, prev === "search" ? "Cari Log" : "Detail Log", true);
  });

  btnAddLog.addEventListener("click", () => openForm(null));
  btnSearchOpen.addEventListener("click", () => {
    showPage("search", "Cari Log");
    searchInput.value = "";
    searchResults.innerHTML = "";
    setTimeout(() => searchInput.focus(), 150);
  });

  /* ------------------------------------------------------------------ */
  /* Status Online / Sinkronisasi                                        */
  /* ------------------------------------------------------------------ */

  function renderConnectivity() {
    const online = navigator.onLine;
    pillOnline.classList.toggle("offline", !online);
    pillOnlineText.textContent = online ? "Online" : "Offline";
  }

  function renderSyncPill(state) {
    // state: "idle" | "syncing" | "done"
    pillSync.classList.toggle("syncing", state === "syncing");
    const icon = document.getElementById("syncIcon");
    if (state === "syncing") {
      icon.textContent = "⏳";
      pillSyncText.textContent = "Menyinkronkan...";
    } else {
      icon.textContent = "✓";
      pillSyncText.textContent = "Tersinkron";
    }
  }

  window.addEventListener("online", renderConnectivity);
  window.addEventListener("offline", renderConnectivity);

  Sync.onChange((event, detail) => {
    if (event === "start") renderSyncPill("syncing");
    if (event === "done") {
      renderSyncPill("done");
      renderHome();
      if (detail.synced > 0) showToast(`Sinkronisasi berhasil (${detail.synced} data).`, "success");
      if (detail.failed > 0) showToast(`Sinkronisasi gagal untuk ${detail.failed} data.`, "error");
    }
    if (event === "connectivity" && !detail.online) {
      showToast("Mode offline. Data akan disimpan di antrean.", "info");
    }
  });

  btnSyncNow.addEventListener("click", async () => {
    if (!navigator.onLine) {
      showToast("Tidak ada koneksi internet.", "error");
      return;
    }
    await Sync.runSync();
  });

  btnPullData.addEventListener("click", async () => {
    if (!navigator.onLine) {
      showToast("Tidak ada koneksi internet.", "error");
      return;
    }

    btnPullData.disabled = true;
    const originalText = btnPullData.textContent;
    btnPullData.textContent = "Menarik data...";

    try {
      const result = await Api.fetchAllLogs();
      if (!result || !result.success) {
        showToast(`Gagal menarik data: ${(result && result.message) || "tidak diketahui"}`, "error");
        return;
      }

      let added = 0;
      for (const remote of result.data || []) {
        const isNew = await LogDB.upsertFromServer(remote);
        if (isNew) added++;
      }

      showToast(
        added > 0 ? `Berhasil menarik ${added} log baru dari server.` : "Tidak ada log baru dari server.",
        "success"
      );
      renderHome();
    } catch (err) {
      showToast("Gagal menarik data dari server.", "error");
    } finally {
      btnPullData.disabled = false;
      btnPullData.textContent = originalText;
    }
  });

  /* ------------------------------------------------------------------ */
  /* Dashboard & Daftar Log (Home)                                       */
  /* ------------------------------------------------------------------ */

  function renderSkeleton() {
    logList.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const sk = document.createElement("div");
      sk.className = "skeleton-card";
      sk.innerHTML = `
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line full"></div>
      `;
      logList.appendChild(sk);
    }
  }

  function statusBadge(status) {
    if (status === "synced") return `<span class="badge badge-synced">✓ Sudah sinkron</span>`;
    if (status === "failed") return `<span class="badge badge-failed">❌ Gagal sinkron</span>`;
    return `<span class="badge badge-pending">⏳ Menunggu sinkron</span>`;
  }

  function renderLogCard(item) {
    const card = document.createElement("div");
    card.className = "log-card";
    card.dataset.id = item.id;
    card.innerHTML = `
      <div class="log-card-top">
        <div>
          <p class="log-title">${escapeHTML(item.judul)}</p>
          <p class="log-meta">${escapeHTML(item.tanggal)} · ${escapeHTML(item.jam)}</p>
        </div>
        <span class="badge badge-category">${escapeHTML(item.kategori)}</span>
      </div>
      <div class="log-card-bottom">
        <p class="log-meta">${escapeHTML(item.lokasi)}</p>
        ${statusBadge(item.status)}
      </div>
    `;
    card.addEventListener("click", () => openDetail(item.id));
    return card;
  }

  async function renderHome() {
    renderConnectivity();
    renderSkeleton();

    const all = await LogDB.getAll();
    const today = todayISO();
    const todayLogs = all.filter((i) => i.tanggal === today);
    const pending = all.filter((i) => i.status === "pending" || i.status === "failed");
    const synced = all.filter((i) => i.status === "synced");

    todayDate.textContent = formatTanggalIndo(today);
    todayCount.textContent = todayLogs.length;
    pendingCount.textContent = pending.length;
    syncedCount.textContent = synced.length;
    lastSyncEl.textContent = Sync.lastSyncAt
      ? new Date(Sync.lastSyncAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      : "-";

    logList.innerHTML = "";
    const recent = all.slice(0, 20);
    if (recent.length === 0) {
      emptyState.classList.remove("hidden");
    } else {
      emptyState.classList.add("hidden");
      recent.forEach((item) => logList.appendChild(renderLogCard(item)));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Form Tambah / Edit Log                                              */
  /* ------------------------------------------------------------------ */

  /** Isi dropdown Tim dari CATEGORY_DATA (dijalankan sekali saat init). */
  function populateTimOptions() {
    fTim.innerHTML = '<option value="">Pilih Tim</option>';
    Object.keys(CATEGORY_DATA).forEach((tim) => {
      const opt = document.createElement("option");
      opt.value = tim;
      opt.textContent = tim;
      fTim.appendChild(opt);
    });
  }

  /** Isi dropdown Kegiatan/Pekerjaan sesuai Tim yang dipilih. */
  function populateKegiatanOptions(tim, selectedValue) {
    const kegiatanList = CATEGORY_DATA[tim] || [];
    fKegiatan.innerHTML = "";
    if (!tim || kegiatanList.length === 0) {
      fKegiatan.innerHTML = '<option value="">Pilih Tim terlebih dahulu</option>';
      fKegiatan.disabled = true;
      return;
    }
    fKegiatan.disabled = false;
    fKegiatan.innerHTML = '<option value="">Pilih Kegiatan/Pekerjaan</option>';
    kegiatanList.forEach((kegiatan) => {
      const opt = document.createElement("option");
      opt.value = kegiatan;
      opt.textContent = kegiatan;
      fKegiatan.appendChild(opt);
    });
    if (selectedValue) fKegiatan.value = selectedValue;
  }

  fTim.addEventListener("change", () => populateKegiatanOptions(fTim.value));

  function resetForm() {
    logForm.reset();
    fId.value = "";
    fotoPreview.classList.add("hidden");
    fotoPreview.src = "";
    fTanggal.value = todayISO();
    fJam.value = nowTime();
    populateKegiatanOptions("");
    [fJudul, fTim, fKegiatan, fLokasi, fCatatan].forEach((el) => el.classList.remove("invalid"));
  }

  async function openForm(id) {
    resetForm();
    if (id) {
      const item = await LogDB.getById(id);
      if (item) {
        fId.value = item.id;
        fTanggal.value = item.tanggal;
        fJam.value = item.jam;
        fJudul.value = item.judul;
        fLokasi.value = item.lokasi;
        fCatatan.value = item.catatan;
        const tim = findTimByKegiatan(item.kategori);
        if (tim) {
          fTim.value = tim;
          populateKegiatanOptions(tim, item.kategori);
        }
        if (item.foto) {
          fotoPreview.src = item.foto;
          fotoPreview.classList.remove("hidden");
        }
      }
    }
    showPage("form", id ? "Edit Log" : "Tambah Log");
  }

  fFoto.addEventListener("change", () => {
    const file = fFoto.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      fotoPreview.src = reader.result;
      fotoPreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });

  function validateForm() {
    let valid = true;
    const requiredFields = [fJudul, fTim, fKegiatan, fLokasi, fCatatan];
    requiredFields.forEach((el) => {
      const empty = !el.value || !el.value.trim();
      el.classList.toggle("invalid", empty);
      if (empty) valid = false;
    });
    return valid;
  }

  logForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Mohon lengkapi semua field wajib.", "error");
      return;
    }

    const btnSave = document.getElementById("btnSave");
    btnSave.disabled = true;
    btnSave.textContent = "Menyimpan...";

    const foto = fotoPreview.classList.contains("hidden") ? null : fotoPreview.src;
    const payload = {
      tanggal: fTanggal.value,
      jam: fJam.value,
      judul: fJudul.value.trim(),
      kategori: fKegiatan.value,
      lokasi: fLokasi.value.trim(),
      catatan: fCatatan.value.trim(),
      foto,
    };

    try {
      if (fId.value) {
        // Mode edit: perbarui data, tandai perlu sinkron ulang.
        await LogDB.update(fId.value, { ...payload, status: "pending" });
      } else {
        const record = await LogDB.add(payload);
        // Jika online, langsung coba kirim ke Google Apps Script.
        if (navigator.onLine) {
          const result = await Api.sendLog(record);
          if (result && result.success) {
            await LogDB.update(record.id, { status: "synced" });
          } else {
            await LogDB.update(record.id, { status: "failed" });
          }
        }
      }
      showToast("Data berhasil disimpan.", "success");
      goHome();
    } catch (err) {
      showToast("Gagal menyimpan data.", "error");
    } finally {
      btnSave.disabled = false;
      btnSave.textContent = "Simpan";
    }
  });

  /* ------------------------------------------------------------------ */
  /* Detail Log                                                          */
  /* ------------------------------------------------------------------ */

  async function openDetail(id) {
    const item = await LogDB.getById(id);
    if (!item) return;
    currentDetailId = id;

    detailCard.innerHTML = `
      <div class="detail-row"><p class="k">Status</p><p class="v">${statusBadge(item.status)}</p></div>
      <div class="detail-row"><p class="k">Tanggal</p><p class="v">${escapeHTML(item.tanggal)}</p></div>
      <div class="detail-row"><p class="k">Jam</p><p class="v">${escapeHTML(item.jam)}</p></div>
      <div class="detail-row"><p class="k">Judul Kegiatan</p><p class="v">${escapeHTML(item.judul)}</p></div>
      <div class="detail-row"><p class="k">Kategori</p><p class="v">${escapeHTML(item.kategori)}</p></div>
      <div class="detail-row"><p class="k">Lokasi</p><p class="v">${escapeHTML(item.lokasi)}</p></div>
      <div class="detail-row"><p class="k">Catatan</p><p class="v">${escapeHTML(item.catatan)}</p></div>
      ${item.foto ? `<div class="detail-row"><p class="k">Foto</p><img class="detail-photo" src="${item.foto}" alt="Foto log" /></div>` : ""}
    `;
    showPage("detail", "Detail Log");
  }

  btnEdit.addEventListener("click", () => {
    if (currentDetailId) openForm(currentDetailId);
  });

  btnDelete.addEventListener("click", async () => {
    if (!currentDetailId) return;
    if (!confirm("Hapus log ini? Tindakan tidak dapat dibatalkan.")) return;
    await LogDB.remove(currentDetailId);
    showToast("Log dihapus.", "success");
    goHome();
  });

  btnResync.addEventListener("click", async () => {
    if (!currentDetailId) return;
    if (!navigator.onLine) {
      showToast("Tidak ada koneksi internet.", "error");
      return;
    }
    const item = await LogDB.getById(currentDetailId);
    showToast("Menyinkronkan ulang...", "info");
    const result = await Api.sendLog(item);
    if (result && result.success) {
      await LogDB.update(item.id, { status: "synced" });
      showToast("Sinkronisasi berhasil.", "success");
    } else {
      await LogDB.update(item.id, { status: "failed", retry: (item.retry || 0) + 1 });
      showToast("Sinkronisasi gagal.", "error");
    }
    openDetail(currentDetailId);
  });

  /* ------------------------------------------------------------------ */
  /* Pencarian                                                           */
  /* ------------------------------------------------------------------ */

  let searchDebounce = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(runSearch, 200);
  });

  async function runSearch() {
    const q = searchInput.value.trim().toLowerCase();
    searchResults.innerHTML = "";
    if (!q) return;

    const all = await LogDB.getAll();
    const filtered = all.filter((item) => {
      return (
        item.tanggal.toLowerCase().includes(q) ||
        item.kategori.toLowerCase().includes(q) ||
        item.judul.toLowerCase().includes(q) ||
        item.catatan.toLowerCase().includes(q)
      );
    });

    if (filtered.length === 0) {
      searchResults.innerHTML = `<div class="empty-state"><p>Tidak ada hasil untuk "${escapeHTML(searchInput.value)}"</p></div>`;
      return;
    }
    filtered.forEach((item) => searchResults.appendChild(renderLogCard(item)));
  }

  /* ------------------------------------------------------------------ */
  /* Inisialisasi Aplikasi                                               */
  /* ------------------------------------------------------------------ */

  async function init() {
    populateTimOptions();
    resetForm();
    renderConnectivity();
    goHome();
    Sync.initAutoSync();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch(() => {
        // Registrasi gagal (mis. dijalankan tanpa HTTPS/localhost) — abaikan secara diam-diam.
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
