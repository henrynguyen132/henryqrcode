// Login.js
import React, { useState } from 'react';
import './Login.css'; // Đảm bảo đã import file CSS

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === '6e85603ae212ab2e7c88bdb85fd0f4b7') {
      onLoginSuccess();
    } else {
      alert('Sai tài khoản hoặc mật khẩu!');
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Tài khoản"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  );
}

export default Login;
