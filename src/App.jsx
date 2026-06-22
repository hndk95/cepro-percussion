import { useState, useEffect, useRef } from 'react';

const scriptURL = 'https://script.google.com/macros/s/AKfycbxuWStxPqWxilrTes35ztZ12tvvh4U810tVpkN77kROIja7fbxShIiltaJCBYDSarY/exec';


const EMPTY_FORM = {
  tanggal: '', kacapi: '', kendang: '', biola: '', perkusi: '',
  sinden: '', narator: '', pic: '', acaraDariSiapa: '',
  suling: '', keyboard: '', drum: '', pin: ''
};

// ─── PIN Modal Component ───────────────────────────────────────────────────────
function PinModal({ isOpen, mode, onConfirm, onCancel }) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setShowPin(false);
      setShake(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const modeConfig = {
    add: { icon: '➕', title: 'Konfirmasi Tambah', color: '#10b981', label: 'Masukkan PIN untuk menyimpan jadwal' },
    edit: { icon: '✏️', title: 'Konfirmasi Edit', color: '#3b82f6', label: 'Masukkan PIN untuk mengedit jadwal' },
    delete: { icon: '🗑️', title: 'Konfirmasi Hapus', color: '#ef4444', label: 'Masukkan PIN untuk menghapus jadwal' },
  };
  const cfg = modeConfig[mode] || modeConfig.edit;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onConfirm(pin);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className={`pin-modal glass-panel${shake ? ' shake' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="pin-modal-icon" style={{ color: cfg.color }}>{cfg.icon}</div>
        <h2 className="pin-modal-title">{cfg.title}</h2>
        <p className="pin-modal-label">{cfg.label}</p>

        <form onSubmit={handleSubmit}>
          <div className="pin-input-wrapper">
            <input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="PIN Rahasia"
              className="pin-input"
              autoComplete="off"
            />
            <button
              type="button"
              className="pin-toggle-btn"
              onClick={() => setShowPin(v => !v)}
              aria-label={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
            >
              {showPin ? '🙈' : '👁️'}
            </button>
          </div>

          <div className="pin-modal-actions">
            <button type="button" className="pin-cancel-btn" onClick={onCancel}>Batal</button>
            <button
              type="submit"
              className="pin-confirm-btn"
              style={{ background: cfg.color }}
            >
              Konfirmasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Modal Component ───────────────────────────────────────────────────
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal glass-panel" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <h2 className="pin-modal-title">{title}</h2>
        <p className="pin-modal-label">{message}</p>
        <div className="pin-modal-actions">
          <button type="button" className="pin-cancel-btn" onClick={onCancel}>Batal</button>
          <button type="button" className="pin-confirm-btn danger-btn" onClick={onConfirm}>Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal Component ──────────────────────────────────────────────────────
function EditModal({ isOpen, editData, onChange, onSubmit, onCancel, isLoading, status }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="edit-modal glass-panel" onClick={e => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h2>✏️ Edit Jadwal</h2>
          <button type="button" className="close-btn" onClick={onCancel}>✕</button>
        </div>

        {status.message && (
          <div className={`status-message ${status.type}`}>{status.message}</div>
        )}

        <div className="edit-modal-body">
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Tanggal *</label>
              <input type="date" name="tanggal" value={editData.tanggal} onChange={onChange} required />
            </div>
            <div className="form-group">
              <label>Acara dari Siapa *</label>
              <input type="text" name="acaraDariSiapa" placeholder="Penyelenggara acara" value={editData.acaraDariSiapa} onChange={onChange} required />
            </div>
            <div className="form-group">
              <label>PIC *</label>
              <input type="text" name="pic" placeholder="Nama PIC" value={editData.pic} onChange={onChange} required />
            </div>

            <div className="players-grid">
              {[
                ['kacapi', 'Kacapi'], ['kendang', 'Kendang'], ['biola', 'Biola'],
                ['perkusi', 'Perkusi'], ['sinden', 'Sinden'], ['narator', 'Narator'],
                ['suling', 'Suling'], ['keyboard', 'Keyboard'], ['drum', 'Drum'],
              ].map(([name, label]) => (
                <div className="form-group" key={name}>
                  <label>{label}</label>
                  <input type="text" name={name} value={editData[name]} onChange={onChange} />
                </div>
              ))}
            </div>

            <div className="edit-modal-footer">
              <button type="button" className="pin-cancel-btn" onClick={onCancel} disabled={isLoading}>
                Batal
              </button>
              <button type="submit" className="submit-btn edit-submit-btn" disabled={isLoading}>
                {isLoading ? <span className="spinner" /> : '💾 Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [activeTab, setActiveTab] = useState('input');

  // Form tambah jadwal
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  // List jadwal
  const [jadwalList, setJadwalList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState('');
  const [collapsedMonths, setCollapsedMonths] = useState({});

  // PIN Modal state
  const [pinModal, setPinModal] = useState({
    isOpen: false, mode: 'edit', targetRowId: null, targetJadwal: null
  });

  // Confirm Modal state (untuk hapus)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, pin: '', rowId: null
  });

  // Edit Modal state
  const [editModal, setEditModal] = useState({ isOpen: false });
  const [editFormData, setEditFormData] = useState({ ...EMPTY_FORM });
  const [editRowId, setEditRowId] = useState(null);
  const [editPin, setEditPin] = useState('');
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editStatus, setEditStatus] = useState({ type: '', message: '' });

  // ── Helpers ──────────────────────────────────────────────────────────────
  const toggleMonth = (month) =>
    setCollapsedMonths(prev => ({ ...prev, [month]: !prev[month] }));

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const jadwalToFormData = (jadwal) => ({
    tanggal: jadwal.Tanggal || '',
    acaraDariSiapa: jadwal['Acara Dari Siapa'] || jadwal['Acara dari Siapa'] || '',
    pic: jadwal.PIC || '',
    kacapi: jadwal.Kacapi || '',
    kendang: jadwal.Kendang || '',
    biola: jadwal.Biola || '',
    perkusi: jadwal.Perkusi || '',
    sinden: jadwal.Sinden || '',
    narator: jadwal.Narator || '',
    suling: jadwal.Suling || '',
    keyboard: jadwal.Keyboard || '',
    drum: jadwal.Drum || '',
    pin: '',
  });

  // ── Form Tambah ───────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const formBody = new URLSearchParams();
      Object.keys(formData).forEach(key => formBody.append(key, formData[key]));
      await fetch(scriptURL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString()
      });
      setStatus({ type: 'success', message: '✅ Permintaan terkirim! Cek Daftar Jadwal. Jika PIN salah, jadwal tidak akan tersimpan.' });
      setFormData(EMPTY_FORM);
    } catch (error) {
      console.error('Error!', error);
      setStatus({ type: 'error', message: '❌ Gagal mengirim data. Pastikan koneksi lancar.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Fetch List ────────────────────────────────────────────────────────────
  const fetchJadwal = async () => {
    setIsLoadingList(true);
    setListError('');
    try {
      const response = await fetch(scriptURL);
      if (!response.ok) throw new Error('Gagal mengambil data dari server');
      const result = await response.json();
      if (result.status === 'success') {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const sorted = result.data
          .filter(j => {
            if (!j.Tanggal || j.Tanggal === '-') return true;
            const d = new Date(j.Tanggal); d.setHours(0, 0, 0, 0);
            return d >= today;
          })
          .sort((a, b) => {
            if (!a.Tanggal || a.Tanggal === '-') return 1;
            if (!b.Tanggal || b.Tanggal === '-') return -1;
            return new Date(a.Tanggal) - new Date(b.Tanggal);
          });
        setJadwalList(sorted);
      } else throw new Error(result.message || 'Format data salah');
    } catch (error) {
      console.error('Error fetching data:', error);
      setListError('Gagal memuat jadwal. Pastikan Anda sudah deploy "New Version" di Google Apps Script.');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => { if (activeTab === 'list') fetchJadwal(); }, [activeTab]);

  // ── PIN Modal Flow ────────────────────────────────────────────────────────
  const openPinModal = (mode, rowId, jadwal = null) => {
    setPinModal({ isOpen: true, mode, targetRowId: rowId, targetJadwal: jadwal });
  };

  const closePinModal = () => {
    setPinModal({ isOpen: false, mode: 'edit', targetRowId: null, targetJadwal: null });
  };

  const handlePinConfirm = (pin) => {
    const { mode, targetRowId, targetJadwal } = pinModal;
    closePinModal();

    if (mode === 'delete') {
      setConfirmModal({ isOpen: true, pin, rowId: targetRowId });
    } else if (mode === 'edit') {
      setEditPin(pin);
      setEditRowId(targetRowId);
      setEditFormData(jadwalToFormData(targetJadwal));
      setEditStatus({ type: '', message: '' });
      setEditModal({ isOpen: true });
    }
  };

  // ── Delete Flow ───────────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    const { pin, rowId } = confirmModal;
    setConfirmModal({ isOpen: false, pin: '', rowId: null });
    setIsLoadingList(true);
    try {
      const formBody = new URLSearchParams();
      formBody.append('action', 'delete');
      formBody.append('rowId', rowId);
      formBody.append('pin', pin);
      await fetch(scriptURL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString()
      });
      await fetchJadwal();
    } catch (error) {
      console.error('Error deleting:', error);
      setIsLoadingList(false);
    }
  };

  // ── Edit Flow ─────────────────────────────────────────────────────────────
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditLoading(true);
    setEditStatus({ type: '', message: '' });
    try {
      const formBody = new URLSearchParams();
      formBody.append('action', 'edit');
      formBody.append('rowId', editRowId);
      formBody.append('pin', editPin);
      Object.keys(editFormData).forEach(key => {
        if (key !== 'pin') formBody.append(key, editFormData[key]);
      });
      await fetch(scriptURL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString()
      });
      setEditStatus({ type: 'success', message: '✅ Permintaan edit terkirim! Jika PIN benar, data akan diperbarui.' });
      // Tunggu sebentar lalu tutup dan refresh
      setTimeout(() => {
        setEditModal({ isOpen: false });
        fetchJadwal();
      }, 1800);
    } catch (error) {
      console.error('Error editing:', error);
      setEditStatus({ type: 'error', message: '❌ Gagal mengirim perubahan. Periksa koneksi internet.' });
    } finally {
      setIsEditLoading(false);
    }
  };

  // ── Grouping ──────────────────────────────────────────────────────────────
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const groupedJadwal = jadwalList.reduce((acc, jadwal) => {
    const d = new Date(jadwal.Tanggal);
    const key = (!jadwal.Tanggal || jadwal.Tanggal === '-' || isNaN(d.getTime()))
      ? 'Belum Ada Tanggal'
      : `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(jadwal);
    return acc;
  }, {});

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      {/* Modals */}
      <PinModal
        isOpen={pinModal.isOpen}
        mode={pinModal.mode}
        onConfirm={handlePinConfirm}
        onCancel={closePinModal}
      />
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Hapus Jadwal?"
        message="Tindakan ini tidak bisa dibatalkan. Yakin ingin menghapus jadwal ini?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, pin: '', rowId: null })}
      />
      <EditModal
        isOpen={editModal.isOpen}
        editData={editFormData}
        onChange={handleEditChange}
        onSubmit={handleEditSubmit}
        onCancel={() => setEditModal({ isOpen: false })}
        isLoading={isEditLoading}
        status={editStatus}
      />

      <div className="glass-panel main-panel">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Cepro Percussion" className="app-logo" />

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'input' ? 'active' : ''}`} onClick={() => setActiveTab('input')}>
            ✏️ Isi Jadwal
          </button>
          <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
            📅 Daftar Jadwal
          </button>
        </div>

        {/* ─── Tab: Isi Jadwal ─── */}
        {activeTab === 'input' && (
          <div className="tab-content fade-in">
            <p className="subtitle">Input Jadwal Kesenian Baru</p>

            {status.message && (
              <div className={`status-message ${status.type}`}>{status.message}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tanggal *</label>
                <input type="date" name="tanggal" value={formData.tanggal} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Acara dari Siapa *</label>
                <input type="text" name="acaraDariSiapa" placeholder="Penyelenggara acara" value={formData.acaraDariSiapa} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>PIC *</label>
                <input type="text" name="pic" placeholder="Nama PIC" value={formData.pic} onChange={handleChange} required />
              </div>

              <div className="players-grid">
                {[
                  ['kacapi', 'Kacapi'], ['kendang', 'Kendang'], ['biola', 'Biola'],
                  ['perkusi', 'Perkusi'], ['sinden', 'Sinden'], ['narator', 'Narator'],
                  ['suling', 'Suling'], ['keyboard', 'Keyboard'], ['drum', 'Drum'],
                ].map(([name, label]) => (
                  <div className="form-group" key={name}>
                    <label>{label}</label>
                    <input type="text" name={name} value={formData[name]} onChange={handleChange} />
                  </div>
                ))}
              </div>

              <div className="form-group pin-section">
                <label style={{ color: '#fca5a5' }}>🔐 PIN Rahasia *</label>
                <input type="password" name="pin" placeholder="Masukkan PIN untuk menyimpan" value={formData.pin} onChange={handleChange} required />
              </div>

              <button type="submit" disabled={isLoading} className="submit-btn">
                {isLoading ? <span className="spinner" /> : '💾 Simpan Jadwal'}
              </button>
            </form>
          </div>
        )}

        {/* ─── Tab: Daftar Jadwal ─── */}
        {activeTab === 'list' && (
          <div className="tab-content fade-in">
            <p className="subtitle">Jadwal yang sudah terisi</p>

            <button onClick={fetchJadwal} className="refresh-btn" disabled={isLoadingList}>
              {isLoadingList ? 'Memuat...' : '🔄 Refresh Data'}
            </button>

            {listError && <div className="status-message error">{listError}</div>}

            {isLoadingList ? (
              <div className="loading-container">
                <span className="spinner large-spinner" />
              </div>
            ) : (
              <div className="cards-container">
                {jadwalList.length === 0 && !listError && (
                  <p className="empty-state">Belum ada jadwal yang tersimpan atau semua jadwal sudah lewat.</p>
                )}

                {Object.keys(groupedJadwal).map((monthYear) => {
                  const isCollapsed = collapsedMonths[monthYear];
                  return (
                    <div key={monthYear} className="month-group">
                      <div className="month-header" onClick={() => toggleMonth(monthYear)}>
                        <span>🗓️ {monthYear} <span className="count-badge">({groupedJadwal[monthYear].length})</span></span>
                        <span className="toggle-icon">{isCollapsed ? '▼' : '▲'}</span>
                      </div>

                      {!isCollapsed && (
                        <div className="month-cards fade-in">
                          {groupedJadwal[monthYear].map((jadwal, index) => {
                            const acara = jadwal['Acara Dari Siapa'] || jadwal['Acara dari Siapa'];
                            return (
                              <div key={index} className="jadwal-card">
                                <div className="card-header">
                                  <span className="card-date">📅 {formatDate(jadwal.Tanggal)}</span>
                                  <span className="card-pic">👤 {jadwal.PIC || '-'}</span>
                                </div>
                                <div className="card-body">
                                  <h3 className="card-title">
                                    {(acara && acara !== '-') ? acara : 'Tidak ada nama Acara'}
                                  </h3>
                                  <div className="players-list">
                                    {[
                                      ['Kacapi', jadwal.Kacapi], ['Kendang', jadwal.Kendang],
                                      ['Biola', jadwal.Biola], ['Perkusi', jadwal.Perkusi],
                                      ['Sinden', jadwal.Sinden], ['Narator', jadwal.Narator],
                                      ['Suling', jadwal.Suling], ['Keyboard', jadwal.Keyboard],
                                      ['Drum', jadwal.Drum],
                                    ].filter(([, val]) => val && val !== '-').map(([label, val]) => (
                                      <span key={label} className="player-badge">{label}: {val}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="card-footer">
                                  <button
                                    className="edit-btn"
                                    onClick={() => openPinModal('edit', jadwal.rowId, jadwal)}
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    className="delete-btn"
                                    onClick={() => openPinModal('delete', jadwal.rowId)}
                                  >
                                    🗑️ Hapus
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
