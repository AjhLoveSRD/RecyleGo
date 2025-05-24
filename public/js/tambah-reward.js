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

  const form = document.getElementById('formReward');

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

    fetch('/api/reward', {
      method: 'POST',
      headers,
      body,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal menambah reward.');
        return res.json();
      })
      .then(() => {
        alert('Reward berhasil ditambahkan!');
        window.location.href = './reward.html';
      })
      .catch((err) => {
        console.error(err);
        alert('Terjadi kesalahan saat menambah reward.');
      });
  };
});
