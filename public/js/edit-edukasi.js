const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const token = localStorage.getItem('token');

if (!id) {
  alert('ID edukasi tidak ditemukan.');
  location.href = 'edukasi.html';
}

const form = document.getElementById('editForm');

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = isError ? 'toast error' : 'toast show';
  setTimeout(() => {
    toast.className = toast.className.replace('show', '').replace('error', '');
  }, 3000);
}

fetch(`/api/edukasi/${id}`, {
  headers: {
    Authorization: 'Bearer ' + token,
  },
})
  .then((res) => res.json())
  .then((data) => {
    if (data.message) throw new Error(data.message);
    document.getElementById('judul').value = data.judul;
    document.getElementById('konten').value = data.konten;
    document.getElementById('kategori').value = data.kategori;
    document.getElementById('gambar').value = data.gambar || '';
    document.getElementById('link_video').value = data.link_video || '';
    document.getElementById('poin_reward').value = data.poin_reward || 0;
    document.getElementById('status').value = data.status;
  })
  .catch((err) => {
    showToast('Gagal memuat data: ' + err.message, true);
  });

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const payload = {
    judul: document.getElementById('judul').value,
    konten: document.getElementById('konten').value,
    kategori: document.getElementById('kategori').value,
    gambar: document.getElementById('gambar').value,
    link_video: document.getElementById('link_video').value,
    poin_reward: parseInt(document.getElementById('poin_reward').value),
    status: document.getElementById('status').value,
  };

  fetch(`/api/edukasi/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message?.includes('tidak ditemukan')) {
        showToast(data.message, true);
        return;
      }
      showToast('Berhasil disimpan!');
      setTimeout(() => {
        window.location.href = 'edukasi.html';
      }, 1500);
    })
    .catch(() => {
      showToast('Terjadi kesalahan saat menyimpan', true);
    });
});
