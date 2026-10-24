// @vitest-environment jsdom
import { test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import App from '../src/App.jsx';

beforeEach(() => {
  cleanup();
  localStorage.clear();
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function close() { this.removeAttribute('open'); };
});

const keyFill = (label) => document.querySelector(`g[aria-label^="${label} key"] path`).getAttribute('fill');

test('a zone recolors live as the color changes, and undo restores it', () => {
  render(<App />);
  expect(keyFill('Q')).toBe('#e0e0e0');
  fireEvent.click(screen.getByRole('button', { name: 'Typing keys' }));
  fireEvent.change(screen.getByLabelText('Hex'), { target: { value: '#ff0000' } });
  expect(keyFill('Q')).toBe('#ff0000');
  expect(keyFill('Tab')).toBe('#e0e0e0');
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(keyFill('Q')).toBe('#e0e0e0');
});

test('a typing session in the hex field is one undo step and lands in Recent', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Typing keys' }));
  const hex = screen.getByLabelText('Hex');
  fireEvent.focus(hex);
  fireEvent.change(hex, { target: { value: '#ff0000' } });
  fireEvent.change(hex, { target: { value: '#00ff00' } });
  fireEvent.blur(hex);
  expect(keyFill('Q')).toBe('#00ff00');
  expect(screen.getByRole('button', { name: 'Use color #00ff00' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Use color #ff0000' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(keyFill('Q')).toBe('#e0e0e0');
});

test('the picker is inert until keys are selected', () => {
  render(<App />);
  expect(screen.getByText('Select keys or a group to color them.')).toBeTruthy();
  expect(screen.getByLabelText('Hex').closest('[inert]')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Typing keys' }));
  expect(screen.getByLabelText('Hex').closest('[inert]')).toBeNull();
});

test('a color in the design palette selects every key painted with it', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Modifiers' }));
  fireEvent.change(screen.getByLabelText('Hex'), { target: { value: '#123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
  const swatch = screen.getByRole('button', { name: /^Select \d+ keys in #123456$/ });
  fireEvent.click(swatch);
  expect(swatch.getAttribute('aria-pressed')).toBe('true');
  expect(document.querySelector('g[aria-label^="Tab key"]').getAttribute('aria-pressed')).toBe('true');
  expect(document.querySelector('g[aria-label^="Q key"]').getAttribute('aria-pressed')).toBe('false');
});

test('the Blank preset resets every color', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Presets' }));
  fireEvent.click(within(document.querySelector('dialog')).getByRole('button', { name: 'Nord' }));
  expect(keyFill('Q')).not.toBe('#e0e0e0');
  fireEvent.click(screen.getByRole('button', { name: 'Presets' }));
  fireEvent.click(within(document.querySelector('dialog')).getByRole('button', { name: 'Blank' }));
  expect(keyFill('Q')).toBe('#e0e0e0');
});

test('designs can be duplicated and deleted from My designs', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'My designs' }));
  const dialog = within(document.querySelector('dialog'));
  expect(dialog.getAllByRole('listitem')).toHaveLength(1);
  fireEvent.click(dialog.getByRole('button', { name: /^Duplicate / }));
  expect(dialog.getAllByRole('listitem')).toHaveLength(2);
  expect(dialog.getByText('Untitled copy')).toBeTruthy();
  fireEvent.click(dialog.getAllByRole('button', { name: /^Delete / })[1]);
  fireEvent.click(dialog.getByRole('button', { name: 'Delete' }));
  expect(dialog.getAllByRole('listitem')).toHaveLength(1);
  expect(dialog.getByRole('button', { name: /^Delete / }).disabled).toBe(true);
});

test('dialogs close on Escape', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Share' }));
  const heading = screen.getByRole('heading', { name: 'Share or download' });
  fireEvent.keyDown(heading, { key: 'Escape' });
  expect(screen.queryByRole('heading', { name: 'Share or download' })).toBeNull();
});

test('unreadable saved data is kept aside and announced instead of overwritten', () => {
  localStorage.setItem('keypalette-slots', '{definitely not json');
  render(<App />);
  expect(screen.getByText(/couldn’t be read/)).toBeTruthy();
  const backupKeys = Object.keys(localStorage).filter((k) => k.startsWith('keypalette-slots.unreadable-'));
  expect(backupKeys).toHaveLength(1);
  expect(localStorage.getItem(backupKeys[0])).toBe('{definitely not json');
});

test('first-run guidance shows on a blank board and stays dismissed', () => {
  render(<App />);
  expect(screen.getByRole('note', { name: 'Getting started' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
  expect(screen.queryByRole('note', { name: 'Getting started' })).toBeNull();
  expect(localStorage.getItem('keypalette-onboarded')).toBe('1');
  cleanup();
  render(<App />);
  expect(screen.queryByRole('note', { name: 'Getting started' })).toBeNull();
});

test('the board is one tab stop and arrow keys move focus between keys', () => {
  render(<App />);
  const keys = document.querySelectorAll('g[role=button]');
  expect([...keys].filter((k) => k.getAttribute('tabindex') === '0')).toHaveLength(1);
  const q = document.querySelector('g[aria-label^="Q key"]');
  q.focus();
  expect(document.activeElement).toBe(q);
  fireEvent.keyDown(document.querySelector('[data-board="a"] svg'), { key: 'ArrowRight' });
  expect(document.activeElement.getAttribute('aria-label')).toMatch(/^W key/);
  fireEvent.keyDown(document.querySelector('[data-board="a"] svg'), { key: 'ArrowDown' });
  expect(document.activeElement.getAttribute('aria-label')).toMatch(/^S key/);
});

test('an empty comparison offers a snapshot of the current design', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Compare' }));
  expect(screen.getByText('No reference yet')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Snapshot this design' }));
  expect(screen.queryByText('No reference yet')).toBeNull();
  expect(document.querySelector('[data-board="b"] svg')).toBeTruthy();
});

// Phone width: every media query matches, so the header is compact and the
// editor is a bottom sheet.
const phoneWidth = () => {
  globalThis.matchMedia = (query) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} });
};

test('on narrow screens secondary actions live in a More menu', () => {
  phoneWidth();
  try {
    render(<App />);
    expect(screen.queryByRole('button', { name: 'My designs' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent))
      .toEqual(['My designs', 'Presets', 'Compare', 'Switch to dark mode', 'About and shortcuts']);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Presets' }));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Start with a preset' })).toBeTruthy();
  } finally {
    delete globalThis.matchMedia;
  }
});

test('on narrow screens the editor is a sheet that expands to the picker', () => {
  phoneWidth();
  try {
    render(<App />);
    expect(screen.queryByLabelText('Hex')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Typing keys' }));
    const handle = screen.getByRole('button', { name: 'Choose a color for 35 keys' });
    expect(handle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(handle);
    fireEvent.change(screen.getByLabelText('Hex'), { target: { value: '#00ff00' } });
    expect(keyFill('Q')).toBe('#00ff00');
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByLabelText('Hex')).toBeNull();
  } finally {
    delete globalThis.matchMedia;
  }
});
