import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import logo1 from './images/logo1.png';

const API_BASE = '/api';

function ServiceBillPrint({ billingId, onClose, isInner = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const billRef = useRef();

  // Fetch data
  useEffect(() => {
    if (!billingId) return;

    axios
      .get(`${API_BASE}/service-billing/${billingId}/full`)
      .then((res) => {
        console.log("SERVICE BILL API DATA:", res.data);
        setData(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.error || err.message);
      });
  }, [billingId]);

  // Format helpers
  const fmt = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' ' + new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const money = (val) => `₹${Number(val || 0).toFixed(2)}`;

  // PDF Download
  const downloadPDF = () => {
    const element = billRef.current;

    const opt = {
      margin: 0.3,
      filename: `ServiceBill_${data?.bodyNumber || 'invoice'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(element).save();
  };

  // Loading / Error
  if (!data) {
    return isInner ? (
      <p className="text-gray-500 text-center text-xs">Loading...</p>
    ) : (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          {error ? (
            <>
              <p className="text-red-600 font-semibold">Error</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </>
          ) : (
            <p className="text-gray-600">Loading bill...</p>
          )}
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const {
    bodyNumber,
    patientName,
    bodyType,
    hospitalNumber,
    mlcNo,
    cabinNumber,
    admissionDateTime,
    bodyReleasedAt,
    serviceName,
    serviceAmount,
    discountAmount,
    netAmount,
    createdAt,
    staffConcession,
    staffName,
    staffEmployeeId,
    staffAddress,
    staffPhone,
    staffRelation
  } = data;

  const billNo = `SB-${bodyNumber?.replace('MOSC-', '')}`;

  if (isInner) {
    return (
      <div ref={billRef} className="text-sm text-gray-800">
        {/* HEADER */}
        <div className="border-b pb-4 mb-4 text-center">
          <div className='grid grid-cols-1 items-center mb-3'>
            <img src={logo1} alt="Logo" className="mx-auto h-16" />
          </div>
          <p className="text-gray-500 text-xs">
            Kolenchery, Ernakulam, Kerala
          </p>
          <p className="font-bold text-base mt-2 text-blue-900 tracking-wider">BODY DRESSING SERVICE RECEIPT</p>
        </div>

        {/* DETAILS SECTION */}
        <div className="bg-gray-50 p-4 rounded-lg border mb-4">
          <h4 className="font-bold text-gray-700 border-b pb-1 mb-2 text-xs uppercase tracking-wider">Deceased Info & Bill Details</h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <p><b>Deceased Name:</b> {patientName || 'N/A'}</p>
            <p><b>Body Number:</b> {bodyNumber}</p>
            <p><b>Hospital Number:</b> {hospitalNumber || 'N/A'}</p>
            <p><b>Body Type (MLC):</b> {bodyType || 'N/A'}</p>
            <p><b>Cabin Number:</b> {cabinNumber || 'N/A'}</p>
            <p><b>Mortuary Reg. Number (MLC No):</b> {mlcNo || 'N/A'}</p>
            <p><b>Date & Time of Admission:</b> {fmt(admissionDateTime)}</p>
            <p><b>Date & Time of Release:</b> {fmt(bodyReleasedAt)}</p>
            <p className="col-span-2 border-t pt-2 mt-1"><b>Bill Number:</b> <span className="text-blue-700 font-bold">{billNo}</span></p>
            <p className="col-span-2"><b>Bill Date:</b> {fmt(createdAt)}</p>
          </div>
        </div>

        {/* BILLING BREAKDOWN */}
        <table className="w-[80%] ml-auto mr-auto border text-sm mb-4">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-center">Qty</th>
              <th className="p-2 text-right">Rate</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="p-2 font-medium">{serviceName || 'Body Dressing Service'}</td>
              <td className="p-2 text-center">1</td>
              <td className="p-2 text-right">{money(serviceAmount)}</td>
              <td className="p-2 text-right font-medium">{money(serviceAmount)}</td>
            </tr>


          </tbody>

          <tfoot>
            <tr className="bg-blue-600 text-white font-bold">
              <td colSpan="3" className="p-2 text-right">NET PAYABLE:</td>
              <td className="p-2 text-right">{money(netAmount)}</td>
            </tr>
          </tfoot>
        </table>



        {/* FOOTER */}
        <div className="text-center text-xs text-gray-500 mt-12 border-t pt-4">
          Thank you for choosing MOSC Medical College Hospital. This is a computer-generated receipt.
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center overflow-auto p-4">

      {/* Top Buttons */}
      <div className="no-print flex gap-3 mb-4">
        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Download PDF
        </button>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm"
        >
          Close
        </button>
      </div>

      {/* BILL */}
      <div
        ref={billRef}
        className="bg-white w-[800px] p-6 rounded-xl shadow-lg text-sm text-gray-800"
      >
        <ServiceBillPrint billingId={billingId} isInner={true} />
      </div>
    </div>
  );
}

export default ServiceBillPrint;
