document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.accessToken); // ✅ simpan token
    window.location.href = '/dashboard'; // ✅ redirect
  } else {
    document.getElementById('error').textContent = data.message || 'Login gagal';
  }
});
