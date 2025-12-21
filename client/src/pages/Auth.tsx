import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Auth = () => {
  const navigate = useNavigate();
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await fetch('http://localhost:1234/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess(false);
    setSignupLoading(true);

    try {
      const response = await fetch('http://localhost:1234/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: signupEmail, password: signupPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setSignupSuccess(true);
      
      // Store credentials for auto-login before clearing
      const emailForLogin = signupEmail;
      const passwordForLogin = signupPassword;
      
      // Auto-login after successful signup
      setTimeout(async () => {
        try {
          const loginResponse = await fetch('http://localhost:1234/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: emailForLogin, password: passwordForLogin }),
          });

          const loginData = await loginResponse.json();

          if (loginResponse.ok) {
            localStorage.setItem('token', loginData.token);
            setSignupEmail('');
            setSignupPassword('');
            navigate('/');
          }
        } catch (err) {
          // If auto-login fails, user can manually login
          setSignupSuccess(false);
          setSignupEmail('');
          setSignupPassword('');
        }
      }, 1000);
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        display: 'flex',
        gap: '40px',
        maxWidth: '900px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '40px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Signup Section */}
        <div style={{
          flex: 1,
          borderRight: '1px solid #e0e0e0',
          paddingRight: '40px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Sign Up</h2>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            Create a new account to get started
          </p>
          
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label htmlFor="signup-email" style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#333' }}>
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="Enter your email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
                disabled={signupLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div>
              <label htmlFor="signup-password" style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#333' }}>
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                placeholder="Enter your password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
                disabled={signupLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {signupError && (
              <div style={{
                padding: '10px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {signupError}
              </div>
            )}

            {signupSuccess && (
              <div style={{
                padding: '10px',
                backgroundColor: '#efe',
                color: '#3c3',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                Account created! Logging you in...
              </div>
            )}

            <button
              type="submit"
              disabled={signupLoading}
              style={{
                padding: '12px',
                fontSize: '16px',
                backgroundColor: signupLoading ? '#ccc' : '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: signupLoading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                marginTop: '10px'
              }}
            >
              {signupLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Login Section */}
        <div style={{
          flex: 1,
          paddingLeft: '40px'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Login</h2>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            Sign in to your existing account
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label htmlFor="login-email" style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#333' }}>
                Email
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={loginLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label htmlFor="login-password" style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#333' }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={loginLoading}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {loginError && (
              <div style={{
                padding: '10px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              style={{
                padding: '12px',
                fontSize: '16px',
                backgroundColor: loginLoading ? '#ccc' : '#34a853',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loginLoading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                marginTop: '10px'
              }}
            >
              {loginLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

