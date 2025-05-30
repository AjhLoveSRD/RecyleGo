document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Anda belum login!');
    window.location.href = '/login';
    return;
  }

  const form = document.getElementById('tambahUserForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      username: form.username.value,
      email: form.email.value,
      password: form.password.value,
      nama_lengkap: form.nama_lengkap.value,
      no_telepon: form.no_telepon.value,
      alamat: form.alamat.value,
      poin_total: parseInt(form.poin_total.value) || 0,
      status: form.status.value,
      role: form.role.value,
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const response = await res.json();

      if (!res.ok) throw new Error(response.message || 'Gagal menambah pengguna');

      alert('Pengguna berhasil ditambahkan');
      window.location.href = '/user';
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan data pengguna');
    }
  });
});
