/**
 * categories.js — Data referensi Tim & Kegiatan/Pekerjaan
 *
 * Dipakai untuk dropdown bertingkat pada Form Tambah/Edit Log:
 * pilih Tim terlebih dahulu, lalu daftar Kegiatan/Pekerjaan
 * disaring sesuai Tim yang dipilih (agar dropdown tidak panjang di HP).
 */

const CATEGORY_DATA = {
  "Produksi": [
    "Terlaksananya kegiatan Statistik Industri yang berkualitas dan tepat waktu",
  ],
  "PSS dan EPSS": [
    "Terselenggaranya Internalisasi Pembinaan Statistik Sektoral sesuai standar",
    "Terselenggaranya Pendampingan dan Pemeriksaan Rekomendasi Statistik sesuai standar",
    "Terselenggaranya Pendampingan Penyusunan dan Pemeriksaan Metadata Statistik Sektoral kepada Pemerintah Daerah sesuai standar",
    "Terselenggaranya Pengembangan kapabilitas dan wawasan tim Pembina Statistik Sektoral sesuai standar",
  ],
  "Sosial": [
    "Tersusunnya Publikasi/Laporan Statistik Kesejahteraan Rakyat Yang Berkualitas",
    "Terselenggaranya Pembinaan Desa Cantik yang Berkualitas",
  ],
  "Neraca Wilayah dan Analisis Statistik": [
    "Terlaksananya Kegiatan Statistik Survei Neraca Produksi dengan sampel/responden Berbasis Usaha yang berkualitas, tepat waktu dan sesuai SOP",
    "Tersusunnya Publikasi PDRB Neraca Produksi yang berkualitas dan tepat waktu",
    "Terselenggaranya kegiatan Implementasi Quality Gate untuk Kegiatan Neraca Pengeluaran dan Produksi 2026 yang baik, tepat waktu dan sesuai SOP",
    "Tersusunnya Publikasi PDRB yang berkualitas, menerapkan standar akurasi dan tepat Waktu",
    "Tersedianya Publikasi Analisis Lintas Sektor dan Pengembangan Statistik yang berkualitas dan tepat waktu",
    "Terselenggaranya Kegiatan statistik yang medukung untuk penyusunan PDRB menurut lapangan usaha yang berkualitas dan tepat waktu",
    "Terselenggaranya kegiatan Implementasi Quality Gate untuk Kegiatan Sensus Ekonomi 2026 yang baik, tepat waktu dan sesuai SOP",
    "Terlaksananya Kegiatan Statistik Survei Neraca Konsumsi dengan sampel/responden Berbasis Usaha yang berkualitas, Tepat Waktu dan sesuai SOP",
    "Terselenggaranya Kegiatan statistik yang medukung untuk penyusunan PDRB menurut pengeluaran yang berkualitas dan tepat waktu",
  ],
  "Pengolahan dan Layanan Statistik": [
    "Terselenggaranya pelayanan statistik terpadu",
    "Terselenggaranya Pelaksanaan PEKPPP di Kabupaten/Kota dengan baik",
    "Tersusunnya publikasi Pasuruan Dalam Angka 2026",
    "Tersusunnya publikasi Kecamatan Dalam Angka 2026",
    "Terlaksananya reviu dan penyusunan dokumen administratif tim pengembangan jaringan dan pengolahan data yang sesuai pedoman",
    "Terselenggaranya Pojok Statistik di Kampus Yudharta Pasuruan",
    "Terselenggaranya kegiatan Kehumasan, Edukasi dan Promosi Statistik yang terstandar",
  ],
  "Distribusi": [
    "Terlaksananya kegiatan statistik distribusi sesuai SOP dan tepat waktu",
  ],
  "Umum": [
    "Terlaksananya peningkatan kompetensi pegawai",
    "Tersediannya laporan pengadaan barang/jasa yang akurat dan tepat waktu sebanyak 1 laporan",
    "Tersedianya bukti dukung pelaksanaan SAKIP yang lengkap dan akurat",
    "Terlaksananya partisipasi pegawai dalam kegiatan yang mendukung Manajemen Perubahan Core Value BerAKHLAK",
  ],
};

/** Cari nama Tim yang memiliki kegiatan tertentu (dipakai saat membuka form Edit). */
function findTimByKegiatan(kegiatan) {
  for (const tim in CATEGORY_DATA) {
    if (CATEGORY_DATA[tim].includes(kegiatan)) return tim;
  }
  return null;
}
