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

  fetch('/api/admin/summary', { headers })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById('userCount').textContent = data.totalUser;
      document.getElementById('aktivitasCount').textContent = data.totalAktivitas;
      document.getElementById('totalBerat').textContent = data.totalBerat + ' kg';
      document.getElementById('totalPoin').textContent = data.totalPoin + ' poin';
    });

  fetch('/api/aktivitas/admin', { headers })
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById('aktivitasTable');
      tbody.innerHTML = '';

      console.log('DATA AKTIVITAS:', data); // tambahan untuk debug

      if (!Array.isArray(data)) {
        console.error('Aktivitas Error:', data);
        tbody.innerHTML = '<tr><td colspan="5">Gagal memuat data aktivitas</td></tr>';
        return;
      }

      data.forEach((item) => {
        tbody.innerHTML += `
          <tr>
            <td>${item.User?.username || '-'}</td>
            <td>${item.jenis_sampah}</td>
            <td>${item.berat}</td>
            <td>${item.poin_diperoleh}</td>
            <td>${item.keterangan}</td>
          </tr>`;
      });
    });

  fetch('/api/edukasi', { headers })
    .then((res) => res.json())
    .then((data) => {
      const tbody = document.getElementById('edukasiTable');
      tbody.innerHTML = '';
      data.forEach((item) => {
        tbody.innerHTML += `
            <tr>
              <td>${item.judul}</td>
              <td>${item.konten}</td>
              <td>${item.kategori}</td>
              <td>${item.gambar}</td>
              <td>${item.link_video}</td>
              <td>${item.poin_reward}</td>
              <td>${item.status}</td>
            </tr>`;
      });
    });

  fetch('/api/reward', { headers })
    .then((res) => res.json())
    .then((data) => {
      console.log('DATA REWARD:', data);
      const tbody = document.getElementById('rewardTable');
      tbody.innerHTML = '';
      data.forEach((item) => {
        tbody.innerHTML += `
            <tr>
              <td>${item.nama}</td>
              <td>${item.deskripsi}</td>
              <td>${item.poin_dibutuhkan}</td>
              <td>${item.stok}</td>
              <td>${item.gambar}</td>
              <td>${item.status}</td>
              <td>${item.tanggal_kadaluarsa}</td>
            </tr>`;
      });
    });
});
