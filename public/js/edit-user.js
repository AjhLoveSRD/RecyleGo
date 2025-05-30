document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token'); // Ambil token dari localStorage
  const userId = window.location.pathname.split('/').pop(); // Ambil ID dari URL

  if (!token) {
    alert('Anda belum login!');
    window.location.href = '/login';
    return;
  }

  const form = document.getElementById('editUserForm');

  // Ambil data user
  try {
    const res = await fetch(`/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error('Gagal mengambil data pengguna');

    const user = await res.json();

    // Isi form
    document.getElementById('nama_lengkap').value = user.nama_lengkap || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('no_telepon').value = user.no_telepon || '';
    document.getElementById('alamat').value = user.alamat || '';
    document.getElementById('poin_total').value = user.poin_total || 0;
    document.getElementById('status').value = user.status || 'active';
    document.getElementById('role').value = user.role || 'user';
  } catch (err) {
    console.error(err);
    alert('Gagal memuat data pengguna');
  }

  // Submit form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      nama_lengkap: form.nama_lengkap.value,
      email: form.email.value,
      no_telepon: form.no_telepon.value,
      alamat: form.alamat.value,
      poin_total: parseInt(form.poin_total.value) || 0,
      status: form.status.value,
      role: form.role.value,
    };

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Gagal menyimpan perubahan');

      alert('Perubahan berhasil disimpan');
      window.location.href = '/user';
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan perubahan');
    }
  });
});
