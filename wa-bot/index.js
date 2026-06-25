const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'sent_logs.json');

// URL Web App Google Script Anda
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxuWStxPqWxilrTes35ztZ12tvvh4U810tVpkN77kROIja7fbxShIiltaJCBYDSarY/exec';

// Posisi pemain yang ada di sheet
const POSITIONS = ['Kacapi', 'Kendang', 'Biola', 'Perkusi', 'Sinden', 'Narator', 'Suling', 'Drum', 'Keyboard'];

// Inisialisasi WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(), // Menyimpan sesi agar tidak perlu scan QR terus
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    // Generate QR Code di terminal
    console.log('Silakan scan QR Code ini menggunakan WhatsApp Anda:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot WhatsApp CEPRO PERCUSSION sudah siap dan terkoneksi!');
    console.log('Scheduler dijadwalkan berjalan setiap pukul 14:00.');
});

// Listener untuk pesan masuk (cek manual dan perintah individual)
client.on('message', async (msg) => {
    const text = msg.body.trim();
    if (text.toLowerCase() === '!ceksekarang') {
        console.log('Perintah manual !ceksekarang diterima.');
        await msg.reply('⏳ Sedang mengecek jadwal dan menyebarkan pengingat...');
        await runScheduler();
        await msg.reply('✅ Pengecekan manual selesai. Pesan telah dikirim ke pemain terkait (jika ada jadwal H-30, H-14, H-5).');
    } else if (text.toLowerCase().startsWith('!jadwalku')) {
        // Format: !jadwalku NamaPemain
        const args = text.split(' ');
        if (args.length < 2) {
            await msg.reply('❌ Format salah. Gunakan perintah: *!jadwalku NamaPemain*\nContoh: *!jadwalku Indra*');
            return;
        }

        const namaPemainQuery = args.slice(1).join(' ').trim().toLowerCase();
        await msg.reply(`⏳ Sedang mencari jadwal untuk *${namaPemainQuery.toUpperCase()}*...`);

        try {
            const response = await axios.get(SCRIPT_URL);
            const data = response.data;

            if (data.status !== 'success') {
                await msg.reply('❌ Maaf, gagal mengambil data dari server.');
                return;
            }

            const jadwalList = data.data || [];
            const today = stripTime(new Date());

            const jadwalPemain = [];

            jadwalList.forEach(jadwal => {
                if (!jadwal.Tanggal || jadwal.Tanggal === '-') return;

                const tglAcara = stripTime(new Date(jadwal.Tanggal));
                // Hanya ambil jadwal yang belum terlewat (hari ini atau di masa depan)
                if (tglAcara >= today) {
                    POSITIONS.forEach(pos => {
                        const namaPemain = jadwal[pos];
                        if (namaPemain && namaPemain !== '-' && namaPemain.trim() !== '') {
                            // Gunakan pengecekan string includes agar jika namanya "Iki Acil" dan orang ketik "Iki", tetap dapat (opsional). 
                            // Untuk amannya kita pakai pengecekan exact lowercase atau string includes.
                            if (namaPemain.trim().toLowerCase().includes(namaPemainQuery)) {
                                jadwalPemain.push({
                                    tanggal: jadwal.Tanggal,
                                    acara: jadwal['Acara dari Siapa'] || jadwal['Acara Dari Siapa'] || 'Tidak ada nama Acara',
                                    posisi: pos
                                });
                            }
                        }
                    });
                }
            });

            if (jadwalPemain.length > 0) {
                // Sort ascending berdasarkan tanggal
                jadwalPemain.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

                let replyMsg = `📅 *Jadwal Mendatang untuk ${namaPemainQuery.toUpperCase()}* 📅\n\n`;
                jadwalPemain.forEach((item, idx) => {
                    replyMsg += `${idx + 1}. *${item.acara}*\n   🗓️ Tanggal: ${formatDateIndo(item.tanggal)}\n   🎸 Posisi: ${item.posisi}\n\n`;
                });
                replyMsg += `Semangat dan pastikan tanggalnya sudah dicatat di kalender pribadi kamu ya! 🚀`;

                await msg.reply(replyMsg);
            } else {
                await msg.reply(`Belum ada jadwal mendatang untuk pemain *${namaPemainQuery.toUpperCase()}*. Santai dulu boss! 🏖️`);
            }

        } catch (err) {
            console.error('Error saat cek !jadwalku:', err.message);
            await msg.reply('❌ Terjadi kesalahan saat memproses permintaan.');
        }
    } else if (text.toLowerCase().startsWith('!cekacara')) {
        // Format: !cekacara NamaAcara
        const args = text.split(' ');
        if (args.length < 2) {
            await msg.reply('❌ Format salah. Gunakan perintah: *!cekacara NamaAcara*\nContoh: *!cekacara a imat*');
            return;
        }
        
        const namaAcaraQuery = args.slice(1).join(' ').trim().toLowerCase();
        await msg.reply(`⏳ Sedang mencari jadwal untuk acara *${namaAcaraQuery.toUpperCase()}*...`);
        
        try {
            const response = await axios.get(SCRIPT_URL);
            const data = response.data;

            if (data.status !== 'success') {
                await msg.reply('❌ Maaf, gagal mengambil data dari server.');
                return;
            }

            const jadwalList = data.data || [];
            const today = stripTime(new Date());
            
            const jadwalAcara = [];
            
            jadwalList.forEach(jadwal => {
                if (!jadwal.Tanggal || jadwal.Tanggal === '-') return;

                const tglAcara = stripTime(new Date(jadwal.Tanggal));
                // Hanya ambil jadwal yang belum terlewat
                if (tglAcara >= today) {
                    const namaAcara = jadwal['Acara dari Siapa'] || jadwal['Acara Dari Siapa'] || '';
                    if (namaAcara.toLowerCase().includes(namaAcaraQuery)) {
                        // Kumpulkan nama-nama pemain yang bertugas
                        let players = [];
                        POSITIONS.forEach(pos => {
                            const p = jadwal[pos];
                            if (p && p !== '-' && p.trim() !== '') {
                                players.push(`${pos}: ${p}`);
                            }
                        });
                        
                        jadwalAcara.push({
                            tanggal: jadwal.Tanggal,
                            acara: namaAcara,
                            players: players.join(', ')
                        });
                    }
                }
            });
            
            if (jadwalAcara.length > 0) {
                // Sort ascending berdasarkan tanggal
                jadwalAcara.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
                
                let replyMsg = `📊 *Data Acara: ${namaAcaraQuery.toUpperCase()}* 📊\n\n`;
                jadwalAcara.forEach((item, idx) => {
                    replyMsg += `${idx + 1}. *${item.acara}*\n   🗓️ Tanggal: ${formatDateIndo(item.tanggal)}\n   👥 Pemain: ${item.players || 'Belum ada'}\n\n`;
                });
                
                await msg.reply(replyMsg);
            } else {
                await msg.reply(`Belum ada jadwal acara yang cocok dengan *${namaAcaraQuery.toUpperCase()}* di masa mendatang. 📆`);
            }
            
        } catch (err) {
            console.error('Error saat cek !cekacara:', err.message);
            await msg.reply('❌ Terjadi kesalahan saat memproses permintaan.');
        }
    }
});

// Scheduler berjalan setiap pukul 14:00
cron.schedule('0 14 * * *', () => {
    console.log('Menjalankan scheduler otomatis pukul 14:00...');
    runScheduler();
});

// Helper Array Bulan Indonesia
const MONTHS_INDO = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Fungsi untuk memformat tanggal ke format "27 September 2026"
function formatDateIndo(dateStr) {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = MONTHS_INDO[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
}

// Fungsi untuk menghapus waktu dari objek Date agar selisih hari akurat
function stripTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Fungsi utama untuk menarik data dan mengirim pesan
async function runScheduler() {
    try {
        console.log('Mengambil data dari Google Sheet...');
        const response = await axios.get(SCRIPT_URL);
        const data = response.data;

        if (data.status !== 'success') {
            console.error('Gagal mengambil data:', data.message);
            return;
        }

        const jadwalList = data.data || [];
        const pemainList = data.pemain || [];

        // Buat mapping Nama Pemain -> Nomor WA
        const phoneMap = {};
        pemainList.forEach(p => {
            if (p.Nama && p['Nomor WA']) {
                let num = String(p['Nomor WA']).replace(/\D/g, ''); // Hapus semua karakter non-angka
                // Pastikan berawalan 62
                if (num.startsWith('0')) {
                    num = '62' + num.substring(1);
                } else if (!num.startsWith('62')) {
                    num = '62' + num;
                }
                phoneMap[p.Nama.trim().toLowerCase()] = `${num}@c.us`; // Format ID WhatsApp
            }
        });

        const today = stripTime(new Date());

        // Load logs jika file ada
        let sentLogs = {};
        if (fs.existsSync(LOG_FILE)) {
            try {
                sentLogs = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
            } catch (err) {
                console.error('Gagal membaca log, membuat log baru...', err.message);
            }
        }

        // Penampung pesan per pemain: { "Budi": [ {pesan: "...", logKey: "..."} ] }
        const notifications = {};
        let newLogsAdded = false;

        jadwalList.forEach(jadwal => {
            if (!jadwal.Tanggal || jadwal.Tanggal === '-') return;

            const tglAcara = stripTime(new Date(jadwal.Tanggal));
            const diffTime = tglAcara - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Kita peduli H-30, H-14, dan setiap hari dalam range H-7 hingga H-1
            if (diffDays === 30 || diffDays === 14 || (diffDays <= 7 && diffDays > 0)) {
                // Cek siapa saja yang main di jadwal ini
                POSITIONS.forEach(pos => {
                    const namaPemain = jadwal[pos];
                    if (namaPemain && namaPemain !== '-' && namaPemain.trim() !== '') {
                        const namaClean = namaPemain.trim();
                        
                        // Buat unique key untuk log: Nama_Tanggal_H-diffDays
                        const logKey = `${namaClean.toLowerCase()}_${jadwal.Tanggal}_H-${diffDays}`;

                        // Hanya proses jika belum pernah dikirim
                        if (!sentLogs[logKey]) {
                            const acara = jadwal['Acara dari Siapa'] || jadwal['Acara Dari Siapa'] || 'Tidak ada nama Acara';
                            const pesanJadwal = `*[H-${diffDays}]* Acara *${acara}* pada tanggal *${formatDateIndo(jadwal.Tanggal)}*.\n📍 *Posisi Anda:* ${pos}`;

                            if (!notifications[namaClean]) {
                                notifications[namaClean] = [];
                            }
                            notifications[namaClean].push({ pesan: pesanJadwal, logKey: logKey });
                        }
                    }
                });
            }
        });

        // Kirim notifikasi ke masing-masing pemain
        for (const [namaPemain, dataArray] of Object.entries(notifications)) {
            const namaKey = namaPemain.toLowerCase();
            const waNumber = phoneMap[namaKey];

            if (waNumber) {
                // Gabungkan pesan jika lebih dari 1 jadwal
                let finalMessage = `Halo *${namaPemain}* 👋,\nIni adalah pengingat otomatis jadwal *CEPRO PERCUSSION*:\n\n`;
                dataArray.forEach((item, idx) => {
                    finalMessage += `${idx + 1}. ${item.pesan}\n\n`;
                });
                finalMessage += `Pastikan persiapan aman! dan Lakukan pengecekan pada grup WA terlebih dahulu. Terima kasih. 🥁`;

                try {
                    await client.sendMessage(waNumber, finalMessage);
                    console.log(`✅ Pesan terkirim ke ${namaPemain} (${waNumber})`);
                    
                    // Tandai log berhasil terkirim
                    dataArray.forEach(item => {
                        sentLogs[item.logKey] = true;
                    });
                    newLogsAdded = true;
                } catch (err) {
                    console.error(`❌ Gagal mengirim pesan ke ${namaPemain} (${waNumber}):`, err.message);
                }
            } else {
                console.log(`⚠️ Nomor WA untuk pemain "${namaPemain}" tidak ditemukan, Silahkan tambahkan pada bank Data Pemain.`);
            }
        }

        // Simpan log ke file jika ada pembaruan
        if (newLogsAdded) {
            fs.writeFileSync(LOG_FILE, JSON.stringify(sentLogs, null, 2));
        }

        console.log('Pengecekan selesai! (Jika tidak ada pesan terkirim, berarti tidak ada jadwal baru atau semua pengingat sudah dikirim hari ini)');

    } catch (err) {
        console.error('Terjadi kesalahan saat runScheduler:', err.message);
    }
}

client.initialize();
