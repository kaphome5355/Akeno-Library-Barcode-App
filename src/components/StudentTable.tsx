import { Check, Trash2 } from "lucide-react";
import BarcodeCell from "./BarcodeCell";
import type { Student } from "../types";

type Field = "student" | 0 | 1 | 2;

type StudentTableProps = {
  rows: (Student | null)[]; // exactly 20 entries per page
  pageStart: number; // absolute index of the first row on this page
  activeRow: number; // absolute index of the row currently accepting scans
  activeCol: Field; // which column receives the next scan
  onCommitCell: (absIndex: number, field: Field, value: string) => void;
  onClearCell: (absIndex: number, field: Field) => void;
  onDeleteRow: (absIndex: number) => void;
  onActivateCell: (absIndex: number, field: Field) => void;
};

const COLS = ["児童", "本1", "本2", "本3"] as const;

export default function StudentTable({
  rows,
  pageStart,
  activeRow,
  activeCol,
  onCommitCell,
  onClearCell,
  onDeleteRow,
  onActivateCell,
}: StudentTableProps) {
  return (
    <table className="w-full border-collapse table-fixed">
      <colgroup>
        <col className="w-12" />
        <col />
        <col />
        <col />
        <col />
        <col className="w-16" />
      </colgroup>
      <thead className="sticky top-0 z-10">
        <tr className="bg-slate-700 text-white">
          <th className="px-3 py-2 text-xs font-bold">#</th>
          {COLS.map((c) => (
            <th key={c} className="px-3 py-2 text-xs font-bold">
              {c}
            </th>
          ))}
          <th className="px-3 py-2 text-xs font-bold">削除</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s, i) => {
          const abs = pageStart + i;
          const isActiveRow = abs === activeRow;
          return (
            <tr
              key={i}
              className={[
                "border-t border-slate-100",
                isActiveRow
                  ? "bg-sky-50/50"
                  : s?.confirmed
                    ? "bg-emerald-50/30"
                    : "",
              ].join(" ")}
            >
              <td className="px-2 py-2 align-top text-center text-sm font-bold text-slate-500">
                <div className="flex flex-col items-center gap-0.5 pt-1">
                  <span>{i + 1}</span>
                  {s?.confirmed && (
                    <Check className="h-3 w-3 text-emerald-500" />
                  )}
                </div>
              </td>

              <td className="px-3 py-2 align-top">
                <BarcodeCell
                  label="児童"
                  variant="student"
                  value={s?.studentNumber ?? ""}
                  isActive={isActiveRow && activeCol === "student"}
                  onActivate={() => onActivateCell(abs, "student")}
                  onCommit={(v) => onCommitCell(abs, "student", v)}
                  onClear={() => onClearCell(abs, "student")}
                />
              </td>

              {COLS.slice(1).map((label, bi) => (
                <td key={bi} className="px-3 py-2 align-top">
                  <BarcodeCell
                    label={label}
                    variant="book"
                    value={s?.books[bi] ?? ""}
                    isActive={isActiveRow && activeCol === bi}
                    onActivate={() => onActivateCell(abs, bi as Field)}
                    onCommit={(v) => onCommitCell(abs, bi as Field, v)}
                    onClear={() => onClearCell(abs, bi as Field)}
                  />
                </td>
              ))}

              <td className="px-2 py-2 text-center align-top">
                <button
                  type="button"
                  onClick={() => onDeleteRow(abs)}
                  title="この行を削除"
                  className="mt-1 flex h-7 w-7 items-center justify-center rounded-md border border-rose-300 bg-white text-rose-500 transition-colors hover:bg-rose-500 hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
