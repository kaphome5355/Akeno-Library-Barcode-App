import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

type PrintBarcodeProps = {
  value: string;
  height?: number;
  fontSize?: number;
};

/**
 * Renders a Code 39 barcode onto an SVG element for crisp, resolution-
 * independent printing. SVG output scales without rasterization, so the
 * bars stay sharp on paper at any printer DPI.
 */
export default function PrintBarcode({
  value,
  height = 68,
  fontSize = 10,
}: PrintBarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const stripped = value.replace(/^\*+/, "").replace(/\*+$/, "");
    const safe = stripped === "" ? " " : stripped;

    try {
      JsBarcode(svgRef.current, safe, {
        format: "CODE39",
        width: 2.5,
        height,
        displayValue: true,
        fontSize,
        margin: 10,
        textMargin: 1,
        background: "#ffffff",
        lineColor: "#000000",
        font: "monospace",
        fontOptions: "bold",
      });
    } catch {
      if (svgRef.current) svgRef.current.innerHTML = "";
    }
  }, [value, height, fontSize]);

  return <svg ref={svgRef} className="print-barcode" />;
}
