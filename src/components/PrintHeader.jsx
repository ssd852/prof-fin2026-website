export default function PrintHeader() {
  const today = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="print-header print-only">
      <div className="print-logo">م</div>
      <div className="print-company">
        <h1>المحاسب الذكي</h1>
        <p>منصة المحاسبة والإدارة المالية — تقرير رسمي</p>
      </div>
      <div className="print-date">
        <p>{today}</p>
        <p style={{ marginTop: 4 }}>رام الله — فلسطين</p>
      </div>
    </div>
  );
}

export function PrintFooter() {
  return (
    <div className="print-footer print-only">
      <p>المحاسب الذكي © {new Date().getFullYear()} — جميع الحقوق محفوظة | هذا التقرير تم إنشاؤه آلياً ولا يحتاج لختم أو توقيع</p>
    </div>
  );
}
