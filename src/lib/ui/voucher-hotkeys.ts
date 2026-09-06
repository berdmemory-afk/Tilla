/** Tally-like voucher hotkey helpers (E3). */
export type VoucherHotkeyHandlers = {
  onSave: () => void;
  onFocusParty?: () => void;
  onFocusItem?: () => void;
  isDirty: () => boolean;
  onDirtyEscape?: () => void;
};

export function bindVoucherHotkeys(
  e: KeyboardEvent,
  h: VoucherHotkeyHandlers
): boolean {
  const meta = e.ctrlKey || e.metaKey;
  const key = e.key;
  if (meta && key.toLowerCase() === "s") {
    e.preventDefault();
    h.onSave();
    return true;
  }
  if (key === "F2") {
    e.preventDefault();
    h.onFocusParty?.();
    return true;
  }
  if (e.altKey && key.toLowerCase() === "i") {
    e.preventDefault();
    h.onFocusItem?.();
    return true;
  }
  if (key === "Escape") {
    if (h.isDirty()) {
      e.preventDefault();
      h.onDirtyEscape?.();
      return true;
    }
  }
  return false;
}
