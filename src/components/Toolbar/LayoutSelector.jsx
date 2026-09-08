import { LAYOUT_OPTIONS } from '../../data/layouts/index.js';
import styles from './Toolbar.module.css';

export default function LayoutSelector({ current, onSelect }) {
  const groups = [...new Set(LAYOUT_OPTIONS.map((option) => option.group))];
  return (
    <label className={styles.layoutField}>
      <span>Layout</span>
      <select className={styles.input} value={current} onChange={(event) => onSelect(event.target.value)}>
        {groups.map((group) => (
          <optgroup key={group} label={group}>
            {LAYOUT_OPTIONS.filter((option) => option.group === group).map((option) => (
              <option key={option.id} value={option.id}>{option.label} · {option.detail}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
