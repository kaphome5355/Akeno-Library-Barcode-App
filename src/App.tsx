import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Users,
  Check,
  Eraser,
  ScanLine,
  ChevronLeft,
  ChevronRight,
  Trash2,
  MousePointerClick,
  Printer,
} from "lucide-react";
import StudentTable from "./components/StudentTable";
import PrintSheet from "./components/PrintSheet";
import { useBarcodeScanner } from "./hooks/useBarcodeScanner";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { todayString } from "./utils/date";
import type { Student } from "./types";

const PER_PAGE = 20;

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const emptyStudent = (): Student => ({
  id: uid(),
  studentNumber: "",
  books: [null, null, null],
  confirmed: false,
  createdAt: Date.now(),
});

const randDigits = (len: number) =>
  Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");

const sampleStudents = (): Student[] =>
  Array.from({ length: 8 }, (_, i) => ({
    id: uid(),
    studentNumber: String(1001 + i),
    books: [randDigits(6), randDigits(6), randDigits(6)],
    confirmed: true,
    createdAt: Date.now() - (8 - i) * 1000,
  }));

type Field = "student" | 0 | 1 | 2;

/** Next cell to fill for a student, or "done" when the row is complete. */
function nextCell(s: Student | undefined): Field | "done" {
  if (!s || !s.studentNumber) return "student";
  const idx = s.books.findIndex((b) => b === null || b === "");
  if (idx === -1) return "done";
  return idx as Field;
}

export default function App() {
  const [students, setStudents] = useLocalStorage<Student[]>(
    "barcode-students",
    [],
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [activeRow, setActiveRow] = useState(0);
  const [manualCol, setManualCol] = useState<Field | null>(null);
  const [focused, setFocused] = useState(() =>
    typeof document !== "undefined" ? document.hasFocus() : true,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  const activate = useCallback(() => {
    window.focus();
    containerRef.current?.focus();
    setFocused(true);
  }, []);

  // Keep the displayed page in sync with the active row.
  useEffect(() => {
    const tp = Math.floor(activeRow / PER_PAGE);
    setCurrentPage((p) => (tp !== p ? tp : p));
  }, [activeRow]);

  // Total pages: always large enough to show the active row's page, even when
  // it points at the first empty slot of a not-yet-started page.
  const totalPages = Math.max(
    1,
    Math.ceil(students.length / PER_PAGE),
    Math.floor(activeRow / PER_PAGE) + 1,
  );

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  const safePage = Math.min(currentPage, totalPages - 1);
  const pageStart = safePage * PER_PAGE;
  const pageStudents = students.slice(pageStart, pageStart + PER_PAGE);
  const rows = Array.from(
    { length: PER_PAGE },
    (_, i) => pageStudents[i] ?? null,
  );

  const activeCol = useMemo<Field>(() => {
    if (manualCol !== null) return manualCol;
    const c = nextCell(students[activeRow]);
    return c === "done" ? "student" : c;
  }, [students, activeRow, manualCol]);

  // --- Scan handling ---
  const handleScan = useCallback(
    (code: string) => {
      const cur = students;
      const row = activeRow;
      const auto = nextCell(cur[row]);
      const col: Field = manualCol ?? (auto === "done" ? "student" : auto);
      const targetRow = auto === "done" && manualCol === null ? row + 1 : row;
      const target = cur[targetRow] ?? emptyStudent();

      const wouldBe: Student = { ...target };
      if (col === "student") wouldBe.studentNumber = code;
      else {
        wouldBe.books = [...target.books];
        wouldBe.books[col] = code;
      }
      const willDone = nextCell(wouldBe) === "done";

      setStudents((prev) => {
        const arr = [...prev];
        while (arr.length <= targetRow) arr.push(emptyStudent());
        const s = { ...arr[targetRow] };
        if (col === "student") s.studentNumber = code;
        else {
          s.books = [...s.books];
          s.books[col] = code;
        }
        if (willDone) s.confirmed = true;
        arr[targetRow] = s;
        return arr;
      });

      setActiveRow(willDone ? targetRow + 1 : targetRow);
      setManualCol(null);
    },
    [students, activeRow, manualCol, setStudents],
  );

  // Enter with no scanned data = manual confirm → advance to next row.
  const handleEmptyEnter = useCallback(() => {
    setStudents((prev) => {
      if (!prev[activeRow] || !prev[activeRow].studentNumber) return prev;
      const arr = [...prev];
      arr[activeRow] = { ...arr[activeRow], confirmed: true };
      return arr;
    });
    setActiveRow((r) => r + 1);
    setManualCol(null);
  }, [activeRow, setStudents]);

  const commitCell = useCallback(
    (abs: number, field: Field, value: string) => {
      setStudents((prev) => {
        const arr = [...prev];
        while (arr.length <= abs) arr.push(emptyStudent());
        const s = { ...arr[abs], books: [...arr[abs].books] };
        if (field === "student") s.studentNumber = value;
        else s.books[field] = value || null;
        s.confirmed = nextCell(s) === "done";
        arr[abs] = s;
        return arr;
      });
      setManualCol(null);
    },
    [setStudents],
  );

  const clearCell = useCallback(
    (abs: number, field: Field) => {
      setStudents((prev) => {
        if (!prev[abs]) return prev;
        const arr = [...prev];
        const s = { ...arr[abs], books: [...arr[abs].books] };
        if (field === "student") s.studentNumber = "";
        else s.books[field] = null;
        s.confirmed = false;
        arr[abs] = s;
        return arr;
      });
      setManualCol(null);
    },
    [setStudents],
  );

  const deleteRow = useCallback(
    (abs: number) => {
      const newLen = Math.max(0, students.length - 1);
      setStudents((prev) => prev.filter((_, i) => i !== abs));
      // Keep the active cursor aligned with the shifted data.
      setActiveRow((prev) => {
        if (prev > abs) return Math.min(prev - 1, newLen);
        if (prev === abs) return Math.min(prev, newLen);
        return prev;
      });
    },
    [students.length, setStudents],
  );

  const clearAll = useCallback(() => {
    setStudents([]);
    setActiveRow(0);
    setManualCol(null);
    setCurrentPage(0);
  }, [setStudents]);

  const clearPage = useCallback(() => {
    const end = pageStart + PER_PAGE;
    setStudents((prev) => prev.filter((_, i) => i < pageStart || i >= end));
    if (activeRow >= pageStart && activeRow < end) setActiveRow(pageStart);
    setManualCol(null);
  }, [pageStart, activeRow, setStudents]);

  const activateCell = useCallback((abs: number, field: Field) => {
    setActiveRow(abs);
    setManualCol(field);
  }, []);

  useBarcodeScanner({
    onScan: handleScan,
    onEmptyEnter: handleEmptyEnter,
    minLength: 1,
  });

  const stats = useMemo(
    () => ({
      total: students.length,
      confirmed: students.filter((s) => s.confirmed).length,
      books: students.reduce(
        (acc, s) => acc + s.books.filter((b) => b !== null && b !== "").length,
        0,
      ),
    }),
    [students],
  );

  const activeStudent = students[activeRow];
  const filledBooks = activeStudent
    ? activeStudent.books.filter((b) => b !== null && b !== "").length
    : 0;
  const statusText =
    activeCol === "student"
      ? "児童番号をスキャンしてください"
      : `本${filledBooks + 1}をスキャン（3冊 or Enterで次の児童へ）`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800">
      <div
        ref={containerRef}
        tabIndex={-1}
        className="app-screen flex min-h-screen flex-col bg-slate-100 text-slate-800 outline-none"
      >
      <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-800">
                図書室 貸出バーコード表
                <span className="ml-2 text-slate-500">{todayString()}</span>
              </h1>
              <p className="text-[11px] text-slate-500">
                児童 → 本1 → 本2 → 本3 の順にスキャン・3冊 or Enterで次の行へ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
              <span className="flex items-center gap-1 text-slate-600">
                <Users className="h-3.5 w-3.5 text-sky-500" />
                <b>{stats.total}</b>名登録中
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-0.5 text-slate-600">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <b>{stats.confirmed}</b>名確定
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-0.5 text-slate-600">
                <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                <b>{stats.books}</b>冊
              </span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1 rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
            >
              <Printer className="h-3.5 w-3.5" /> A4印刷
            </button>
            <button
              type="button"
              onClick={() => {
                setStudents(sampleStudents());
                setActiveRow(8);
                setManualCol(null);
                setCurrentPage(0);
              }}
              className="flex items-center gap-1 rounded-lg bg-sky-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-sky-600"
            >
              <Users className="h-3.5 w-3.5" /> サンプル8名
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 rounded-lg bg-rose-500 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-rose-600"
            >
              <Eraser className="h-3.5 w-3.5" /> 全消去
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-sky-50">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-3 py-1.5 text-sm">
            <ScanLine
              className={[
                "h-4 w-4",
                activeRow < students.length ? "text-sky-600" : "text-slate-400",
              ].join(" ")}
            />
            <span
              className={[
                "font-semibold",
                activeRow < students.length ? "text-sky-700" : "text-slate-600",
              ].join(" ")}
            >
              {statusText}
            </span>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[110px] text-center text-xs font-bold text-slate-700">
                ページ {safePage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={safePage >= totalPages - 1}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={clearPage}
                title="このページの児童を全削除"
                className="ml-1 flex items-center gap-1 rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> このページを消去
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-3 py-3">
        <div className="max-h-[calc(100vh-170px)] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <StudentTable
            rows={rows}
            pageStart={pageStart}
            activeRow={activeRow}
            activeCol={activeCol}
            onCommitCell={commitCell}
            onClearCell={clearCell}
            onDeleteRow={deleteRow}
            onActivateCell={activateCell}
          />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-[1400px] shrink-0 px-3 pb-3 text-center text-[11px] text-slate-400">
        画面1ページ{PER_PAGE}名・印刷は1ページ10名（A4横向き）・Code 39・ブラウザに自動保存（再読み込みOK）
      </footer>

      {!focused && (
        <button
          type="button"
          onClick={activate}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-7 text-center shadow-2xl">
            <MousePointerClick className="h-12 w-12 text-sky-500" />
            <p className="text-lg font-bold text-slate-800">
              ここをクリックしてスキャンを開始
            </p>
            <p className="max-w-sm text-sm text-slate-500">
              バーコードリーダーの入力をアプリで受け取るため、最初にこの画面をクリックしてください。
            </p>
          </div>
        </button>
      )}
      </div>

      <PrintSheet students={students} />
    </div>
  );
}
