/**
 * Copy text to clipboard with fallback for non-secure contexts.
 *
 * `navigator.clipboard.writeText` only works in secure contexts (HTTPS, localhost).
 * Accessing via http://<LAN-IP> is not secure, so we fall back to execCommand.
 *
 * @param {string} text
 * @returns {Promise<boolean>} whether copy likely succeeded
 */
export async function copyToClipboard(text) {
  const str = text == null ? '' : String(text);

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(str);
      return true;
    } catch {
      // fall through to legacy path
    }
  }

  return copyWithExecCommand(str);
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function copyWithExecCommand(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  ta.style.top = '0';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
  return ok;
}
