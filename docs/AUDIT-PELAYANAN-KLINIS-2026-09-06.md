# Audit Pelayanan Klinis HIS — 6 September 2026

## Keputusan arsitektur

HIS adalah tempat dokter dan petugas klinik melihat kesinambungan pelayanan.
LIS tetap menjadi sistem otoritatif untuk spesimen, input analitik, koreksi,
validasi, persetujuan, serta pelepasan hasil. Karena itu, Patologi Klinik,
Mikrobiologi, dan Patologi Anatomi pada HIS dibangun sebagai **viewer
read-only**, bukan duplikasi workflow laboratorium.

| Layanan referensi | Penempatan AVA | Jenis layar | Status |
|---|---|---|---|
| Anamnesa & specimen | Anamnesa HIS + workflow spesimen LIS | Workflow terpisah | Dipertahankan agar chain of custody tidak terduplikasi |
| Patologi Klinik | Pelayanan Klinis → Hasil Patologi Klinik | Viewer LIS read-only | Ditambahkan |
| Mikrobiologi | Pelayanan Klinis → Hasil Mikrobiologi | Viewer LIS read-only | Ditambahkan |
| Patologi Anatomi | Pelayanan Klinis → Hasil Patologi Anatomi | Viewer LIS read-only | Ditambahkan |
| Radiologi | Radiologi & Pencitraan | Workflow RIS/PACS tersendiri | Dipertahankan, tidak diduplikasi di klinik |
| Audiometri | Support Medical → Audiometri | Workflow penunjang | Dipisahkan dari dashboard umum |
| Spirometri | Support Medical → Spirometri | Workflow penunjang | Dipisahkan dari dashboard umum |
| EKG/Treadmill | Support Medical → EKG & Treadmill | Workflow penunjang | Dipisahkan dari dashboard umum |
| Outpatient | Admission, EMR SOAP/CPPT, dan antrean poli | Workflow klinis | Sudah ada di Alur Pasien dan Pelayanan Klinis |

## Viewer hasil LIS

Ketiga viewer memakai sumber `lab_results` dan katalog `products` hanya melalui
operasi baca. Yang ditampilkan: pasien/kunjungan, pemeriksaan, nilai dan satuan,
rentang rujukan, flag klinis, waktu rilis, dan identitas validator/approver bila
tersedia. Filter tersedia untuk pencarian, periode, nilai kritis, hasil di luar
rentang, dan hasil tanpa flag. Hanya hasil berstatus released/approved atau yang
memiliki waktu rilis ditampilkan.

Klasifikasi disiplin menggunakan kategori/subkategori katalog lalu fallback nama
pemeriksaan. Katalog LIS yang baku tetap menjadi sumber klasifikasi; untuk
integrasi produksi, kategori Patologi Klinik/Mikrobiologi/Patologi Anatomi perlu
distandarkan pada master LIS agar fallback tidak diperlukan.

## Tata letak

- Header menyebutkan disiplin dan status read-only secara eksplisit.
- Toolbar kompak berada di atas tabel; pada layar sempit pencarian mengambil
  satu baris penuh dan tabel dapat digulir horizontal tanpa memotong data.
- Nilai kritis diberi penanda visual berbeda, tanpa mengubah nilai asli.
- Dashboard penunjang tetap menjadi ringkasan lintas layanan, sedangkan menu
  Audiometri, Spirometri, serta EKG/Treadmill langsung membuka konteks dan field
  pemeriksaan yang sesuai.

## Batas kepatuhan

Tidak ada tombol input, edit, validasi, approve, rilis, atau cetak hasil pada
viewer HIS. Pengguna harus kembali ke LIS untuk tindakan tersebut. Tidak ada
perubahan skema, koneksi LIS, atau data pasien produksi selama audit/pengujian.

## Bukti verifikasi

- Preview lokal: rute Patologi Klinik dan Mikrobiologi memuat header, indikator
  read-only, filter, ringkasan, dan empty state tanpa data sintetis.
- Preview lokal: menu Audiometri membuka form dengan Audiometri terpilih dan
  seluruh field PTA/ambang pendengaran yang relevan; form ditutup tanpa simpan.
- `bangun-menu --periksa`, audit menu hidup, audit keamanan 2.470/2.470,
  manifest 180 rute, pemeriksa sintaks, dan kontrak registry semuanya lulus.
