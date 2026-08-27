import PrintBarcode from "./PrintBarcode";
import { todayString } from "../utils/date";
import type { Student } from "../types";

const PER_PAGE = 10;

type PrintSheetProps = {
  students: Student[];
};

/**
 * Off-screen (hidden on screen) layout that becomes the only visible content
 * when printing. Renders ALL students as a series of A4 landscape tables, 10
 * rows per page, with an automatic page break after each page.
 */
export default function PrintSheet({ students }: PrintSheetProps) {
  const pages: (Student | null)[][] = [];
  for (let i = 0; i < students.length || i === 0; i += PER_PAGE) {
    const chunk = students.slice(i, i + PER_PAGE);
    pages.push(
      Array.from({ length: PER_PAGE }, (_, j) => chunk[j] ?? null),
    );
  }

  return (
    <div className="print-only" aria-hidden>
      {pages.map((rows, pIdx) => (
        <div
          key={pIdx}
          className="print-page"
          style={
            pIdx < pages.length - 1
              ? { breakAfter: "page", pageBreakAfter: "always" }
              : undefined
          }
        >
          <div className="print-header-row">
            <h2 className="print-title">図書室 貸出バーコード表</h2>
            <span className="print-date">{todayString()}</span>
          </div>
          <p className="print-subtitle">
            （{pIdx + 1} / {pages.length} ページ）
          </p>
          <table className="print-table">
            <thead>
              <tr>
                <th className="col-no">No.</th>
                <th>児童</th>
                <th>本1</th>
                <th>本2</th>
                <th>本3</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={i}>
                  <td className="col-no">{pIdx * PER_PAGE + i + 1}</td>
                  <td>
                    <PrintCell value={s?.studentNumber ?? ""} />
                  </td>
                  <td>
                    <PrintCell value={s?.books[0] ?? ""} />
                  </td>
                  <td>
                    <PrintCell value={s?.books[1] ?? ""} />
                  </td>
                  <td>
                    <PrintCell value={s?.books[2] ?? ""} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function PrintCell({ value }: { value: string }) {
  if (!value) {
    return <div className="print-empty">&nbsp;</div>;
  }
  return <PrintBarcode value={value} />;
}
