# Layanan LIS dan tagihan HIS

OWNED_BY: ava · 6 September 2026

LIS memilih pemeriksaan dan menangani sampel. HIS menetapkan tarif, diskon, tagihan dan pembayaran. Pengiriman memakai API RPC pada backend bersama; tidak membutuhkan login silang atau penyalinan nominal dari LIS.

## Perilaku yang diterapkan

- Branding workstation menjadi **AVA LAB — Permintaan Pemeriksaan**. Harga per tes, kolom tarif, estimasi total dan harga preset dihapus dari admisi LIS.
- **Muat Order HIS** mencari nomor kunjungan dalam tenant pengguna, lalu mengisi identitas pasien dan pilihan pemeriksaan. ID admisi yang sama dipakai saat disimpan.
- Registrasi baru dari LIS membuat satu admisi HIS. Nomor kunjungan dan barcode berasal dari ID server, bukan angka acak tiga digit.
- Penambahan/perubahan layanan memperbarui `admissions.services` dan menandai `lis_billing_pending`. Layanan non-lab serta tarif/diskon layanan yang tetap dipilih dipertahankan.
- Di daftar admisi HIS tampil **Layanan LIS diperbarui**. Saat admisi dibuka, layanan baru mengambil tarif dari katalog HIS. Petugas meninjau diskon dan menyimpan rekonsiliasi sebelum pembayaran. Nilai tagihan lama tidak ditampilkan sebagai tagihan final di baris yang menunggu rekonsiliasi.
- Penerimaan order HIS dengan pilihan yang sama tidak membuka ulang tagihan, termasuk order yang sudah dibayar. Perubahan layanan pada tagihan yang sudah diproses harus melalui HIS.
- Penghapusan tes yang sudah memiliki hasil aktif ditolak. Pembatalan harus melewati alur klinis terlebih dahulu; API tagihan tidak menghapus hasil pemeriksaan.

## Kontrak API

Seluruh fungsi di bawah berada pada `/rest/v1/rpc/<nama>` dan memakai sesi pengguna melalui `sbRpc`. Tenant dan peran diperiksa dari `user_profiles` di server, bukan dari payload browser.

| Fungsi | Tanggung jawab |
|---|---|
| `lis_his_catalog()` | Katalog LAB aktif milik tenant, tanpa nominal harga. Tidak memakai katalog demo sebagai pengganti. |
| `lis_his_load_visit(p_visit)` | Identitas dan pemeriksaan order HIS beserta snapshot layanan untuk mendeteksi konflik. |
| `lis_his_submit_order(p_request_id, p_body)` | Membuat/menautkan admisi dan menyinkronkan ID layanan. UUID permintaan menghindari duplikasi ketika dikirim ulang. |
| `lis_his_prepare_samples(p_request_id, p_tubes)` | Membuat sampel dan draft analit secara atomik; tes yang sudah mempunyai hasil aktif tidak dibuat ulang. Mengembalikan label barcode setelah berhasil. |
| `his_finalize_lis_services(p_admission_id, p_snapshot, p_bill)` | Petugas HIS menetapkan tagihan berdasarkan snapshot layanan yang sama. Menolak data stale, tarif belum lengkap, dan total tidak konsisten. |

Sinkronisasi layanan dan penyiapan sampel merupakan dua transaksi yang dapat diulang. Jika layanan berhasil diterima tetapi sampel gagal dibuat, pengiriman ulang dalam sesi form yang sama memakai UUID/payload lama dan melanjutkan penyiapan sampel. Harga tidak dikirim oleh LIS. Saat pengiriman belum selesai, pilihan/payload dibekukan agar pengguna tidak tanpa sadar mengirim versi berbeda dengan UUID yang sama.

API penyiapan sampel mempertahankan pemecahan panel ke analit serta kode item, unit, LOINC dan host code yang tersedia. Waktu pengambilan/penerimaan tidak diisi dengan waktu registrasi; petugas mencatat kejadian yang sebenarnya pada alur sampel.

## Aktivasi

Kode aplikasi dan migrasi `db/migrations/0051_lis_his_service_sync.sql` perlu dirilis bersama. **Migrasi belum diterapkan ke database produksi dalam pekerjaan ini.** Jika API belum tersedia, admisi LIS menampilkan kegagalan katalog dan tidak diam-diam kembali membuat order melalui jalur lama.

Sebelum aktivasi:

1. Jalankan migrasi pada staging yang memiliki skema admisi, produk, sampel, hasil dan `product_items` aktual. Uji juga kebijakan akses deployment tersebut.
2. Pastikan profil pengguna memiliki tenant dan peran yang sesuai. API membutuhkan sesi terautentikasi; tidak memberikan akses `anon`.
3. Verifikasi pemetaan tenant untuk admisi lama. Migrasi tidak mengasumsikan semua data historis milik satu tenant dan tidak melakukan backfill massal. Admisi baru mendapatkan tenant pengguna melalui trigger.
4. Uji penerimaan HIS→LIS, registrasi baru LIS, add-on, pembatalan klinis, rekonsiliasi HIS dan pembayaran pada data sintetis staging. Tagihan/pembayaran historis tidak diubah oleh migrasi.

Pembayaran tetap menjadi proses HIS. Ini menyinkronkan **rincian layanan untuk tagihan**, bukan menandai pembayaran otomatis. Daftar HIS membaca perubahan saat dimuat ulang/dibuka; tidak ada klaim push realtime. UUID retry berada di memori sesi form: jika halaman ditutup setelah respons tidak pasti, cari kunjungan pada HIS sebelum membuat registrasi baru.

## Bukti verifikasi

`node scripts/verify-lis-his-sync.cjs` menjalankan SQL migrasi dan RPC aktual pada PostgreSQL lokal PGlite dengan fixture sintetis. Dependensi berasal dari `desktop-app/node_modules`; `PGLITE_PATH` dapat menunjuk instalasi tes terisolasi.

Lulus: pembatasan tenant/peran/anon, katalog tanpa harga, registrasi dan retry, konflik snapshot, add-on tanpa duplikasi, pemecahan panel, retry sampel, perlindungan pembatalan klinis, blok pembayaran sebelum rekonsiliasi, penetapan tarif HIS, dan penerimaan order berbayar tanpa membuka tagihan. Uji frontend memeriksa payload retry identik tanpa harga serta barcode setelah konfirmasi API.

Browser lokal diperiksa memakai katalog sintetis tanpa koneksi DB: judul AVA LAB tampil, pemilihan tes bekerja, ringkasan hanya menampilkan kode/pemeriksaan dan kebutuhan sampel, tanpa kolom tarif maupun estimasi total. Verifikasi produksi dan kompatibilitas penuh skema staging belum dilakukan.
