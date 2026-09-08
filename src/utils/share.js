// Share links: the whole design travels in the URL hash, so nothing is ever
// uploaded. Payload = the same versioned document as the JSON file, deflated
// when the browser can (prefix "z."), plain base64url otherwise ("j.").
import { serializeColorway, deserializeColorway } from './exportJson.js';

export const SHARE_PARAM = 'd';
const TOKEN_PATTERN = /^#d=([A-Za-z0-9._-]+)$/;

function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pipe(bytes, stream) {
  const response = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await response.arrayBuffer());
}

export function shareDocument(state) {
  const doc = serializeColorway(state);
  delete doc.exportedAt;
  return doc;
}

export async function encodeShare(state) {
  const bytes = new TextEncoder().encode(JSON.stringify(shareDocument(state)));
  if (typeof CompressionStream === 'function') {
    try {
      return `z.${toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}`;
    } catch {
      // Fall through to the uncompressed form.
    }
  }
  return `j.${toBase64Url(bytes)}`;
}

export async function decodeShare(token) {
  const dot = token.indexOf('.');
  const kind = token.slice(0, dot);
  const data = token.slice(dot + 1);
  if (dot < 1 || !data || !['z', 'j'].includes(kind)) throw new Error('This link is not a KeyPalette design link.');
  let bytes;
  try {
    bytes = fromBase64Url(data);
    if (kind === 'z') {
      if (typeof DecompressionStream !== 'function') throw new Error('This browser cannot open compressed links.');
      bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    }
  } catch (error) {
    throw new Error(error?.message?.includes('browser') ? error.message : 'This link is damaged or incomplete.', { cause: error });
  }
  return deserializeColorway(new TextDecoder().decode(bytes));
}

export function buildShareUrl(token, base = globalThis.location) {
  return `${base.origin}${base.pathname}${base.search || ''}#${SHARE_PARAM}=${token}`;
}

export function readShareToken(hash = globalThis.location?.hash ?? '') {
  const match = TOKEN_PATTERN.exec(hash);
  return match ? match[1] : null;
}
