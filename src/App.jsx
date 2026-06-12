import { useState, useEffect } from 'react';

// TODO: Replace with your actual Google Apps Script Web App URL
const scriptURL = 'https://script.google.com/macros/s/AKfycbxuWStxPqWxilrTes35ztZ12tvvh4U810tVpkN77kROIja7fbxShIiltaJCBYDSarY/exec';

function App() {
  const [activeTab, setActiveTab] = useState('input'); // 'input' or 'list'
  
  // State untuk form
  const [formData, setFormData] = useState({
    tanggal: '', kacapi: '', kendang: '', biola: '', perkusi: '',
    sinden: '', narator: '', pic: '', acaraDariSiapa: '',
    suling: '', keyboard: '', drum: '',
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  // State untuk list jadwal
  const [jadwalList, setJadwalList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState('');

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
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString()
      });

      setStatus({ type: 'success', message: 'Jadwal berhasil disimpan!' });
      setFormData({
        tanggal: '', kacapi: '', kendang: '', biola: '', perkusi: '',
        sinden: '', narator: '', pic: '', acaraDariSiapa: '',
        suling: '', keyboard: '', drum: '',
      });
    } catch (error) {
      console.error('Error!', error);
      setStatus({ type: 'error', message: 'Gagal mengirim data. Pastikan koneksi lancar.' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJadwal = async () => {
    setIsLoadingList(true);
    setListError('');
    try {
      const response = await fetch(scriptURL);
      if (!response.ok) throw new Error('Gagal mengambil data dari server');
      
      const result = await response.json();
      if (result.status === 'success') {
        setJadwalList(result.data.reverse());
      } else {
        throw new Error(result.message || 'Format data salah');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setListError('Gagal memuat jadwal. Pastikan Anda sudah deploy "New Version" di Google Apps Script.');
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleDelete = async (rowId) => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak bisa dibatalkan.");
    if (!confirmDelete) return;

    try {
      // Kita pakai status loading list sementara
      setIsLoadingList(true);
      const formBody = new URLSearchParams();
      formBody.append('action', 'delete');
      formBody.append('rowId', rowId);

      await fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString()
      });

      alert("Jadwal berhasil dihapus (atau proses hapus sedang berjalan)!");
      // Reload the data
      fetchJadwal();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Gagal menghapus jadwal. Pastikan koneksi internet lancar.');
      setIsLoadingList(false);
    }
  };

  // Helper untuk format tanggal menjadi DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === '-') return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchJadwal();
    }
  }, [activeTab]);

  return (
    <div className="app-container">
      <div className="glass-panel main-panel">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Cepro Percussion" className="app-logo" />
        
        {/* Navigation Tabs */}
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'input' ? 'active' : ''}`}
            onClick={() => setActiveTab('input')}
          >
            ✏️ Isi Jadwal
          </button>
          <button 
            className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            📅 Daftar Jadwal
          </button>
        </div>

        {/* View: Isi Jadwal */}
        {activeTab === 'input' && (
          <div className="tab-content fade-in">
            <p className="subtitle">Input Jadwal Kesenian Baru</p>

            {status.message && (
              <div className={`status-message ${status.type}`}>
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tanggal *</label>
                <input type="date" name="tanggal" value={formData.tanggal} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Acara Dari Siapa *</label>
                <input type="text" name="acaraDariSiapa" placeholder="Penyelenggara acara" value={formData.acaraDariSiapa} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>PIC *</label>
                <input type="text" name="pic" placeholder="Nama PIC" value={formData.pic} onChange={handleChange} required />
              </div>

              <div className="players-grid">
                <div className="form-group">
                  <label>Kacapi</label>
                  <input type="text" name="kacapi" value={formData.kacapi} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Kendang</label>
                  <input type="text" name="kendang" value={formData.kendang} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Biola</label>
                  <input type="text" name="biola" value={formData.biola} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Perkusi</label>
                  <input type="text" name="perkusi" value={formData.perkusi} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Sinden</label>
                  <input type="text" name="sinden" value={formData.sinden} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Narator</label>
                  <input type="text" name="narator" value={formData.narator} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Suling</label>
                  <input type="text" name="suling" value={formData.suling} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Keyboard</label>
                  <input type="text" name="keyboard" value={formData.keyboard} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Drum</label>
                  <input type="text" name="drum" value={formData.drum} onChange={handleChange} />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="submit-btn">
                {isLoading ? <span className="spinner"></span> : 'Simpan Jadwal'}
              </button>
            </form>
          </div>
        )}

        {/* View: Daftar Jadwal */}
        {activeTab === 'list' && (
          <div className="tab-content fade-in">
            <p className="subtitle">Jadwal yang sudah terisi</p>
            
            <button onClick={fetchJadwal} className="refresh-btn" disabled={isLoadingList}>
              {isLoadingList ? 'Memuat...' : '🔄 Refresh Data'}
            </button>

            {listError && (
              <div className="status-message error">
                {listError}
              </div>
            )}

            {isLoadingList ? (
              <div className="loading-container">
                <span className="spinner large-spinner"></span>
              </div>
            ) : (
              <div className="cards-container">
                {jadwalList.length === 0 && !listError && (
                  <p className="empty-state">Belum ada jadwal yang tersimpan.</p>
                )}
                
                {jadwalList.map((jadwal, index) => (
                  <div key={index} className="jadwal-card">
                    <div className="card-header">
                      <span className="card-date">📅 {formatDate(jadwal.Tanggal)}</span>
                      <span className="card-pic">👤 {jadwal.PIC || '-'}</span>
                    </div>
                    <div className="card-body">
                      <h3 className="card-title">{(jadwal['Acara Dari Siapa'] && jadwal['Acara Dari Siapa'] !== '-') ? jadwal['Acara Dari Siapa'] : 'Tidak ada nama Acara'}</h3>
                      <div className="players-list">
                        {jadwal.Kacapi && jadwal.Kacapi !== '-' && <span className="player-badge">Kacapi: {jadwal.Kacapi}</span>}
                        {jadwal.Kendang && jadwal.Kendang !== '-' && <span className="player-badge">Kendang: {jadwal.Kendang}</span>}
                        {jadwal.Biola && jadwal.Biola !== '-' && <span className="player-badge">Biola: {jadwal.Biola}</span>}
                        {jadwal.Perkusi && jadwal.Perkusi !== '-' && <span className="player-badge">Perkusi: {jadwal.Perkusi}</span>}
                        {jadwal.Sinden && jadwal.Sinden !== '-' && <span className="player-badge">Sinden: {jadwal.Sinden}</span>}
                        {jadwal.Narator && jadwal.Narator !== '-' && <span className="player-badge">Narator: {jadwal.Narator}</span>}
                        {jadwal.Suling && jadwal.Suling !== '-' && <span className="player-badge">Suling: {jadwal.Suling}</span>}
                        {jadwal.Keyboard && jadwal.Keyboard !== '-' && <span className="player-badge">Keyboard: {jadwal.Keyboard}</span>}
                        {jadwal.Drum && jadwal.Drum !== '-' && <span className="player-badge">Drum: {jadwal.Drum}</span>}
                      </div>
                    </div>
                    <div className="card-footer">
                      <button className="delete-btn" onClick={() => handleDelete(jadwal.rowId)}>
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
