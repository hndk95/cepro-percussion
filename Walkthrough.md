# Walkthrough – Bot WhatsApp Reminder Lokal 🤖

Sistem pengingat otomatis WhatsApp sudah selesai dibuat! Bot ini bersifat lokal, 100% gratis, dan akan berjalan di komputer Anda untuk mengambil jadwal dari Google Sheet lalu mengirimkan pengingat H-30, H-14, dan H-5.

---

## 📌 Langkah 1: Update Google Sheet Anda
1. Buka file Google Sheet Anda.
2. Buat sheet/tab baru di bagian bawah dengan nama persis: **`Data Pemain`**
3. Di sheet tersebut, isi baris pertama (header) dengan:
   - Kolom A: `Nama`
   - Kolom B: `Nomor WA`
4. Masukkan data anggota Anda. **Gunakan format `62` (contoh: `628123456789`)**. Huruf besar/kecil di nama tidak masalah, bot akan otomatis mencocokkannya.

---

## 📌 Langkah 2: Update Google Apps Script
Karena saya telah mengubah kode `AppScript_Backend.gs` untuk mendukung penarikan data dari `Data Pemain`:
1. Buka file `AppScript_Backend.gs` di VSCode/editor Anda, copy semua isinya.
2. Buka `script.google.com`, paste & timpa kode lama.
3. Lakukan **New Deployment** (Deploy → Manage Deployments → Edit ✏️ → Version: New version → Deploy).

---

## 📌 Langkah 3: Cara Menjalankan Bot WA

Bot ini berada di folder `wa-bot` yang baru saja dibuat di dalam folder proyek Anda.

1. Buka terminal (command prompt) di laptop Anda.
2. Pindah ke direktori bot:
   ```bash
   cd wa-bot
   ```
3. Jalankan bot dengan perintah:
   ```bash
   node index.js
   ```
4. Terminal akan memunculkan sebuah **QR Code besar**. Buka aplikasi WhatsApp di HP Anda (Pilih *Linked Devices* / *Perangkat Taut*) lalu **scan QR Code tersebut**.
5. Selesai! Akan muncul pesan: `Bot WhatsApp CEPRO PERCUSSION sudah siap dan terkoneksi!`.

> [!TIP]
> Biarkan jendela terminal/command prompt ini tetap terbuka (jangan ditutup). Selama terminal tidak ditutup dan laptop tidak mati, bot akan otomatis mengirim pengingat setiap pukul **14:00 siang**.

---

## 📌 Fitur Cek Manual (`!ceksekarang`)
Jika Anda tidak ingin menunggu hingga pukul 14:00 untuk melakukan pengetesan:
1. Pastikan bot sedang berjalan di terminal.
2. Buka WhatsApp Anda, kirim pesan ke diri Anda sendiri (atau minta salah satu teman mengirimkan pesan ke nomor bot Anda) berisi:
   **`!ceksekarang`**
3. Bot akan membalas *"Sedang mengecek jadwal..."*, lalu secara instan menjalankan fungsi pengecekan. Jika ada anggota yang jadwalnya jatuh pada H-30/14/5, pesan akan langsung dikirim ke mereka!
