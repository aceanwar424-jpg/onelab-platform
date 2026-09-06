# Audit Struktur Operasional HIS — 6 September 2026

## Ruang lingkup dan batas

Audit ini membaca struktur referensi yang diberikan dan implementasi lokal AVA.
Tidak ada transaksi, data pasien, rekam medis, penggajian, maupun pengiriman
SATUSEHAT yang dilakukan. Fokusnya adalah struktur menu dan workflow sebelum
rancangan ulang disetujui.

## Ringkasan temuan

| Klaster referensi | Modul AVA yang tersedia | Penilaian | Gap utama |
|---|---|---|---|
| Finance | Kasir, invoice, pembayaran, AR aging, hutang, buku besar, laporan, aset, payroll | Ada namun tersebar | Rekonsiliasi bank, credit note, approval/period lock, pajak, dan pusat biaya belum terlihat sebagai workflow utuh |
| Medical Record | Arsip RM, MPI, governance/retensi, EMR, anamnesa | Ada namun terpecah | Satu hub RM belum menyatukan dokumen, coding, persetujuan, disclosure, dan timeline klinis secara konsisten |
| Package Service | Master paket/panel, item paket, registrasi paket, langganan, pemakaian hak | Ada namun bercampur | Konfigurasi, penjualan, entitlement, dan penebusan belum dipisahkan secara otoritatif; ledger entitlement server-side belum ada |
| Remuneration | Payroll, komisi sales, fee Home Care, presensi/roster | Belum ada sebagai domain | Belum ada mesin periode, aturan komponen, approval, posting, slip, serta jejak perubahan tunggal |
| SATUSEHAT | Status koneksi, log, peta resource, antrean manual Patient/Encounter/Condition/Observation | Ada, dengan batas aman | Cakupan resource, retry/exception queue, rekonsiliasi, dan tata kelola peran perlu diperdalam sebelum produksi |
| Workforce | Database karyawan, struktur organisasi, roster, kalender shift, presensi, tugas | Ada namun tersebar | Cuti, kompetensi/privilege, penugasan per layanan, timekeeping lock, evaluasi, dan keterkaitan remunerasi belum menjadi satu alur |

## Workflow yang ditemukan

### 1. Finance

`Admission/layanan → Kasir atau Invoice → Pembayaran → Piutang/aging →
Pembukuan → Laporan`

Untuk layanan home care dan korporat, fee/komisi juga dapat muncul pada modul
tersendiri. Posisi saat ini cukup untuk operasi dasar, tetapi menu dan data
komisi masih tersebar antara Finance, Home Care, dan Payroll. Rancangan nanti
harus membedakan **transaksi pasien**, **AR korporat**, **AP supplier**,
**GL/closing**, dan **remunerasi**.

### 2. Medical Record

`Admission → Anamnesa → EMR/CPPT → Order → hasil Lab/Radiologi/Penunjang →
arsip RM → governance/retensi`

Arsip RM sudah dapat menampilkan kunjungan, anamnesa, lab, radiologi, dan
penunjang. MPI serta governance/retensi berada di menu lain. Ini benar secara
otoritas data, tetapi pengguna masih perlu memahami tiga lokasi terpisah.
Rancangan menu yang disarankan: **Rekam Medis Operasional**, **MPI & Identitas**,
dan **Tata Kelola/Permintaan Salinan**.

### 3. Package Service

`Master paket & item → penawaran/kontrak (bila korporat) → registrasi paket →
tagihan → hak aktif → pemakaian hak → layanan/hasil`

Master paket adalah konfigurasi dan harus dipisahkan dari operasi front desk.
Mode registrasi paket/langganan/pemakaian sudah ada di Admission. Namun saldo,
masa berlaku, pembatalan, serta penebusan bersamaan belum aman tanpa ledger
entitlement server-side. Ini adalah checkpoint skema/data sebelum implementasi
lebih lanjut.

### 4. Remuneration

Alur target yang belum tersedia sebagai satu domain:

`Kontrak & komponen gaji → roster/presensi terkunci → insentif/fee/komisi dari
layanan → kalkulasi periode → review atasan → approval finance → posting payroll
→ slip & audit trail`

Saat ini Payroll menghitung penggajian, Finance memiliki komisi sales, dan Home
Care memiliki fee nakes. Ketiganya tidak boleh dipertahankan sebagai tiga
perhitungan final berbeda karena risiko pembayaran ganda dan audit sulit.

### 5. SATUSEHAT

`Data lokal siap → Patient → Encounter → Condition/Observation → catatan peta
resource & log HTTP → penanganan gagal`

Implementasi saat ini secara tepat tidak menyatakan siap bila kredensial tidak
tersedia, dan pengiriman dilakukan manual per entitas. Sebelum otomasi produksi,
perlu ditetapkan owner, approval pengiriman, retry terbatas, rekonsiliasi ID,
dan penanganan perubahan data setelah terkirim.

### 6. Workforce

`Master karyawan → struktur/role → kompetensi & izin → roster → presensi →
penugasan/tugas → evaluasi → input remunerasi`

AVA telah memiliki master, organisasi, roster, kalender shift, presensi, dan
tugas. Kompetensi klinis, STR/SIP, privilege, cuti, substitusi shift, serta
hubungan presensi-ke-payroll masih tersebar atau belum menjadi alur baku.

## Rekomendasi pengelompokan saat implementasi nanti

1. **Keuangan & Remunerasi**: Pisahkan transaksi klinik/kasir, AR/AP,
   pembukuan, aset, lalu Remunerasi sebagai domain khusus dengan approval period.
2. **Rekam Medis**: Jadikan satu kategori dengan tiga grup: operasional RM,
   master identitas/MPI, dan tata kelola/retensi.
3. **Paket & Membership**: Letakkan master paket di Administrasi Sistem;
   pendaftaran, hak aktif, dan penebusan di Alur Pasien/Bisnis Korporat.
4. **SATUSEHAT**: Tetap di Kepatuhan & Integrasi, bukan operasional harian;
   pisahkan status, antrean kirim, log/reconciliation, serta setup yang dibatasi.
5. **Workforce**: Kelompokkan personalia, jadwal & kehadiran, kompetensi/izin,
   kinerja, dan data untuk remunerasi.

## Prioritas sebelum implementasi

1. Tentukan kebijakan ledger entitlement paket/langganan.
2. Tetapkan sumber final remunerasi dan approval payroll.
3. Tetapkan pemilik proses dan SOP pengiriman SATUSEHAT.
4. Tetapkan kebijakan akses/retensi/disclosure rekam medis.
5. Standarkan master kompetensi, STR/SIP, serta relasi roster-presensi.
