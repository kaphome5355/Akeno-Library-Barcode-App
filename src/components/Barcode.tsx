import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

type BarcodeProps = {
  value: string;
  /** Module bar width at the target (unscaled) rendering. */
  width?: number;
  /** Pixel height of the barcode bars. */
  height?: number;
  /** Font size of the human-readable text. */
  fontSize?: number;
  /** Show the human-readable text under the barcode. */
  displayValue?: boolean;
  /** Optional max display width; defaults to the measured container width. */
  maxWidth?: number;
  className?: string;
};

/**
 * Renders a Code 39 barcode onto a canvas, auto-scaled to fit its container.
 *
 * JsBarcode's CODE39 encoder always wraps the data with start/stop `*`
 * markers internally, so we pass the raw value (without leading/trailing
 * asterisks) to avoid double-wrapping. We first render at a fixed module
 * width to learn the natural pixel width, then compute a scale factor that
 * keeps the barcode inside its container while preserving a minimum module
 * width that remains scannable.
 */
export default function Barcode({
  value,
  width = 3,
  height = 60,
  fontSize = 13,
  displayValue = true,
  maxWidth,
  className,
}: BarcodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const stripped = value.replace(/^\*+/, "").replace(/\*+$/, "");
    const safe = stripped === "" ? " " : stripped;

    // Target fit width: caller override, else measured container, else no scaling.
    const fit = maxWidth ?? containerWidth;
    // CODE39 char ~ 12 modules + 1 inter-char space, plus 2 start/stop chars + margins.
    const charModules = 13;
    const moduleCount = safe.length * charModules + 24;
    // Minimum module width that still scans reliably off a screen (~1.2px).
    const minModule = 1.2;
    let moduleWidth = width;
    if (fit > 0) {
      moduleWidth = Math.min(width, Math.max(minModule, fit / moduleCount));
    }

    try {
      JsBarcode(canvasRef.current, safe, {
        format: "CODE39",
        width: moduleWidth,
        height,
        displayValue,
        fontSize,
        margin: 4,
        textMargin: 2,
        background: "#ffffff",
        lineColor: "#000000",
        font: "monospace",
        fontOptions: "bold",
      });
    } catch {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [value, width, height, fontSize, displayValue, containerWidth, maxWidth]);

  return (
    <div ref={wrapperRef} className="flex w-full justify-center overflow-hidden">
      <canvas ref={canvasRef} className={className} />
    </div>
  );
}
