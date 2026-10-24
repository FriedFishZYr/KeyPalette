import { useEffect, useId, useRef, useState } from 'react';
import styles from './Menu.module.css';

// A small dropdown menu: a trigger button plus a list of actions. Closes on an
// outside press, Escape (returning focus to the trigger), or choosing an item.
// Arrow keys, Home and End move between items.
export default function Menu({ label, trigger, triggerClassName, items }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    rootRef.current.querySelector('[role="menuitem"]')?.focus();
    const onPointerDown = (event) => { if (!rootRef.current.contains(event.target)) setOpen(false); };
    // Capture phase, so Escape closes the menu without also clearing the
    // board selection (App listens for Escape on window).
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  const onMenuKeyDown = (event) => {
    const entries = [...rootRef.current.querySelectorAll('[role="menuitem"]')];
    const index = entries.indexOf(document.activeElement);
    const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: entries.length - 1 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    entries[(next + entries.length) % entries.length]?.focus();
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button type="button" ref={triggerRef} className={triggerClassName} aria-label={label} title={label}
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}>
        {trigger}
      </button>
      {open && (
        <div className={styles.menu} role="menu" id={menuId} aria-label={label} onKeyDown={onMenuKeyDown}>
          {items.map((item) => (
            <button key={item.label} type="button" role="menuitem" className={styles.item} tabIndex={-1}
              onClick={() => { setOpen(false); item.onSelect(); }}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
