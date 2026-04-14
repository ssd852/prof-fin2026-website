import { useState } from 'react';
import { Scan, Loader, CheckCircle } from 'lucide-react';

export default function OCRZone({ onScanned }) {
  const [state, setState] = useState('idle');

  const handleScan = () => {
    setState('scanning');
    setTimeout(() => {
      setState('done');
      onScanned({
        supplier_id: 1,
        subtotal: 478000,
        description: 'شراء مواد خام — مسح ذكي',
        date: new Date().toISOString().split('T')[0],
      });
      setTimeout(() => setState('idle'), 1500);
    }, 2200);
  };

  return (
    <div
      className={`ocr-zone mb-4 ${state === 'scanning' ? 'ocr-scanning' : ''} ${state === 'done' ? 'border-emerald-500/30 bg-emerald-500/[0.05]' : ''}`}
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
      onDragLeave={(e) => e.currentTarget.classList.remove('dragover')}
      onDrop={(e) => { e.preventDefault(); handleScan(); }}
      onClick={state === 'idle' ? handleScan : undefined}
    >
      {state === 'idle' && (
        <>
          <Scan size={28} color="#64748b" className="mx-auto mb-2" />
          <p className="text-[12px] text-surface-400 font-medium">اسحب فاتورة هنا أو اضغط للمسح الذكي</p>
          <p className="text-[10px] text-surface-500 mt-1">يدعم PDF, JPG, PNG</p>
        </>
      )}
      {state === 'scanning' && (
        <>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader size={20} color="#22d3ee" className="animate-spin" />
            <span className="text-[13px] text-primary-400 font-bold">جاري المسح الذكي...</span>
          </div>
          <div className="h-1 bg-surface-800 rounded-full overflow-hidden mx-12">
            <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" style={{ animation: 'scanBar 2s ease-in-out' }} />
          </div>
        </>
      )}
      {state === 'done' && (
        <>
          <CheckCircle size={24} color="#34d399" className="mx-auto mb-1" />
          <p className="text-[12px] text-emerald-400 font-bold">✓ تم المسح — البيانات معبأة تلقائياً</p>
        </>
      )}
    </div>
  );
}
