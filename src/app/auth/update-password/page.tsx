'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from '../page.module.css';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    // Check if the user has a valid session to update password
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('No active session found. Please request a new password reset link.');
      }
    };
    checkSession();
  }, [supabase.auth]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;
      
      setMessage('✅ Your password has been successfully updated! Redirecting...');
      
      // Give them a moment to read the success message, then redirect to home
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (err: any) {
      console.error('Update Password Error:', err);
      let msg = 'An error occurred while updating your password. Please try again.';
      
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      } else if (err?.message) {
        msg = err.message;
      } else if (err?.error_description) {
        msg = err.error_description;
      } else if (err?.msg) {
        msg = err.msg;
      } else {
        try {
          const stringified = JSON.stringify(err);
          if (stringified !== '{}') msg = stringified;
        } catch (e) {
          // Ignore stringify errors
        }
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Indico</h1>
        <p className={styles.subtitle}>Set a new password</p>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.message} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981' }}>{message}</div>}

        <form onSubmit={handleUpdatePassword} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">New Password</label>
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

          <button type="submit" className={styles.button} disabled={loading || !!message}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
