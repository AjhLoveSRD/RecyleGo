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
  const token = localStorage.getItem('token'); // token JWT
  if (!token) {
    alert('Anda belum login.');
    return;
  }

  const headers = {
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json',
  };

  const rewardTable = document.getElementById('rewardTable');
  const btnTambah = document.getElementById('btnTambahReward');

  // Ambil data reward dari server
  function fetchRewards() {
    fetch('/api/reward', { headers })
      .then((res) => res.json())
      .then((data) => {
        rewardTable.innerHTML = '';
        if (!data.length) {
          rewardTable.innerHTML = '<tr><td colspan="5">Tidak ada data reward</td></tr>';
          return;
        }

        data.forEach((item) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${item.nama}</td>
            <td>${item.poin_dibutuhkan}</td>
            <td>${item.stok}</td>
            <td>${item.status}</td>
            <td>
              <button class="btn-edit" data-id="${item.id}">Edit</button>
            </td>
          `;
          rewardTable.appendChild(row);
        });
      })
      .catch((err) => {
        console.error(err);
        rewardTable.innerHTML = '<tr><td colspan="5">Gagal memuat data reward</td></tr>';
      });
  }

  fetchRewards();

  // Redirect ke halaman tambah reward (gunakan halaman berbeda jika diinginkan)
  btnTambah.onclick = () => {
    window.location.href = '/tambah-reward';
  };

  // Klik tombol edit arahkan ke halaman edit
  rewardTable.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-edit')) {
      const id = e.target.dataset.id;
      window.location.href = `/edit-reward/${id}`;
    }
  });
});
