import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import logo1 from './images/logo1.png';

const API_BASE = '/api';

function BillPrint({ billingId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const billRef = useRef();

  // Fetch data
  useEffect(() => {
    if (!billingId) return;

    axios
      .get(`${API_BASE}/billing/${billingId}/full`)
      .then((res) => {
        console.log("API DATA:", res.data);
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
    });
  };

  const money = (val) => `₹${Number(val || 0).toFixed(2)}`;

  // PDF Download
  const downloadPDF = () => {
    const element = billRef.current;

    const opt = {
      margin: 0.3,
      filename: `Bill_${data?.bodyNumber || 'invoice'}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(element).save();
  };

  // Loading / Error
  if (!data) {
    return (
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
    cabinNumber,
    admissionDateTime,
    bodyReleasedAt,
    totalAmount,
    servicesAmount,
    discountAmount,
    netAmount,
    status,
    billCreatedAt,
    services = [],
    firstDayCharge,
    extraHours,
    hourlyRate,
    additionalHourCharges,
    totalHours,
    advanceAmount,
    staffConcession,
    staffName,
    staffEmployeeId,
    staffAddress,
    staffPhone,
    staffRelation
  } = data;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center overflow-auto p-4">

      {/* Top Buttons */}
      <div className="no-print flex gap-3 mb-4">
        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Download PDF
        </button>

        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 rounded-lg"
        >
          Close
        </button>
      </div>

      {/* BILL */}
      <div
        ref={billRef}
        className="bg-white w-[800px] p-6 rounded-xl shadow-lg text-sm text-gray-800"
      >

        {/* HEADER */}
        <div className="border-b pb-4 mb-4 text-center">
          <div  className='grid grid-cols-1 items-center mb-3'>
              <img src={logo1} alt="Logo" className="mx-auto h-16" />
                {/* <h2 className="text-xl font-bold">
          Malankara Orthodox Syrian Church Medical College
          </h2> */}
          </div>
        
          <p className="text-gray-500 text-xs">
            Kolenchery, Ernakulam, Kerala
          </p>
          <p className="font-semibold mt-2">MORTUARY BILL</p>
        </div>

        {/* DETAILS */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <p><b>Body No:</b> {bodyNumber}</p>
          <p><b>Cabin:</b> {cabinNumber}</p>
          <p><b>Name:</b> {patientName}</p>
          <p><b>Type:</b> {bodyType}</p>
          <p><b>Entry:</b> {fmt(admissionDateTime)}</p>
          <p><b>Exit:</b> {fmt(bodyReleasedAt)}</p>
        </div>

        {/* TABLE */}
        <table className="w-[80%] ml-auto mr-auto border text-sm mb-4">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {totalHours !== null && totalHours !== undefined ? (
              <>
                <tr>
                  <td className="p-2 font-medium">
                    Cabin Charges ({totalHours} hour{totalHours !== 1 ? 's' : ''} stay)
                    <div className="text-xs text-gray-500 font-normal mt-0.5">
                      First 24 hrs: {money(firstDayCharge)}
                      {extraHours > 0 && ` + Extra: ${extraHours} hrs × ${money(hourlyRate)}/hr`}
                    </div>
                  </td>
                  <td className="p-2 text-right font-medium">{money(totalAmount)}</td>
                </tr>
                {advanceAmount > 0 && (
                  <tr>
                    <td className="p-2 text-gray-600 italic">Less: Advance Paid</td>
                    <td className="p-2 text-right text-gray-600 italic">- {money(advanceAmount)}</td>
                  </tr>
                )}
              </>
            ) : (
              <tr>
                <td className="p-2">Cabin Charges</td>
                <td className="p-2 text-right">{money(totalAmount)}</td>
              </tr>
            )}

            {services.map((s, i) => (
              <tr key={i}>
                <td className="p-2">{s.serviceName}</td>
                <td className="p-2 text-right">{money(s.amount)}</td>
              </tr>
            ))}

            {discountAmount > 0 && (
              <tr className="text-red-600">
                <td className="p-2">Discount</td>
                <td className="p-2 text-right">- {money(discountAmount)}</td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr className="bg-blue-600 text-white font-bold">
              <td className="p-2">Net Amount</td>
              <td className="p-2 text-right">{money(netAmount)}</td>
            </tr>
          </tfoot>
        </table>

        {/* STAFF CONCESSION DETAILS */}
        {staffConcession === 1 && (
          <div className="w-[80%] ml-auto mr-auto mt-6 border border-green-200 bg-green-50 p-4 rounded-lg">
            <h3 className="font-bold text-green-800 text-xs mb-3 uppercase tracking-wider border-b border-green-200 pb-1">
              STAFF CONCESSION DETAILS
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700">
              <p><b>Staff Name:</b> {staffName}</p>
              <p><b>Staff ID:</b> {staffEmployeeId}</p>
              <p><b>Phone:</b> {staffPhone}</p>
              <p><b>Relation to Deceased:</b> {staffRelation}</p>
              <p className="col-span-2"><b>Address:</b> {staffAddress}</p>
              <div className="col-span-2 border-t border-green-200/60 pt-2 mt-1 space-y-1">
                <p><b>Concession Type:</b> <span className="text-green-700 font-semibold">100% Staff Welfare Concession</span></p>
                <p><b>Discount Applied:</b> {money(discountAmount)}</p>
                <p className="text-sm font-bold text-green-800 mt-1"><b>Final Payable:</b> {money(netAmount)}</p>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="text-center text-xs text-gray-500 mt-6">
            Bill
        </div>
      </div>
    </div>
  );
}

export default BillPrint;