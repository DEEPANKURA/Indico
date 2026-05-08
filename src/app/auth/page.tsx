'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from './page.module.css';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Do NOT use useRouter here — after signIn the session cookie must be
  // committed before Next.js router navigates. A full page reload ensures
  // the middleware picks up the new cookie and doesn't redirect back to /auth.
  const redirectHome = () => {
    window.location.href = '/';
  };

  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        if (!username || !fullName) {
          throw new Error('Username and Full Name are required for sign up.');
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              full_name: fullName,
            },
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });

        if (signUpError) throw signUpError;
        setMessage('✅ Check your email to confirm your account, then sign in.');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Wait for session to be stored in cookies, then do a hard redirect
        // so the server-side middleware sees the session on the next request.
        if (data.session) {
          redirectHome();
        } else {
          throw new Error('Sign-in succeeded but no session was returned. Please try again.');
        }
      }
    } catch (err: any) {
      const msg = err?.message || err?.error_description || err?.msg || JSON.stringify(err);
      setError(msg || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Indico</h1>
        <p className={styles.subtitle}>
          {isSignUp ? 'Join the future of social' : 'Welcome back, creator'}
        </p>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.message}>{message}</div>}

        <form onSubmit={handleAuth} className={styles.form}>
          {isSignUp && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="username">Username</label>
                <input
                  className={styles.input}
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="fullName">Full Name</label>
                <input
                  className={styles.input}
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
            </>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              className={styles.input}
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input
              className={styles.input}
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className={styles.toggleText}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            className={styles.toggleLink}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
