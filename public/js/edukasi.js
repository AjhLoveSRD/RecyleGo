// halaman profil
const profileToggle = document.getElementById('profileToggle');
const dropdown = document.getElementById('profileDropdown');
const logout = document.getElementById('logout');

profileToggle.addEventListener('click', () => {
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
});

logout.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.clear();
  alert('Berhasil logout!');
  window.location.href = './login.html';
});
// halaman profil

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: 'Bearer ' + token } : {};

  fetch('/api/edukasi', { headers })
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById('edukasiTable');
      tbody.innerHTML = '';

      if (!Array.isArray(data)) {
        tbody.innerHTML = '<tr><td colspan="5">Gagal memuat data</td></tr>';
        return;
      }

      data.forEach((item) => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', item.id);

        row.innerHTML = `
            <td>${item.judul}</td>
            <td>${item.kategori}</td>
            <td>${item.status}</td>
            <td>${item.poin_reward}</td>
            <td>
              <button class="btn-edit" data-id="${item.id}">Edit</button>
              <button class="btn-delete" data-id="${item.id}">Hapus</button>
            </td>
          `;
        tbody.appendChild(row);
      });

      // Tambahkan event listener setelah render
      document.querySelectorAll('.btn-edit').forEach((button) => {
        button.addEventListener('click', () => {
          const id = button.getAttribute('data-id');
          window.location.href = `edit-edukasi.html?id=${id}`;
        });
      });

      document.querySelectorAll('.btn-delete').forEach((button) => {
        button.addEventListener('click', () => {
          const id = button.getAttribute('data-id');
          hapusEdukasi(id);
        });
      });
    });
});

function hapusEdukasi(id) {
  const token = localStorage.getItem('token');
  if (!confirm('Yakin ingin menghapus konten ini?')) return;

  fetch(`/api/edukasi/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + token,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      showToast(data.message);
      setTimeout(() => location.reload(), 1000);
    })
    .catch((err) => {
      console.error(err);
      showToast('Gagal menghapus data', true);
    });
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = isError ? 'toast error' : 'toast show';
  setTimeout(() => {
    toast.className = toast.className.replace('show', '').replace('error', '');
  }, 3000);
}

document.getElementById('btnTambahEdukasi').addEventListener('click', () => {
  window.location.href = 'tambah-edukasi.html';
});
