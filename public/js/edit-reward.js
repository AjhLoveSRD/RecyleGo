document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Anda belum login.');
    return;
  }

  const headers = {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
  };

  // Ambil ID dari path URL (misal: /edit-reward/1)
  const pathParts = window.location.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  const form = document.getElementById('formReward');

  if (!id) {
    alert('ID reward tidak ditemukan di URL.');
    return;
  }

  // Ambil data reward dan isi form
  fetch(`/api/reward/${id}`, { headers })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById('rewardId').value = data.id;
      document.getElementById('nama').value = data.nama;
      document.getElementById('deskripsi').value = data.deskripsi;
      document.getElementById('poin').value = data.poin_dibutuhkan;
      document.getElementById('stok').value = data.stok;
      document.getElementById('gambar').value = data.gambar || '';
      document.getElementById('status').value = data.status;
      document.getElementById('kadaluarsa').value = data.tanggal_kadaluarsa ? data.tanggal_kadaluarsa.split('T')[0] : '';
    })
    .catch((err) => {
      console.error(err);
      alert('Gagal memuat data reward.');
    });

  // Kirim perubahan ke server
  form.onsubmit = (e) => {
    e.preventDefault();
    const body = JSON.stringify({
      nama: document.getElementById('nama').value,
      deskripsi: document.getElementById('deskripsi').value,
      poin_dibutuhkan: parseInt(document.getElementById('poin').value),
      stok: parseInt(document.getElementById('stok').value),
      gambar: document.getElementById('gambar').value,
      status: document.getElementById('status').value,
      tanggal_kadaluarsa: document.getElementById('kadaluarsa').value,
    });

    fetch(`/api/reward/${id}`, {
      method: 'PUT',
      headers,
      body,
    })
      .then((res) => res.json())
      .then(() => {
        alert('Reward berhasil diperbarui!');
        window.location.href = '/reward';
      })
      .catch((err) => {
        console.error(err);
        alert('Gagal memperbarui reward.');
      });
  };
});
