import styles from './Toolbar.module.css';

export default function LayoutSelector({ current, onSelect }) {
  return (
    <label className={styles.layoutField}>
      <span>Layout</span>
      <select className={styles.input} value={current} onChange={(event) => onSelect(event.target.value)}>
        <option value="60">60% · Compact</option>
        <option value="65">65% · With arrows</option>
        <option value="75">75% · Compact function row</option>
        <option value="tkl">TKL · No numpad</option>
        <option value="full">Full-size · With numpad</option>
      </select>
    </label>
  );
}
