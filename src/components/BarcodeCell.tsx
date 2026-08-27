import { useEffect, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import Barcode from "./Barcode";

type BarcodeCellProps = {
  /** Committed value rendered as a barcode. Empty string = no data yet. */
  value: string;
  /** Short label shown above the cell, e.g. "児童" / "本1". */
  label: string;
  /** Whether this cell is the next target for a scanner input. */
  isActive: boolean;
  /** Visual category: student gets light orange, books get light yellow. */
  variant: "student" | "book";
  /** Make this cell the active scan target when clicked. */
  onActivate: () => void;
  /** Commit an edited value (re-renders the barcode). */
  onCommit: (value: string) => void;
  /** Clear this cell's data only. */
  onClear: () => void;
};

/**
 * One editable barcode cell: a generated Code 39 image, a text box that both
 * displays scanned values and accepts manual edits, and a regenerate button
 * that commits the edited text back to the barcode.
 */
const variantBg = (variant: BarcodeCellProps["variant"]) =>
  variant === "student" ? "bg-orange-200" : "bg-yellow-50";

export default function BarcodeCell({
  value,
  label,
  isActive,
  variant,
  onActivate,
  onCommit,
  onClear,
}: BarcodeCellProps) {
  const [draft, setDraft] = useState(value);

  // Keep the text box in sync when a scan updates the committed value.
  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const v = draft.trim();
    if (v !== value) onCommit(v);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
      // Return focus to the page so global scanning resumes.
      e.currentTarget.blur();
    }
  };

  return (
    <div
      onClick={onActivate}
      className={[
        "relative flex flex-col gap-1 rounded-lg border p-1.5 transition-colors",
        isActive
          ? "border-sky-400 bg-sky-50 ring-1 ring-sky-200"
          : `border-slate-200 ${variantBg(variant)}`,
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <span
          className={[
            "text-[10px] font-bold",
            isActive ? "text-sky-600" : "text-slate-500",
          ].join(" ")}
        >
          {label}
        </span>
        {value && (
          <span className="rounded bg-emerald-100 px-1 text-[9px] font-bold text-emerald-600">
            読取済
          </span>
        )}
      </div>

      {value ? (
        <Barcode value={value} height={50} fontSize={12} />
      ) : (
        <div className="flex h-[58px] items-center justify-center text-[10px] text-slate-300">
          {isActive ? "スキャン待機中…" : "未入力"}
        </div>
      )}

      <div className="flex items-center gap-1">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          placeholder="番号"
          className="min-w-0 flex-1 rounded border border-slate-300 px-1.5 py-1 font-mono text-xs text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-200"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            commit();
          }}
          title="バーコードを再生成"
          className="flex shrink-0 items-center justify-center rounded border border-slate-300 bg-white px-1.5 py-1 text-slate-600 transition-colors hover:bg-slate-50"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDraft("");
            onClear();
          }}
          title={`${label}を削除（バーコードと数値を消去）`}
          className="flex shrink-0 items-center justify-center rounded border border-rose-300 bg-white px-1.5 py-1 text-rose-500 transition-colors hover:bg-rose-500 hover:text-white"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
