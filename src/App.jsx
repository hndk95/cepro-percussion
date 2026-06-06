import { useState } from 'react';

function App() {
  const [formData, setFormData] = useState({
    tanggal: '',
    kacapi: '',
    kendang: '',
    biola: '',
    perkusi: '',
    sinden: '',
    narator: '',
    pic: '',
    acaraDariSiapa: '',
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    // TODO: Replace with your actual Google Apps Script Web App URL
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxuWStxPqWxilrTes35ztZ12tvvh4U810tVpkN77kROIja7fbxShIiltaJCBYDSarY/exec';


    try {
      // Using FormData object for simple consumption by Google Apps Script
      const formBody = new URLSearchParams();
      Object.keys(formData).forEach(key => {
        formBody.append(key, formData[key]);
      });

      const response = await fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors', // Menambahkan no-cors agar tidak diblokir browser
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString()
      });

      // Karena menggunakan 'no-cors', balasan dari Google (response) bersifat "opaque" (tertutup)
      // Kita tidak bisa membaca isi JSON-nya, jadi kita asumsikan berhasil jika tidak masuk ke catch (error jaringan)
      
      setStatus({ type: 'success', message: 'Jadwal berhasil disimpan!' });
      // Reset form
      setFormData({
        tanggal: '',
        kacapi: '',
        kendang: '',
        biola: '',
        perkusi: '',
        sinden: '',
        narator: '',
        pic: '',
        acaraDariSiapa: '',
      });

    } catch (error) {
      console.error('Error!', error);
      setStatus({
        type: 'error',
        message: 'Gagal mengirim data. Pastikan koneksi internet Anda lancar.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel">
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Cepro Percussion" className="app-logo" />
      <p className="subtitle">Input Jadwal Kesenian</p>

      {status.message && (
        <div className={`status-message ${status.type}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="tanggal">Tanggal</label>
          <input
            type="date"
            id="tanggal"
            name="tanggal"
            value={formData.tanggal}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="kacapi">Kacapi</label>
          <input
            type="text"
            id="kacapi"
            name="kacapi"
            placeholder="Nama pemain kacapi"
            value={formData.kacapi}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="kendang">Kendang</label>
          <input
            type="text"
            id="kendang"
            name="kendang"
            placeholder="Nama pemain kendang"
            value={formData.kendang}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="biola">Biola</label>
          <input
            type="text"
            id="biola"
            name="biola"
            placeholder="Nama pemain biola"
            value={formData.biola}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="perkusi">Perkusi</label>
          <input
            type="text"
            id="perkusi"
            name="perkusi"
            placeholder="Nama pemain perkusi"
            value={formData.perkusi}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="sinden">Sinden</label>
          <input
            type="text"
            id="sinden"
            name="sinden"
            placeholder="Nama sinden"
            value={formData.sinden}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="narator">Narator</label>
          <input
            type="text"
            id="narator"
            name="narator"
            placeholder="Nama narator"
            value={formData.narator}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pic">PIC</label>
          <input
            type="text"
            id="pic"
            name="pic"
            placeholder="Nama PIC"
            value={formData.pic}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="acaraDariSiapa">Acara Dari Siapa</label>
          <input
            type="text"
            id="acaraDariSiapa"
            name="acaraDariSiapa"
            placeholder="Penyelenggara acara"
            value={formData.acaraDariSiapa}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? <span className="spinner"></span> : 'Simpan Jadwal'}
        </button>
      </form>
    </div>
  );
}

export default App;
