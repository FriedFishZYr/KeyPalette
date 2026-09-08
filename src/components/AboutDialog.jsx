import Dialog from './Dialog.jsx';
import { downloadStorageBackup } from '../utils/designStore.js';
import styles from './AboutDialog.module.css';

const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

const SHORTCUTS = [
  ['Click', 'Select a key'],
  ['Shift + click', 'Add or remove a key from the selection'],
  ['Alt + click', 'Select every key that shares the clicked key’s color'],
  ['Tab, then arrow keys', 'Move between keys on the board'],
  ['Enter or Space', 'Select the focused key (hold Shift to add it)'],
  ['Esc', 'Clear the selection, or close a dialog'],
  ['⌘ / Ctrl + Z', 'Undo'],
  ['⌘ / Ctrl + Shift + Z, Ctrl + Y', 'Redo'],
];

export default function AboutDialog({ onClose }) {
  return (
    <Dialog title="About KeyPalette" onClose={onClose}>
      <p className={styles.lead}>
        Design and preview custom keycap colorways before you buy. Version {VERSION}.
      </p>
      <h3 className={styles.heading}>Privacy</h3>
      <p className={styles.text}>
        Designs are stored only in this browser’s local storage. Nothing is uploaded, and there are
        no accounts, cookies, or analytics. Clearing this site’s data removes your designs, so keep
        a backup if they matter to you.
      </p>
      <button type="button" className={styles.action} onClick={() => downloadStorageBackup()}>
        Download a backup of everything saved here
      </button>
      <h3 className={styles.heading}>Keyboard shortcuts</h3>
      <dl className={styles.shortcuts}>
        {SHORTCUTS.map(([keys, what]) => (
          <div key={keys} className={styles.shortcut}>
            <dt><kbd>{keys}</kbd></dt>
            <dd>{what}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.fine}>
        Open source under the MIT license ·{' '}
        <a href="https://github.com/FriedFishZYr/KeyPalette" target="_blank" rel="noreferrer">Source on GitHub</a>.
        Preset colorways are original palettes; names of editor themes are used as inspiration only.
      </p>
    </Dialog>
  );
}
