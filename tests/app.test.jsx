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

test('a zone can be selected and recolored from the panel', () => {
  render(<App />);
  expect(keyFill('Q')).toBe('#e0e0e0');
  fireEvent.click(screen.getByRole('button', { name: 'Typing keys' }));
  const apply = screen.getByRole('button', { name: /Apply to \d+ keys/ });
  fireEvent.change(screen.getByLabelText('Hex'), { target: { value: '#ff0000' } });
  fireEvent.click(apply);
  expect(keyFill('Q')).toBe('#ff0000');
  expect(keyFill('Tab')).toBe('#e0e0e0');
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
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
  fireEvent.keyDown(document.querySelector('svg'), { key: 'ArrowRight' });
  expect(document.activeElement.getAttribute('aria-label')).toMatch(/^W key/);
  fireEvent.keyDown(document.querySelector('svg'), { key: 'ArrowDown' });
  expect(document.activeElement.getAttribute('aria-label')).toMatch(/^S key/);
});
