# Audit mendalam AVA LIS — 6 September 2026

OWNED_BY: ava (laporan dan fixture audit). Brosur HCLAB tetap milik pihak ketiga.

## Kesimpulan

AVA LIS sudah memiliki cakupan modul yang luas, tetapi alur hasil, kejujuran tampilan, konsistensi QC, identitas pasien dan ketahanan integrasi perlu diprioritaskan sebelum perluasan operasional. Banyak menu tersedia; keberadaan menu belum membuktikan prosesnya selesai dari awal sampai akhir.

**Keputusan yang disarankan:** selesaikan temuan P0 dahulu, uji satu alur lengkap dengan data sintetis di staging, lalu pilot terbatas sesuai SOP laboratorium. Pertahankan HIS sebagai pemilik tarif, tagihan dan pembayaran. LIS mengelola permintaan pemeriksaan, spesimen, hasil dan komunikasi perubahan layanan.

Audit ini menghasilkan laporan dan alat reproduksi; **belum memperbaiki temuan klinis, menjalankan migrasi produksi, atau menyatakan sistem siap produksi.**

## Lingkup dan kekuatan bukti

- Membaca teks dan meninjau render seluruh 12 halaman `2020_HCLAB-LIS_Brochure.pdf`. Brosur adalah pembanding historis; tidak memverifikasi kemampuan atau penawaran vendor terkini.
- Menelusuri kode modul LIS, navigasi, pelaporan, QC, connector dan kontrak layanan HIS–LIS. Pemeriksaan UI kali ini terutama dari struktur kode; audit interaksi seluruh layar dengan sesi login, ukuran layar dan peran nyata masih perlu dilakukan di staging.
- Sebelas kasus direproduksi memakai fungsi JavaScript aktual dan SQL dalam PGlite terisolasi. Data semuanya sintetis. Hasil: [bukti JSON](audit-evidence/lis-deep-findings.json), [skrip reproduksi](../scripts/audit-lis-deep.cjs).
- Uji regresi kontrak HIS–LIS lulus secara lokal: tenant/peran, katalog, retry, penambahan layanan, sampel/panel, konflik, pembatalan klinis, penjagaan tagihan pending dan harga HIS. Ini bukan bukti bahwa migrasi sudah aktif di produksi.
- Label bukti: **reproduksi** = perilaku dibuktikan lokal; **statis** = jalur kode ditemukan; **helper** = ekspor ditemukan tetapi pemanggil UI utama belum ditemukan; **deployment belum diketahui** = kode SQL arsip, bukan konfirmasi konfigurasi server aktif.

## Temuan prioritas

P0 berarti harus ditutup sebelum memperluas penggunaan operasional; bukan pernyataan bahwa insiden sudah terjadi. P1 dikerjakan sebelum pilot dinyatakan lengkap. P2 merupakan peningkatan setelah alur inti tervalidasi.

### P0 — data dan status yang dapat menyesatkan keputusan

**LIS-01 · Dashboard menampilkan angka pengganti sebagai aktivitas nyata — reproduksi.**

`ava-platform/modules/lab/tat.js:85` memakai `n_total || 48`, `n_tuntas || 42` dan sejumlah hitungan tetap. Median kosong/nol ditampilkan sebagai 45 menit. Nilai nol yang sah ikut tertimpa. Pengguna tidak bisa membedakan laboratorium belum memiliki data dengan performa yang benar-benar terukur.

Perbaikan: pisahkan loading, tidak ada data, gagal memuat dan data valid; tampilkan nol tanpa fallback; hitung seluruh kartu dari rentang/tenant yang sama. Uji penerimaan: respons kosong tidak menghasilkan pasien atau median rekaan; filter tanggal di tampilan sama dengan filter permintaan. SLA berasal dari kebijakan lab, bukan klaim standar dari angka tetap.

**LIS-02 · Grafik analyzer yang tampil adalah grafik sintetis — statis.**

`results.js:181` menampilkan kartu “ANALYZER GRAPHIC (SCAT/HIST)” dan “SYSMEX XN-SERIES”; `results.js:618` menggunakan `Math.random()` untuk scatter. Grafik ini bukan payload hasil instrumen, sementara kartu hasil tidak menjelaskan bahwa isinya simulasi.

Perbaikan: sembunyikan grafik bila tidak ada payload instrumen yang terverifikasi; untuk demo, beri penanda simulasi yang selalu terlihat dan pisahkan dari laporan operasional. Nama vendor tidak dipasang sebagai branding AVA LIS. Nama alat aktual tetap boleh muncul dalam konfigurasi/perangkat yang memang digunakan. Uji: membuka ulang hasil tidak mengubah grafik, dan setiap grafik dapat ditelusuri ke pesan/berkas instrumen.

**LIS-03 · Status panel terlalu cepat selesai dan hubungan tabung–tes tidak konsisten — reproduksi.**

`worklist.js:87` memakai `some(Approved/Released)` untuk status tes. Satu analit Approved bersama satu analit Draft kosong menghasilkan status “Approve”. Selain itu, satu sampel dengan nama gabungan “Tes A, Tes B” beserta dua produk hasil menghasilkan tiga entri: satu entri gabungan semu dan dua tes sebenarnya.

Perbaikan: hitung status dari seluruh analit wajib yang aktif; simpan status parsial secara eksplisit. Kelompokkan pasien, order, layanan, analit dan tabung dengan ID relasional, bukan gabungan nama tampilan. Uji panel parsial, pembatalan analit, tes tambahan pada tabung lama dan beberapa tabung untuk satu layanan.

**LIS-04 · Keberhasilan validasi/rilis tidak mengikuti hasil penyimpanan — reproduksi.**

`validation.js:359` mengabaikan kegagalan patch individual dan melaporkan jumlah awal sebagai jumlah tervalidasi. `validation.js:373` mengirim event rilis ketika ada baris yang diproses, termasuk saat seluruh patch gagal. Approval juga langsung mengisi metadata released; `index.js:212` menganggap Approved dan Released sama.

Perbaikan: transisi status di server dengan otorisasi, pemeriksaan versi, hasil transaksi yang eksplisit dan event setelah commit. Definisikan apakah otorisasi sekaligus rilis atau dua tindakan; jangan memakai dua istilah dengan arti yang berubah antarhalaman. Uji gagal jaringan, satu baris gagal, klik ganda dan dua petugas bersamaan. Jumlah berhasil harus persis sesuai data yang tersimpan; transaksi gagal tidak mengirim event rilis.

**LIS-05 · Dua evaluator QC memberi keputusan berbeda — reproduksi dan statis.**

`qcEngine.js` menerima pengukuran nonnumerik sebagai PASS. Pola 10x menghasilkan WARNING pada evaluator operasional `qc.js:259`, tetapi REJECT pada `qcEngine.js`. Seri di `qc.js:77` dikelompokkan berdasarkan alat dan nama tes tanpa pembatas lot/level pada filter tersebut. Evaluasi R-4s menggunakan titik berurutan; batas run perlu dimodelkan secara eksplisit.

Perbaikan: satu evaluator dengan input tervalidasi, identitas run/material/level/lot, konfigurasi aturan berversi dan contoh uji yang disahkan penanggung jawab lab. Jangan sekadar menambah jumlah aturan agar menyamai brosur. R-4s dijelaskan sebagai aturan dalam satu run oleh [sumber primer Westgard](https://www.westgard.com/westgard-rules.html); aturan yang dipilih dan tindakan akhirnya harus mengikuti SOP lab yang disahkan. Integrasi keputusan QC ke penjagaan rilis hasil masih perlu dibuktikan di server.

**LIS-06 · Autoverifikasi belum menunjukkan penjagaan yang memadai — reproduksi; deployment SQL belum diketahui.**

`autoverify.js:22` membaca `ref_low/ref_high`, sementara hasil operasional memakai `normal_min/normal_max`. RPC `mark_autoverified` yang ditemukan di `ava-platform/sql_arsip/04_roadmap_fase/supabase_fase5_lis.sql:145` hanya memeriksa autentikasi sebelum mengubah status. Reproduksi definisi tersebut dapat mengubah hasil kritis Released menjadi Validated tanpa evaluasi aturan, QC, status atau tenant. **Belum dibuktikan bahwa definisi arsip ini terpasang di server.** Default fitur yang nonaktif adalah pembatas positif.

Perbaikan: inventaris definisi RPC/RLS staging yang aktif, lalu samakan kontrak field dan pindahkan evaluasi wajib ke server. Aktivasi autoverifikasi hanya setelah aturan, pengecualian dan audit disahkan. Uji hasil kritis, hasil sudah rilis, QC gagal, range tidak tersedia, tenant berbeda dan versi aturan berubah.

**LIS-07 · Riwayat berbasis nama dan QR laporan perlu diperbaiki — statis.**

`results.js:225,536` dan `report.js:100` mencari riwayat dengan `patient_name`. Dua pasien bernama sama berpotensi tercampur. Query tren mengambil 30 terlama dan belum membatasi semua jalur pada hasil yang sudah dirilis. `report.js:203` mengirim URL berisi nomor kunjungan ke `api.qrserver.com` untuk membuat gambar QR; pengodean URL tidak menghilangkan identitas kunjungan. Label “QR Signature” dan pengaturan penanda tangan di localStorage bukan bukti tanda tangan kriptografis.

Perbaikan: gunakan patient ID dalam tenant, analit terpetakan dan hasil final untuk tren; buat QR secara lokal dan gunakan token verifikasi terbatas. Laporan final perlu versi, otorisator, waktu rilis dan riwayat koreksi yang tersimpan di server. Uji nama sama, pasien gabungan/pemisahan identitas, hasil revisi dan akses laporan tenant lain. Jangan tampilkan klaim PKI sebelum implementasinya diverifikasi.

### P1 — keandalan operasional dan kelengkapan alur

**LIS-08 · Kegagalan muat disamarkan menjadi data kosong — statis.** `index.js:285` membatasi sampel 200 dan hasil 300; kegagalan baca menjadi array kosong. Layar dapat menyatakan semua sudah tervalidasi ketika permintaan justru gagal. Tambahkan pagination/server count, status error dan retry; uji lebih dari 300 hasil dan kegagalan API. Fallback master pada jalur lama juga harus diberi batas demo yang jelas; admisi baru sudah menggunakan katalog API.

**LIS-09 · Connector nyata ada, tetapi durability dan validasi frame perlu diperkuat — statis.** `ava-platform/connector/ava-connector.js:77` menyimpan antrean ingest di memori. Restart setelah ACK sebelum penyimpanan dapat menghilangkan pesan. Cabang penerimaan ASTM sekitar baris 185 mengupas checksum tetapi belum memperlihatkan validasi checksum/urutan frame sebelum ACK. Pesan gagal dapat menahan antrean tanpa dead-letter. Perbaikan: inbox tahan restart, ACK sesuai protokol dan titik penyimpanan yang didefinisikan, deduplikasi, validasi frame, retry/dead-letter dan rekonsiliasi. Uji instrumen/transport belum dilakukan; jangan menyatakan koneksi alat siap hanya dari simulator. Pengiriman keluar memiliki logika ACK/NAK sendiri dan tidak boleh disamakan dengan cabang penerimaan.

**LIS-10 · Pelaporan nilai kritis memiliki dua jalur status — statis.** `index.js:626` menulis log dan acknowledgment hasil lewat dua permintaan. Pengguna dapat meneruskan status Berhasil tanpa read-back melalui konfirmasi. Jalur logbook di `criticalValue.js:183` memperbarui log tetapi tidak melakukan pembaruan acknowledgment hasil yang sama. Satukan transaksi, kebijakan penyelesaian, penerima, upaya gagal, read-back dan eskalasi sesuai SOP. Bedakan waktu deteksi nilai kritis dari waktu pembuatan log; ukur SLA dari titik yang disepakati.

**LIS-11 · Pengaturan klinis belum menjadi kebijakan terpusat — statis.** `settings.js:37` menyimpan pengaturan/parameter kritis pada localStorage. Perubahan satu workstation belum terbukti berlaku bagi mesin aturan dan petugas lain. Tinjau pula penggunaan warna merah sebagai fallback status kritis di `index.js:201`, serta pencocokan range ketika umur/jenis kelamin kosong di `index.js:225`. Kebijakan harus berversi, berotorisasi dan ditelusuri; data demografi yang kurang jangan diam-diam dianggap cocok untuk semua rentang. Perubahan master harus melalui checkpoint terpisah.

**LIS-12/LIS-13 · Helper simulasi masih meniru keberhasilan — reproduksi, bukan bukti jalur UI utama.** Helper arsip `sampleArchiving.js:208` mengembalikan lokasi default untuk barcode tidak dikenal; parser simulator `analyzerInterfacing.js:267` menerima frame kosong dengan accession rekaan. Helper critical-value juga memiliki stub sukses. Pemanggil utama belum ditemukan; UI arsip dan logbook memiliki jalur DB nyata. Pisahkan helper demo/test dari ekspor runtime atau buat gagal eksplisit. Jangan menghapus fungsi nyata berdasarkan keberadaan stub saja.

**LIS-14 · Jalur walk-in lama berpotensi membuka kembali alur terpisah — statis, pemanggil utama belum ditemukan.** `checkin.js:539,641` masih mengekspor form/submit yang membuat admisi dan sampel langsung tanpa kontrak sinkronisasi baru, memakai barcode pendek acak dan waktu koleksi/terima otomatis. Redirect atau pensiunkan jalur ini setelah memastikan seluruh pemanggil. Alur admisi baru sudah memakai API HIS–LIS; temuan ini tidak berarti tombol utama masih menggunakan jalur lama.

**LIS-15 · Kontrol akses dan keluaran HTML memerlukan pengujian staging — statis/belum teruji.** Sejumlah template menginterpolasi nama/catatan ke HTML tanpa escaping seragam; ada modul lain yang sudah memiliki escape helper. Audit stored-HTML injection dengan fixture sintetis. Uji RLS/role pada setiap endpoint, bukan hanya penyembunyian menu; khususnya hasil, laporan, QC, ekspor dan administrasi. Tidak ada eksploitasi produksi dilakukan dalam audit ini.

## Matriks terhadap brosur

| Area referensi | Kondisi AVA yang ditemukan | Kelengkapan berikutnya / bukti penerimaan |
|---|---|---|
| Order, quick entry, duplikasi, barcode — h.3 | Admisi API baru, katalog, panel analit dan retry tersedia | Peringatan duplikasi klinis dengan alasan override; identitas order/layanan/tabung konsisten; revisi masuk HIS |
| Penerimaan, penolakan, arsip — h.4 | Modul pengambilan, check-in, kelayakan dan arsip tersedia | Scan tak dikenal ditolak; timestamp hanya saat tindakan; pengambilan ulang dan jejak lokasi terbukti |
| Rujukan lab — h.4 | Modul rujukan tersedia | Buktikan kirim–terima–hasil eksternal–review–rilis; SLA, lampiran dan pembatalan tertelusur |
| Hasil, review, amend, repeat, panic — h.5 | Input, validasi, approval dan nilai kritis tersedia | Tutup LIS-02/03/04/07/10; koreksi hasil final membuat versi baru beserta alasan, tanpa menimpa laporan lama |
| QC/LJ, multirule — h.6 | Log QC, grafik dan evaluator tersedia | Satu evaluator tervalidasi; run/lot/level benar; kaitan keputusan QC dengan hasil pasien |
| Reagen dan persediaan — h.6 | Modul inventori memiliki lot, kedaluwarsa dan FEFO | Buktikan konsumsi berdasarkan pemakaian aktual dan koreksi stok; jangan mengasumsikan kalkulasi konsumsi sudah terhubung |
| Riwayat dan distribusi laporan — h.7 | Tren, cetak dan QR tersedia | Patient ID, hasil final, keamanan penerima, versi laporan dan status pengiriman |
| Dashboard/manajemen — h.8 | TAT dan kartu indikator tersedia | Hapus seluruh angka simulasi; hitungan dapat direkonsiliasi dengan daftar kasus yang mendasari |
| Mikrobiologi/AP/bank darah — h.10 | Belum dibuktikan alur khusus lengkap dalam audit | Backlog opsional setelah kebutuhan satu klien terbukti; tidak menambah menu kosong sebagai klaim kemampuan |
| Multisite, interface, akses/audit — h.11 | Connector nyata; kontrak layanan baru memeriksa tenant/peran | Durability, tes dua tenant lintas modul, matriks hak tindakan dan audit perubahan server |

Brosur bukan daftar kewajiban implementasi. Fitur yang tidak sesuai pilot dapat ditunda; hak akses, identitas, status hasil dan kebenaran data tidak dapat digantikan oleh banyaknya menu.

## Rancangan navigasi dan pengalaman operator

Tema navy–teal dan pengelompokan menu yang sudah dirapikan dapat dipertahankan. Kesan premium operasional dibangun lewat kepastian status, konteks pasien yang jelas, ruang baca dan tindakan yang konsisten. Hindari dekorasi yang menutupi prioritas kerja.

| Kelompok target | Menu yang disarankan | Catatan |
|---|---|---|
| Ringkasan | Ringkasan Lab | Antrean nyata, keterlambatan, nilai kritis dan sinkronisasi bermasalah; setiap angka membuka daftar terkait |
| Pasien & Sampel | Permintaan Pemeriksaan; Pengambilan Sampel; Penerimaan Sampel; Kelayakan Sampel | Pertahankan rute admisi/check-in; tindakan scan dominan, identitas pasien selalu terlihat |
| Proses Pemeriksaan | Antrean Pemeriksaan; Hasil Pemeriksaan; Rujukan Lab | Filter area kerja/alat, prioritas dan status spesimen; jangan membuat pemeriksaan ganda dari satu tabung |
| Verifikasi & Rilis | Verifikasi Teknis; Otorisasi & Rilis; Nilai Kritis | `lab-validation` sekarang diberi label Tinjauan Dokter Sp.PK padahal melakukan Draft→Validated; `lab-approval` adalah approval. Selaraskan label dan kewenangan sebenarnya |
| Mutu Lab | Kendali Mutu; Lot Kontrol; Uji Profisiensi | Menu Verifikasi Lot Reagen saat ini membaca lot kontrol QC. Gunakan nama sesuai domain; lot-to-lot reagen merupakan proses tersendiri |
| Laporan & Arsip | Laporan Hasil; Kinerja & TAT; Arsip Sampel | Laporan historis terpisah dari antrean validasi; hasil revisi dapat ditelusuri |
| Katalog & Persediaan | Katalog Pemeriksaan; Paket; Nilai Rujukan; Persediaan; Ekspor Katalog | Perubahan master berotorisasi. Tarif/tagihan tetap di HIS; jangan menambahkan kasir LIS |
| Pengaturan & Bantuan | Perangkat & Koneksi; Pengaturan Lab; Bantuan | Rincian teknis tersedia bagi admin; operator menerima pesan pemulihan yang bisa dilakukan |

Usulan label tidak mengubah route ID atau RBAC. Singkatan yang berguna seperti QC, TAT, Sp.PK, LOINC dan UCUM tetap ada pada konteks yang relevan.

Perapihan layar yang diperlukan:

1. Header pasien ringkas dan tetap terlihat: ID/MR, nama, tanggal lahir/umur, kunjungan, barcode, prioritas dan sumber order.
2. Satu tindakan utama per tahap; pisahkan simpan draft, verifikasi, otorisasi, rilis dan koreksi. Tombol menampilkan pending/sukses/gagal berdasarkan server.
3. Grid validasi `validation.js:65` memakai kolom 240px + konten + 260px. Buat panel detail dapat dilipat pada layar kecil; uji 1366px, 1024px dan 768px dengan tabel panjang. Ini temuan struktur kode, bukan hasil screenshot lintas viewport.
4. Kurangi teks 9–11px, label kapital panjang, navigasi internal berulang dan istilah Inggris yang tidak diperlukan. Sediakan fokus keyboard/scan, kontras status, serta teks selain warna.
5. Hilangkan pesan instruksi SQL dari layar operator; tampilkan pesan layanan belum tersedia dengan langkah yang jelas. Rincian diagnostik berada pada akses admin.
6. Benahi encoding karakter pada modul logistik dan konsistensi kosong/loading/error. Jangan menyimpulkan semua hasil selesai dari daftar kosong.

## Alur end-to-end yang dituju

1. HIS membuat kunjungan dan permintaan, atau LIS mendaftarkan/mengubah layanan melalui API yang sama. Keduanya memakai identitas kunjungan dan tenant yang konsisten.
2. HIS menerima perubahan layanan untuk rekonsiliasi tagihan. LIS menampilkan status diterima/pending/gagal sinkronisasi tanpa nominal pembayaran. Perubahan pada tagihan final mengikuti proses koreksi HIS.
3. LIS menyiapkan kebutuhan tabung dan barcode setelah acknowledgment server; petugas mencatat pengambilan dan penerimaan pada waktu kejadian.
4. Sampel layak masuk area kerja; penolakan/pengambilan ulang memiliki alasan dan hubungan ke spesimen awal.
5. Hasil manual/instrumen tersimpan sebagai draft dengan asal, satuan, range dan versi yang dapat ditelusuri. Payload instrumen tidak diganti grafik sintetis.
6. Verifikasi teknis menilai kelengkapan analit dan penjagaan sesuai SOP; nilai kritis mengikuti jalur komunikasi/eskalasi; keputusan QC terkait dapat ditelusuri.
7. Otorisasi dan rilis mengikuti kewenangan yang disahkan. Server mengonfirmasi transaksi sebelum event dan laporan final dibuat.
8. HIS/portal menerima hasil final beridentitas dan berversi. Koreksi membuat versi baru beserta alasan dan jejak distribusi. Sampel diarsipkan dengan lokasi serta retensi sesuai kebijakan.

## Urutan perbaikan dan uji penerimaan

Setiap butir berikut adalah irisan kerja awal ≤1 jam; pekerjaan lanjutan dipecah lagi setelah bukti awal tersedia.

| Urutan | Irisan pertama | Bukti wajib sebelum melanjutkan |
|---|---|---|
| 1 | Hilangkan fallback TAT/grafik operasional rekaan | Fixture kosong/nol/error; tidak ada data klinis sintetis tersamar |
| 2 | Benahi agregasi panel dan pemetaan tabung | Kasus panel parsial/multi-tes tidak salah selesai atau berlipat |
| 3 | Rancang kontrak transisi verifikasi/rilis dan kasus gagal | Transaksi/event konsisten; review otoritas klinis dan checkpoint bila perlu skema |
| 4 | Ubah pencarian riwayat ke identitas stabil dan tinjau QR | Dua pasien bernama sama tidak bercampur; tidak ada request QR pihak ketiga berisi kunjungan |
| 5 | Inventaris evaluator QC/RPC aktif di staging | Satu kontrak aturan dan kasus uji disetujui; tidak mengaktifkan autoverifikasi prematur |
| 6 | Satukan kontrak nilai kritis | Gagal parsial tidak menghasilkan acknowledgment palsu |
| 7 | Uji fault connector dengan pesan sintetis | Restart, checksum salah, duplikasi, putus jaringan, retry dan rekonsiliasi terdokumentasi |
| 8 | Samakan menu/status dan perbaiki responsivitas | Tugas operator selesai dengan keyboard/scan; peran dan viewport berbeda diuji |
| 9 | Pilot satu alur di staging lalu uji terbatas | Order HIS→sampel→hasil→QC/critical bila relevan→rilis→HIS→revisi→arsip tertelusur |

Gate staging tambahan: pembatasan dua tenant pada seluruh endpoint; peran tanpa hak tidak bisa memanggil aksi langsung; lebih dari 300 hasil tetap terlihat; billing pending tidak dianggap selesai; laporan draft tidak terkirim sebagai final; log mencatat pelaku/waktu/alasan tanpa menyimpan data pasien dalam fixture.

## Cara mengulang bukti lokal

Jalankan dari akar repo dengan dependensi desktop yang sudah tersedia:

```powershell
node scripts/audit-lis-deep.cjs
node scripts/verify-lis-his-sync.cjs
```

Skrip pertama merupakan **characterization test**: hasil OBSERVED berarti cacat berhasil direproduksi, bukan fitur lulus penerimaan. Setelah perbaikan, kasus tersebut perlu diubah menjadi assertion perilaku benar. Skrip kedua menguji kontrak sinkronisasi lokal; keduanya tidak mengakses produksi.

## Implikasi IP & Kepatuhan

Tidak menyalin logo, tata letak atau klaim pemasaran HCLAB ke produk. Tidak mengubah Kode Material/Nama Pemeriksaan, kolom range atau data pasien. Tidak mengklaim sertifikasi ISO, kesetaraan dengan HCLAB atau implementasi tanda tangan digital yang belum dibuktikan. Referensi QC digunakan untuk menunjukkan kebutuhan definisi aturan yang tepat; SOP dan konfigurasi klinis harus ditetapkan pihak berwenang. Audit deployment, perubahan skema dan aktivasi integrasi merupakan langkah terpisah dari laporan ini.
