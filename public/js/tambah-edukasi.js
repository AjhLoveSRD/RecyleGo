document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('tambahForm');
  const token = localStorage.getItem('token');

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

    fetch('/api/edukasi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        showToast('Edukasi berhasil ditambahkan!');
        setTimeout(() => {
          window.location.href = '/edukasi';
        }, 1500);
      })
      .catch(() => {
        showToast('Gagal menambahkan edukasi', true);
      });
  });
});

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = isError ? 'toast error' : 'toast show';
  setTimeout(() => {
    toast.className = toast.className.replace('show', '').replace('error', '');
  }, 3000);
}
