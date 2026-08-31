import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import logo1 from './images/logo1.png';

const API_BASE = '/api';

function MLCRegistrationPrint({ bodyId, onClose, isInner = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const docRef = useRef();

  // Fetch MLC registration data
  useEffect(() => {
    if (!bodyId) return;
    axios
      .get(`${API_BASE}/mlc-registration/${bodyId}`)
      .then((res) => {
        console.log('MLC REGISTRATION DATA:', res.data);
        setData(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.error || err.message);
      });
  }, [bodyId]);

  // Format helpers
  const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const fmtDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ' ' + new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fmtTime = (timeStr) => {
    if (!timeStr) return '—';
    if (/am|pm/i.test(timeStr)) return timeStr;
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].substring(0, 2);
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${minutes} ${ampm}`;
  };

  // PDF Download
  const downloadPDF = () => {
    const element = docRef.current;
    const opt = {
      margin: 0.4,
      filename: `MLC_Registration_${data?.bodyNumber || bodyId}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Print
  const handlePrint = () => {
    const printContents = docRef.current?.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>MLC Registration - ${data?.bodyNumber || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; margin: 0; padding: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 6px 10px; border: 1px solid #ccc; }
            th { background: #f3f4f6; text-align: left; font-weight: 600; }
            .section-header { background: #1e3a5f; color: white; padding: 6px 10px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
            .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
            .sig-box { border: 1px solid #ccc; padding: 16px; min-height: 120px; }
            .sig-label { font-size: 10px; color: #666; border-top: 1px solid #999; padding-top: 4px; margin-top: 32px; }
            
            .signature-page {
              page-break-before: always;
              break-before: page;
            }
            .signature-container {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            @media print { .no-print { display: none !important; } }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  // Loading / Error states
  if (!data && !error) {
    return isInner ? (
      <p className="text-gray-500 text-center text-xs py-4">Loading MLC registration data...</p>
    ) : (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <p className="text-gray-600">Loading MLC Registration...</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
        </div>
      </div>
    );
  }

  if (error) {
    return isInner ? (
      <p className="text-red-500 text-center text-xs py-4">Error: {error}</p>
    ) : (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <p className="text-red-600 font-semibold">Error loading MLC data</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
        </div>
      </div>
    );
  }

  const {
    bodyNumber, hospitalNumber, patientName, gender, age, locality,
    dateOfDeath, timeOfDeath, declaredBy, reasonOfDeath,
    deathIntimationNo, mlcNo,
    policeStationName, stationSiName, presentPoliceOfficerName,
    freezerRequired, nocCertificateUrl,
    witness1Name, witness1Address, witness1Contact,
    witness2Name, witness2Address, witness2Contact,
    createdAt,
    bodyType
  } = data;

  // Row helper for table
  const Row = ({ label, value, colSpan }) => (
    <tr>
      <td style={{ background: '#f9fafb', fontWeight: 600, width: colSpan ? '100%' : '38%', padding: '7px 12px', border: '1px solid #e5e7eb', fontSize: '11px', color: '#374151' }}>{label}</td>
      {!colSpan && <td style={{ padding: '7px 12px', border: '1px solid #e5e7eb', fontSize: '11px', color: '#111827' }}>{value || '—'}</td>}
      {colSpan && <td colSpan="1" style={{ padding: '7px 12px', border: '1px solid #e5e7eb', fontSize: '11px', color: '#111827' }}>{value || '—'}</td>}
    </tr>
  );

  const SectionHeader = ({ title, color = '#1e3a5f' }) => (
    <tr>
      <td colSpan="2" style={{ background: color, color: 'white', padding: '7px 12px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </td>
    </tr>
  );

  // The document content (shared between inner/outer modes)
  const DocumentContent = () => (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#1a1a1a' }}>

      {/* ── HEADER (identical to MortuaryBillPrint / ServiceBillPrint) ── */}
      <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ marginBottom: '10px' }}>
          <img src={logo1} alt="MOSC Hospital Logo" style={{ height: '64px', margin: '0 auto', display: 'block' }} />
        </div>
        <p style={{ color: '#6b7280', fontSize: '11px', margin: '0 0 6px' }}>
          Kolenchery, Ernakulam, Kerala
        </p>
        <p style={{ fontWeight: 700, fontSize: '15px', color: '#1e3a8a', letterSpacing: '0.08em', margin: '6px 0 0', textTransform: 'uppercase' }}>
          MLC Registration Form
        </p>
        <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>
          Medico-Legal Case | Official Mortuary Record
        </p>
      </div>

      {/* ── REGISTRATION META ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 40px', marginBottom: '18px', fontSize: '11px' }}>
        <p style={{ margin: 0 }}><strong>Registration No:</strong> MLC-{bodyNumber?.replace('MOSC-', '') || '—'}</p>
        <p style={{ margin: 0 }}><strong>Registration Date &amp; Time:</strong> {fmtDateTime(createdAt)}</p>
        <p style={{ margin: 0 }}><strong>Body Number:</strong> {bodyNumber || '—'}</p>
        <p style={{ margin: 0 }}><strong>Document Type:</strong> MLC Registration Record</p>
      </div>

      {/* ── SECTION A: BODY INFORMATION ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
        <tbody>
          <SectionHeader title="Section A — Body Information" />
          <Row label="Patient / Deceased Name" value={patientName} />
          <Row label="Hospital Number" value={hospitalNumber} />
          <Row label="Gender" value={gender} />
          <Row label="Age" value={age ? `${age} years` : '—'} />
          <Row label="Locality / Address" value={locality} />
          <Row label="Date of Death" value={fmtDate(dateOfDeath)} />
          <Row label="Time of Death" value={fmtTime(timeOfDeath)} />
          <Row label="Declared By" value={declaredBy} />
          <Row label="Cause / Reason of Death" value={reasonOfDeath} />
          <Row label="MLC Number" value={mlcNo} />
          <Row label="Death Intimation No." value={deathIntimationNo} />
        </tbody>
      </table>

      {/* ── SECTION B: POLICE INFORMATION ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
        <tbody>
          <SectionHeader title="Section B — Police Information" color="#7f1d1d" />
          <Row label="Police Station Name" value={policeStationName} />
          <Row label="Station SI Name" value={stationSiName} />
          <Row label="Present Police Officer Name" value={presentPoliceOfficerName} />
        </tbody>
      </table>

      {/* ── SECTION C: MORTUARY INFORMATION ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
        <tbody>
          <SectionHeader title="Section C — Mortuary Information" color="#14532d" />
          <Row label="Mortuary Registration Number" value={bodyNumber} />
          <Row label="Registration Date &amp; Time" value={fmtDateTime(createdAt)} />
          <Row
            label="Freezer / Mortuary Stay Required"
            value={
              freezerRequired === 0
                ? 'NO — Body does not require mortuary/freezer stay'
                : 'YES — Body requires mortuary/freezer stay'
            }
          />
          <Row
            label="NOC Certificate"
            value={
              nocCertificateUrl
                ? `YES — File attached (uploaded on ${fmtDateTime(createdAt)})`
                : 'NO — Not uploaded'
            }
          />
        </tbody>
      </table>

      {/* ── WITNESS DETAILS ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
        <tbody>
          <SectionHeader title="Witness Details" color="#4c1d95" />
          <tr>
            <td style={{ padding: '7px 12px', border: '1px solid #e5e7eb', width: '50%', verticalAlign: 'top' }}>
              <p style={{ fontWeight: 700, fontSize: '11px', margin: '0 0 6px', color: '#374151' }}>WITNESS 1</p>
              <p style={{ margin: '2px 0', fontSize: '11px' }}><strong>Name:</strong> {witness1Name || '—'}</p>
              <p style={{ margin: '2px 0', fontSize: '11px' }}><strong>Address:</strong> {witness1Address || '—'}</p>
              <p style={{ margin: '2px 0', fontSize: '11px' }}><strong>Contact:</strong> {witness1Contact || '—'}</p>
            </td>
            <td style={{ padding: '7px 12px', border: '1px solid #e5e7eb', width: '50%', verticalAlign: 'top' }}>
              <p style={{ fontWeight: 700, fontSize: '11px', margin: '0 0 6px', color: '#374151' }}>WITNESS 2</p>
              <p style={{ margin: '2px 0', fontSize: '11px' }}><strong>Name:</strong> {witness2Name || '—'}</p>
              <p style={{ margin: '2px 0', fontSize: '11px' }}><strong>Address:</strong> {witness2Address || '—'}</p>
              <p style={{ margin: '2px 0', fontSize: '11px' }}><strong>Contact:</strong> {witness2Contact || '—'}</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── SIGNATURE SECTION WRAPPER ── */}
      <div
        className="signature-page"
        style={{
          pageBreakBefore: 'always',
          breakBefore: 'page',
          pageBreakInside: 'avoid',
          breakInside: 'avoid'
        }}
      >
        <div
          className="signature-container"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginTop: '30px',
            pageBreakInside: 'avoid',
            breakInside: 'avoid'
          }}
        >
          {/* Police Signature */}
          <div
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '20px',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <p style={{ fontWeight: 700, fontSize: '12px', margin: '0 0 14px', color: '#7f1d1d', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #fca5a5', paddingBottom: '6px' }}>
              Present Police Officer
            </p>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>Name:</p>
              <div style={{ borderBottom: '1px solid #9ca3af', height: '36px' }}></div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>Designation:</p>
              <div style={{ borderBottom: '1px solid #9ca3af', height: '36px' }}></div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>Police Station:</p>
              <div style={{ borderBottom: '1px solid #9ca3af', height: '36px' }}></div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>Signature:</p>
              <div style={{ borderBottom: '1px solid #9ca3af', height: '60px' }}></div>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>Date:</p>
              <div style={{ borderBottom: '1px solid #9ca3af', height: '36px' }}></div>
            </div>
          </div>

          {/* Mortuary In-Charge Signature */}
          <div
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '20px',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <p style={{ fontWeight: 700, fontSize: '12px', margin: '0 0 14px', color: '#14532d', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #86efac', paddingBottom: '6px' }}>
              Mortuary In-Charge
            </p>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>Name:</p>
              <div style={{ borderBottom: '1px solid #9ca3af', height: '36px' }}></div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>Signature:</p>
              <div style={{ borderBottom: '1px solid #9ca3af', height: '60px' }}></div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>Date:</p>
              <div style={{ borderBottom: '1px solid #9ca3af', height: '36px' }}></div>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>Seal:</p>
              <div style={{ borderBottom: '1px solid #9ca3af', height: '60px' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#9ca3af', marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
        This is a computer-generated MLC Registration Record. MOSC Medical College Hospital, Kolenchery, Ernakulam, Kerala.
      </div>
    </div>
  );

  // ── INNER MODE (used inside a wrapper div for PDF) ──
  if (isInner) {
    return (
      <div ref={docRef} className="text-sm text-gray-800">
        <DocumentContent />
      </div>
    );
  }

  // ── FULL MODAL MODE ──
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center overflow-auto p-4">

      {/* Controls */}
      <div className="no-print flex gap-3 mb-4">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm flex items-center gap-2"
        >
          🖨 Print MLC Registration
        </button>
        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
        >
          ⬇ Download MLC PDF
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium text-sm"
        >
          Close
        </button>
      </div>

      {/* Document Preview */}
      <div
        ref={docRef}
        className="bg-white w-[800px] p-8 rounded-xl shadow-lg text-sm text-gray-800"
      >
        <DocumentContent />
      </div>
    </div>
  );
}

export default MLCRegistrationPrint;
