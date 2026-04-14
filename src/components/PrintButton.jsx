import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      className="print-btn no-print"
      onClick={() => window.print()}
      title="طباعة التقرير"
    >
      <Printer size={15} />
      <span>طباعة التقرير</span>
    </button>
  );
}
