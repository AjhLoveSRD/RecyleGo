document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('penggunaTable');
  const token = localStorage.getItem('token'); // Ambil token dari localStorage

  if (!token) {
    alert('Anda belum login!');
    window.location.href = '/login';
    return;
  }

  fetch('/api/users', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error('Gagal mengambil data pengguna: ' + res.status);
      }
      return res.json();
    })
    .then((data) => {
      tableBody.innerHTML = '';
      data.forEach((user) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.nama_lengkap || '-'}</td>
            <td>${user.email}</td>
            <td>${user.no_telepon || '-'}</td>
            <td>${user.alamat || '-'}</td>
            <td>${user.poin_total}</td>
            <td>${user.status}</td>
            <td>${user.role}</td>
            <td>
              <button class="btn-edit" data-id="${user.id}">Edit</button>
              <button class="btn-hapus" data-id="${user.id}">Hapus</button>
            </td>
          `;
        tableBody.appendChild(row);
      });

      // Event listener untuk tombol Edit
      document.querySelectorAll('.btn-edit').forEach((button) => {
        button.addEventListener('click', () => {
          const userId = button.getAttribute('data-id');
          window.location.href = `/edit-user/${userId}`;
        });
      });

      // Event listener untuk tombol Hapus
      document.querySelectorAll('.btn-hapus').forEach((button) => {
        button.addEventListener('click', () => {
          const userId = button.getAttribute('data-id');
          if (confirm('Yakin ingin menghapus pengguna ini?')) {
            fetch(`/api/users/${userId}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
              .then((res) => {
                if (!res.ok) throw new Error('Gagal menghapus pengguna');
                return res.json();
              })
              .then((msg) => {
                alert(msg.message);
                location.reload();
              })
              .catch((err) => alert(err.message));
          }
        });
      });
    })
    .catch((error) => {
      console.error(error);
      tableBody.innerHTML = '<tr><td colspan="7">Gagal memuat data</td></tr>';
    });
});
