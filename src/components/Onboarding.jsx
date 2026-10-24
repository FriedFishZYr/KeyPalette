import styles from './Onboarding.module.css';

// First-run card: shown until the board has any color on it or it is dismissed.
export default function Onboarding({ onTryPreset, onDismiss }) {
  return (
    <div className={styles.card} role="note" aria-label="Getting started">
      <div className={styles.text}>
        <strong>Three steps to a colorway</strong>
        <ol>
          <li>Pick keys: click one, shift-click more, or choose a group such as Typing keys.</li>
          <li>Choose a color, or pull a palette from a photo.</li>
          <li>Apply it, then share a link or download the image.</li>
        </ol>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onTryPreset}>Try a preset</button>
        <button type="button" className={styles.secondary} onClick={onDismiss}>Got it</button>
      </div>
    </div>
  );
}
