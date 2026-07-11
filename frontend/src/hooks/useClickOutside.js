import { useEffect } from "react";

/**
 * Closes a popover (nav settings menu, language picker, ...) when the user
 * clicks outside `ref` or presses Escape. No-ops while `active` is false so
 * screens don't pay for a document-level listener they aren't using.
 */
export function useClickOutside(ref, active, onClose) {
  useEffect(() => {
    if (!active) return undefined;

    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, active, onClose]);
}
