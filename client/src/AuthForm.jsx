import { useState } from 'react';

const AuthForm = ({ authAction, mode = 'login' }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (ev) => {
    ev.preventDefault();
    try {
      await authAction({ username, password }, mode);
    } catch (ex) {
      setError(ex.error);
    }
  };

  const registerUser = async () => {
    try {
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
    } catch (ex) {
      setError(ex.error);
    }
  };


  return (
    <form onSubmit={submit}>
      {!!error && <div className="error">{error}</div>}
      <input
        value={username}
        placeholder="username"
        onChange={(ev) => setUsername(ev.target.value)}
      />
      <input
        value={password}
        placeholder="password"
        onChange={(ev) => setPassword(ev.target.value)}
      />
      <button type="submit">{mode}</button>
      {mode === 'login' && (
        <button type="button" onClick={registerUser}>
          Register
        </button>
      )}
    </form>
  );
};

export default AuthForm;

