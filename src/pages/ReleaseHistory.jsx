import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  History,
  Search,
  X,
  Eye,
  User,
  Phone,
  MapPin,
  Calendar,
  Bed,
  Receipt,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText
} from 'lucide-react';

const API_BASE = '/api';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function Badge({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

function documentUrl(value) {
  if (!value) return null;
  const normalized = String(value).replace(/\\/g, '/');
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('/uploads/')) return normalized;
  const filename = normalized.split('/').filter(Boolean).pop();
  return filename ? `/uploads/${encodeURIComponent(filename)}` : null;
}

function DetailModal({ record, onClose }) {
  if (!record) return null;

  const isMLC = record.bodyType === 'MLC';
  const isStaff = record.staffConcession === 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white text-xl font-bold">Release Details</h2>
            <p className="text-blue-100 text-sm mt-0.5">{record.bodyNumber} — {record.patientName || 'Unknown'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Body Info */}
          <Section icon={<FileText size={15} />} title="Body Information">
            <Grid>
              <InfoRow label="Body Number" value={record.bodyNumber} />
              <InfoRow label="Patient Name" value={record.patientName || '—'} />
              <InfoRow label="Body Type" value={
                <Badge color={isMLC ? 'red' : 'blue'}>{record.bodyType}</Badge>
              } />
              <InfoRow label="Gender" value={record.gender || '—'} />
              <InfoRow label="Age" value={record.age ? `${record.age} yrs` : '—'} />
              <InfoRow label="Hospital No." value={record.hospitalNumber || '—'} />
              {isMLC && <InfoRow label="MLC No." value={record.mlcNo || '—'} />}
              <InfoRow label="Registered On" value={fmtDate(record.bodyRegisteredAt)} />
            </Grid>
          </Section>

          {/* Cabin / Stay Info */}
          <Section icon={<Bed size={15} />} title="Mortuary Stay">
            <Grid>
              <InfoRow label="Cabin No." value={record.cabinNumber || '—'} />
              <InfoRow label="Admitted" value={fmt(record.admissionDateTime)} />
              <InfoRow label="Released" value={fmt(record.releaseDateTime)} />
              <InfoRow label="Total Stay" value={record.totalHours != null ? `${record.totalHours} hrs` : '—'} />
            </Grid>
          </Section>

          {/* Release Info */}
          <Section icon={<CheckCircle size={15} />} title="Release Information">
            <Grid>
              <InfoRow label="Release Type" value={<Badge color={isMLC ? 'red' : 'green'}>{record.releaseType || '—'}</Badge>} />
              <InfoRow label="Taken By" value={record.takenBy || '—'} />
              {!isMLC && <InfoRow label="Relationship" value={record.relationship || '—'} />}
              <InfoRow label="Contact" value={record.contactNumber || '—'} />
              {record.address && <InfoRow label="Address" value={record.address} wide />}
              {isMLC && record.policeStation && <InfoRow label="Police Station" value={record.policeStation} />}
              {isMLC && record.siName && <InfoRow label="SI Name" value={record.siName} />}
            </Grid>
          </Section>

          {(record.nocDocument || record.legalDocuments) && (
            <Section icon={<FileText size={15} />} title="Release Documents">
              <div className="flex flex-wrap gap-3">
                {record.nocDocument && (
                  <a
                    href={documentUrl(record.nocDocument)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <FileText size={16} /> View NOC/PCC
                  </a>
                )}
                {record.legalDocuments && (
                  <a
                    href={documentUrl(record.legalDocuments)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <FileText size={16} /> View Legal Document
                  </a>
                )}
              </div>
            </Section>
          )}

          {/* Billing Info */}
          {record.billingId && (
            <Section icon={<Receipt size={15} />} title="Mortuary Stay Bill">
              <Grid>
                <InfoRow label="First Day Charge" value={record.firstDayCharge != null ? `₹${Number(record.firstDayCharge).toFixed(2)}` : '—'} />
                <InfoRow label="Extra Hours" value={record.extraHours != null ? `${record.extraHours} hrs @ ₹${record.hourlyRate}/hr` : '—'} />
                <InfoRow label="Additional Hour Charges" value={record.additionalHourCharges != null ? `₹${Number(record.additionalHourCharges).toFixed(2)}` : '—'} />
                <InfoRow label="Total Stay Charge" value={record.stayTotalAmount != null ? `₹${Number(record.stayTotalAmount).toFixed(2)}` : '—'} />
                <InfoRow label="Advance Paid" value={record.advanceAmount != null ? `₹${Number(record.advanceAmount).toFixed(2)}` : '—'} />
                {Number(record.stayDiscountAmount) > 0 && (
                  <InfoRow label="Discount" value={`- ₹${Number(record.stayDiscountAmount).toFixed(2)}`} />
                )}
                {record.discountReason && <InfoRow label="Discount Reason" value={record.discountReason} wide />}
                <InfoRow label="Net Stay Payable" value={
                  <span className="font-bold text-blue-700">₹{Number(record.stayNetAmount || 0).toFixed(2)}</span>
                } />
                <InfoRow label="Stay Bill Status" value={
                  <Badge color={record.stayBillStatus === 'Settled' ? 'green' : 'yellow'}>{record.stayBillStatus}</Badge>
                } />
              </Grid>
              {isStaff && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-semibold text-green-800 flex items-center gap-1"><ShieldCheck size={13} /> Staff Concession Applied</p>
                  <p className="text-green-700">Staff: {record.staffName} &nbsp;|&nbsp; ID: {record.staffEmployeeId} &nbsp;|&nbsp; Relation: {record.staffRelation}</p>
                </div>
              )}
            </Section>
          )}

          {/* Service Bill Info */}
          {record.serviceBillId && (
            <Section icon={<Receipt size={15} />} title="Body Dressing Service Bill">
              <Grid>
                <InfoRow label="Service" value={record.serviceName || 'Body Dressing'} />
                <InfoRow label="Service Charge" value={`₹${Number(record.serviceAmount || 0).toFixed(2)}`} />
                <InfoRow label="Net Payable" value={
                  <span className="font-bold text-blue-700">₹{Number(record.serviceNetAmount || 0).toFixed(2)}</span>
                } />
                <InfoRow label="Status" value={
                  <Badge color={record.serviceBillStatus === 'Settled' ? 'green' : 'yellow'}>{record.serviceBillStatus}</Badge>
                } />
              </Grid>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 border-b border-gray-200">
        <span className="text-blue-600">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">{children}</div>;
}

function InfoRow({ label, value, wide = false }) {
  return (
    <div className={`flex flex-col gap-0.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

export default function ReleaseHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/release-history`);
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to fetch release history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchQuery = !q ||
      r.bodyNumber?.toLowerCase().includes(q) ||
      r.patientName?.toLowerCase().includes(q) ||
      r.takenBy?.toLowerCase().includes(q) ||
      r.contactNumber?.includes(q);
    const normalizedType = r.bodyType === 'MLC' || r.releaseType === 'MLC' ? 'MLC' : 'NON_MLC';
    const matchType = !filterType || normalizedType === filterType;
    return matchQuery && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <History size={26} className="text-blue-600" />
            Release History
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">All bodies that have been formally released</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          <CheckCircle size={18} className="text-green-600" />
          <span className="text-sm font-semibold text-green-700">{records.length} Released</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /> */}
            <input
              type="text"
              placeholder="Search by body number, name, taken by, contact..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Types</option>
            <option value="MLC">MLC</option>
            <option value="NON_MLC">Non-MLC</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Body Number</th>
                <th className="px-6 py-3 text-left">Patient Name</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Released On</th>
                <th className="px-6 py-3 text-left">Taken By</th>
                <th className="px-6 py-3 text-left">Stay Bill</th>
                <th className="px-6 py-3 text-left">Service Bill</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Clock size={28} className="animate-spin text-blue-400" />
                      <span>Loading release history...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={28} />
                      <span>No released records found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.releaseId} className="table-row">
                    {/* Body Number */}
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                      <div className="flex flex-col gap-1">
                        <span>{r.bodyNumber}</span>
                        {r.staffConcession === 1 && (
                          <span className="self-start px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-800 rounded-full border border-green-200 uppercase tracking-wider">
                            STAFF
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Name */}
                    <td className="px-6 py-4 text-sm text-gray-700">{r.patientName || '—'}</td>
                    {/* Type */}
                    <td className="px-6 py-4 text-sm">
                      <Badge color={r.bodyType === 'MLC' ? 'red' : 'blue'}>{r.bodyType}</Badge>
                    </td>
                    {/* Released On */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="flex flex-col">
                        <span className="font-medium">{fmtDate(r.releaseDateTime)}</span>
                        <span className="text-xs text-gray-400">{r.releaseDateTime ? new Date(r.releaseDateTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                    </td>
                    {/* Taken By */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="flex flex-col">
                        <span>{r.takenBy || '—'}</span>
                        {r.relationship && <span className="text-xs text-gray-400">{r.relationship}</span>}
                      </div>
                    </td>
                    {/* Stay Bill */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {r.billingId ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">₹{Number(r.stayNetAmount || 0).toFixed(2)}</span>
                          <Badge color={r.stayBillStatus === 'Settled' ? 'green' : 'yellow'}>{r.stayBillStatus}</Badge>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">No Bill</span>
                      )}
                    </td>
                    {/* Service Bill */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {r.serviceBillId ? (
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">₹{Number(r.serviceNetAmount || 0).toFixed(2)}</span>
                          <Badge color={r.serviceBillStatus === 'Settled' ? 'green' : 'yellow'}>{r.serviceBillStatus}</Badge>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">No Dressing</span>
                      )}
                    </td>
                    {/* Actions */}
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setSelectedRecord(r)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors border border-blue-100"
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <DetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}
    </div>
  );
}
