document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const userData = {
    username: document.getElementById('username').value.trim(),
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value.trim(),
    nama_lengkap: document.getElementById('nama_lengkap').value.trim(),
    alamat: document.getElementById('alamat').value.trim(),
    no_telepon: document.getElementById('no_telepon').value.trim(),
  };

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.accessToken); // ✅ simpan token
    window.location.href = '/login.html'; // ✅ redirect
  } else {
    document.getElementById('error').textContent = data.message || (data.errors?.[0]?.msg ?? 'Registrasi gagal');
  }
});
