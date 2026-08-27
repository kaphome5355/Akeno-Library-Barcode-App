import { useEffect, useRef } from "react";

type UseBarcodeScannerOptions = {
  /** Called with one decoded scan when a terminator key is received. */
  onScan: (code: string) => void;
  /** Called when Enter is pressed with an empty buffer (a manual "confirm"). */
  onEmptyEnter?: () => void;
  /** Fastest plausible interval (ms) between two keystrokes of one scan. */
  maxKeystrokeInterval?: number;
  /** Minimum length to accept as a real scan (shorter bursts are typing). */
  minLength?: number;
};

/**
 * Listens for barcode-scanner input at the document level.
 *
 * Barcode readers act as HID keyboards that emit a burst of characters very
 * quickly followed by a terminator (Enter or configurable suffix). We collect
 * printable characters into a buffer and flush on a terminator, distinguishing
 * scans from manual typing by inter-keystroke timing.
 */
export function useBarcodeScanner({
  onScan,
  onEmptyEnter,
  maxKeystrokeInterval = 50,
  minLength = 2,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  const onEmptyEnterRef = useRef(onEmptyEnter);

  useEffect(() => {
    onScanRef.current = onScan;
    onEmptyEnterRef.current = onEmptyEnter;
  }, [onScan, onEmptyEnter]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept scanner input while a text field is focused — let the
      // field receive keystrokes so users can manually edit cell values, and
      // let Enter inside the field regenerate that cell's barcode.
      const ae = document.activeElement;
      if (
        ae &&
        (ae.tagName === "INPUT" ||
          ae.tagName === "TEXTAREA" ||
          (ae as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const now = performance.now();

      // If the gap since the last key is large, start a fresh buffer
      // (the user is typing normally, not mid-scan).
      if (now - lastKeyTimeRef.current > maxKeystrokeInterval) {
        bufferRef.current = "";
      }
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const code = bufferRef.current.trim();
        bufferRef.current = "";
        if (code.length >= minLength) {
          e.preventDefault();
          onScanRef.current(code);
        } else if (onEmptyEnterRef.current) {
          e.preventDefault();
          onEmptyEnterRef.current();
        }
        return;
      }

      // Only collect printable single characters.
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [maxKeystrokeInterval, minLength]);
}
