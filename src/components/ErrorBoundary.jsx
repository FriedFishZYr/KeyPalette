import { Component } from 'react';
import { downloadStorageBackup } from '../utils/designStore.js';
import styles from './ErrorBoundary.module.css';

// Last line of defence: a render error shows a recovery screen instead of a
// blank page, and the user's saved designs can always be downloaded from it.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('KeyPalette crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const message = String(this.state.error?.message || this.state.error);
    return (
      <div className={styles.screen} role="alert">
        <div className={styles.card}>
          <h1>Something went wrong</h1>
          <p>
            KeyPalette hit an error it couldn't recover from. Your designs are still saved in this
            browser, so reloading usually brings everything back.
          </p>
          <pre className={styles.detail}>{message}</pre>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={() => window.location.reload()}>
              Reload
            </button>
            <button type="button" onClick={() => downloadStorageBackup({ error: message })}>
              Download saved designs
            </button>
          </div>
          <p className={styles.hint}>
            If reloading doesn't help, download the backup first, then clear this site's data in your
            browser settings and open the backup's designs again.
          </p>
        </div>
      </div>
    );
  }
}
