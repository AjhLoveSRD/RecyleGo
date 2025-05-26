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
  window.location.href = '/login';
});
// halaman profil

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: 'Bearer ' + token } : {};

  fetch('/api/aktivitas/admin', { headers })
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById('aktivitasTable');
      tbody.innerHTML = '';

      if (!Array.isArray(data)) {
        tbody.innerHTML = '<tr><td colspan="6">Gagal memuat data</td></tr>';
        return;
      }

      data.forEach((item) => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', item.id);

        row.innerHTML = `
          <td>${item.User?.username || '-'}</td>
          <td>${item.jenis_sampah}</td>
          <td>${item.berat}</td>
          <td>${item.poin_diperoleh}</td>
          <td class="status-cell ${item.status}">${item.status}</td>
          <td>
            <button class="verify-btn" data-id="${item.id}" data-status="verified">verifikasi</button>
            <button class="verify-btn" data-id="${item.id}" data-status="rejected">tolak</button>
          </td>
        `;
        tbody.appendChild(row);
      });

      // Tambahkan event listener ke semua tombol setelah render
      document.querySelectorAll('.verify-btn').forEach((button) => {
        button.addEventListener('click', () => {
          const id = button.getAttribute('data-id');
          const status = button.getAttribute('data-status');
          verifikasiAktivitas(id, status);
        });
      });
    });
});

function verifikasiAktivitas(id, status) {
  const token = localStorage.getItem('token');

  fetch(`/api/aktivitas/${id}/verify`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({ status }),
  })
    .then((res) => res.json())
    .then((data) => {
      showToast(data.message);

      // Update DOM
      const row = document.querySelector(`tr[data-id="${id}"]`);
      const cell = row.querySelector('.status-cell');
      cell.textContent = status;
      cell.className = `status-cell ${status}`;
    })
    .catch((err) => {
      console.error(err);
      showToast('Gagal memproses', true);
    });
}

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = isError ? 'toast error' : 'toast show';
  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
    toast.className = toast.className.replace('error', '');
  }, 3000);
}
