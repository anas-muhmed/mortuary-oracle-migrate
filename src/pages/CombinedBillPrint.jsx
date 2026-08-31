import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';
import MortuaryBillPrint from './MortuaryBillPrint';
import ServiceBillPrint from './ServiceBillPrint';

function CombinedBillPrint({ billingId, serviceId, onClose }) {
  const containerRef = useRef();

  const downloadCombinedPDF = () => {
    const element = containerRef.current;
    const opt = {
      margin: 0.3,
      filename: `CombinedReceipts_${billingId}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center overflow-auto p-4">
      {/* Top Buttons */}
      <div className="no-print flex gap-3 mb-4">
        <button
          onClick={downloadCombinedPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-1 shadow-sm"
        >
          Download Combined PDF
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm flex items-center gap-1 shadow-sm"
        >
          Close
        </button>
      </div>

      <div ref={containerRef} className="space-y-8 print-container p-4 bg-gray-100 rounded-xl">
        {/* Page 1: Mortuary Bill */}
        <div className="bg-white w-[800px] p-6 rounded-xl shadow-lg text-sm text-gray-800 border">
          <MortuaryBillPrint billingId={billingId} isInner={true} />
        </div>

        {/* Page Break */}
        <div className="page-break" style={{ pageBreakBefore: 'always', height: '1px' }} />

        {/* Page 2: Service Bill */}
        <div className="bg-white w-[800px] p-6 rounded-xl shadow-lg text-sm text-gray-800 border mt-8">
          <ServiceBillPrint billingId={serviceId} isInner={true} />
        </div>
      </div>
    </div>
  );
}

export default CombinedBillPrint;
