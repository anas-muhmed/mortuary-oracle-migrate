import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Search, X, CheckCircle, AlertTriangle, Phone, MapPin, FileText, Upload, Printer } from 'lucide-react';

const API_BASE = '/api';

function BodyRelease() {
  const [bodies, setBodies] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [bills, setBills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBody, setSelectedBody] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [nocFile, setNocFile] = useState(null);
  const [legalDocumentsFile, setLegalDocumentsFile] = useState(null);
  const [releaseData, setReleaseData] = useState({
    releaseType: 'Non-MLC',
    takenBy: '',
    relationship: '',
    address: '',
    contactNumber: '',
    policeStation: '',
    siName: '',
    nocDocument: '',
    legalDocuments: ''
  });

  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      // Fetch all bodies (not filtering by status)
      const bodiesRes = await axios.get(`${API_BASE}/bodies`);

      // Fetch all allocations
      const allocationsRes = await axios.get(`${API_BASE}/cabin-allocations`);

      // Filter bodies that are either Allocated or Ready for Release
      const releaseBodies = bodiesRes.data.filter(body =>
        body.status === 'Allocated' || body.status === 'Ready for Release'
      );

      // Attach allocation data to each body
      const bodiesWithAllocations = releaseBodies.map(body => {
        const allocation = allocationsRes.data.find(a => a.bodyId === body.id && a.status === 'Allocated');
        return { ...body, allocation };
      });

      setBodies(bodiesWithAllocations);

      // Fetch bills for these bodies
      const billPromises = bodiesWithAllocations.map(b => axios.get(`${API_BASE}/billing/${b.id}`).catch(() => ({ data: null })));
      const billResponses = await Promise.all(billPromises);
      const billsData = billResponses.filter(r => r.data).map(r => r.data);
      setBills(billsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const openReleaseModal = (body) => {
    setSelectedBody(body);
    setReleaseData({
      releaseType: body.bodyType,
      takenBy: '',
      relationship: '',
      address: '',
      contactNumber: '',
      policeStation: '',
      siName: '',
      nocDocument: '',
      legalDocuments: ''
    });
    setNocFile(null);
    setLegalDocumentsFile(null);
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReleaseData({ ...releaseData, [name]: value });
  };

  const handleSubmitRelease = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('bodyId', selectedBody.id);
      formData.append('caseType', selectedBody.bodyType === 'MLC' ? 'MLC' : 'NON_MLC');
      formData.append('bodyTakenBy', releaseData.takenBy);
      formData.append('relationship', releaseData.relationship);
      formData.append('address', releaseData.address);
      formData.append('contactNumber', releaseData.contactNumber);
      formData.append('policeStationName', releaseData.policeStation);
      formData.append('siName', releaseData.siName);
      if (nocFile) formData.append('nocFile', nocFile);
      if (legalDocumentsFile) formData.append('legalDocumentsFile', legalDocumentsFile);

      await axios.post(`${API_BASE}/body-releases`, formData);

      alert('Body released successfully');
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error releasing body:', error);
      alert(`Error: ${error.response?.data?.message || 'Error releasing body'}`);
    } finally {
      setLoading(false);
    }
  };

  const getBillStatus = (bodyId) => {
    const bill = bills.find(b => b.bodyId === bodyId);
    return bill?.status || 'No Bill';
  };

  const releaseFromCabin = async (body) => {
    if (!confirm(`Are you sure you want to release ${body.patientName || 'this body'} from the cabin?\n\nAfter cabin release, billing will be generated.`)) return;

    setLoading(true);
    try {
      const allocationId = body.allocation?.id;
      const allocationStatus = body.allocation?.status;

      if (!allocationId) {
        alert('No cabin allocation found for this body.');
        setLoading(false);
        return;
      }

      if (allocationStatus !== 'Allocated') {
        alert(`This body is not currently allocated to a cabin. Status: ${allocationStatus}`);
        setLoading(false);
        return;
      }

      // Release from cabin
      const response = await axios.put(`${API_BASE}/cabin-allocations/${allocationId}/release`);
      alert('Body released from cabin successfully. Please proceed to billing.');
      fetchData();
    } catch (error) {
      console.error('Error releasing from cabin:', error);
      console.error('Error details:', error.response?.data);
      alert(`Error: ${error.response?.data?.error || error.message || 'Error releasing from cabin'}`);
    } finally {
      setLoading(false);
    }
  };



  // Filter bodies
  const filteredBodies = bodies.filter(body =>
    !searchQuery ||
    body.bodyNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    body.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(body =>
    !filterType || body.bodyType === filterType
  );

  // Separate allocated and ready for release bodies
  const allocatedBodies = filteredBodies.filter(b => b.status === 'Allocated');
  const readyForReleaseBodies = filteredBodies.filter(b => b.status === 'Ready for Release');

  // Calculate amount based on daily billing
  const calculateAmount = (allocation) => {
    if (!allocation) return 0;

    const admissionDate = new Date(allocation.admissionDateTime);
    const releaseDate = new Date(allocation.releaseDateTime);
    const diffMs = releaseDate - admissionDate;
    // const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const days = diffMs;
    console.log(days)
    // hourlyRate column stores daily_rate
    const dailyRate = Number(allocation.hourlyRate) || 500;
    const totalAmount = days * dailyRate;
    const advance = Number(allocation.advanceAmount) || 0;
    return Math.max(0, totalAmount - advance);
  };

  const updateReleaseTime = async (allocationId, newDateTime) => {
    try {
      await axios.put(`${API_BASE}/cabin-allocations/${allocationId}/extend`, {
        expectedReleaseDateTime: newDateTime
      });

      alert('Release time updated successfully');
      fetchData();
    } catch (error) {
      console.error('Error updating release time:', error);
      alert('Failed to update release time');
    }
  };
  //change date to iso date 
  const parseCustomDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;

    // Case 1: Already ISO format (best case)
    if (dateStr.includes("T")) {
      return new Date(dateStr);
    }

    // Case 2: "25 Apr 2026, 04:51 pm"
    if (dateStr.includes(",")) {
      const parts = dateStr.split(", ");
      if (parts.length < 2) return null;

      const [datePart, timePart] = parts;
      const [day, monthStr, year] = datePart.split(" ");

      const months = {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04",
        May: "05", Jun: "06", Jul: "07", Aug: "08",
        Sep: "09", Oct: "10", Nov: "11", Dec: "12"
      };

      if (!months[monthStr]) return null;

      let [time, modifier] = timePart.split(" ");
      let [hours, minutes] = time.split(":");

      hours = parseInt(hours);

      if (modifier?.toLowerCase() === "pm" && hours !== 12) hours += 12;
      if (modifier?.toLowerCase() === "am" && hours === 12) hours = 0;

      const formatted = `${year}-${months[monthStr]}-${day.padStart(2, "0")}T${String(hours).padStart(2, "0")}:${minutes}:00`;

      return new Date(formatted);
    }

    // Case 3: "26 Apr 2026" (no time → assume 00:00)
    const parts = dateStr.split(" ");
    if (parts.length === 3) {
      const [day, monthStr, year] = parts;

      const months = {
        Jan: "01", Feb: "02", Mar: "03", Apr: "04",
        May: "05", Jun: "06", Jul: "07", Aug: "08",
        Sep: "09", Oct: "10", Nov: "11", Dec: "12"
      };

      if (!months[monthStr]) return null;

      return new Date(`${year}-${months[monthStr]}-${day.padStart(2, "0")}T00:00:00`);
    }

    return null;
  };
  // Format duration in human-readable format
  const formatDuration = (startTime, endTime) => {
    if (!startTime) return '-';

    const start = parseCustomDate(startTime);
    const end = endTime ? parseCustomDate(endTime) : new Date();

    if (!start || !end) return 'Invalid date';

    const diffMs = end - start;

    if (diffMs < 0) return 'Invalid duration';

    const totalMinutes = Math.floor(diffMs / (1000 * 60));

    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    const parts = [];

    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} min`);

    return parts.length > 0 ? parts.join(', ') : '0 min';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Body Release</h1>
        <p className="text-gray-500">Manage body release from cabin and final release</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /> */}
              <input
                type="text"
                placeholder="Search by name or body number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Types</option>
            <option value="MLC">MLC</option>
            <option value="Non-MLC">Non-MLC</option>
          </select>
        </div>
      </div>

      {/* Bodies In Cabin - Need Cabin Release */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-blue-50">
          <h2 className="text-lg font-semibold text-gray-800">All Bodies</h2>
          <p className="text-sm text-gray-500">Manage cabin + final release in one place</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Body No</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Cabin</th>
                <th className="px-4 py-3">Allocation Date/Time</th>
                <th className="px-4 py-3">Release Date/Time</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBodies.map((body) => {
                const bill = bills.find(b => b.bodyId === body.id);

                return (
                  <tr key={body.id} className="table-row">
                    <td className="px-4 py-3 text-blue-600 font-medium">
                      {body.bodyNumber}
                    </td>

                    <td className="px-4 py-3">
                      {body.patientName || 'N/A'}
                    </td>

                    <td className="px-4 py-3">
                      {body.bodyType}
                    </td>

                    <td className="px-4 py-3">
                      {body.allocation?.cabinNumber || '-'}
                    </td>

                    {/* Allocation Time */}
                    <td className="px-4 py-3 text-sm">
                      {body.allocation?.admissionDateTime
                        ? new Date(body.allocation.admissionDateTime).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })
                        : '-'}
                    </td>

                    {/* Release Date (simplified display, no longer editable) */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {body.allocation?.estimatedReleaseDateTime
                          ? new Date(body.allocation.estimatedReleaseDateTime).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })
                          : '-'}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3 text-sm">
                      {body.allocation
                        ? <span className="text-orange-600 font-medium">{formatDuration(body.allocation.admissionDateTime, body.allocation.releaseDateTime)}</span>
                        : '-'}
                    </td>

                    {/* Auto-Calculated Amount */}
                    <td className="px-4 py-3">
                      {body.allocation ? (
                        <span className="text-sm font-medium text-green-600">
                          ₹{calculateAmount(body.allocation).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      {body.status}
                    </td>

                    {/* Actions — always visible when body is Allocated */}
                    <td className="px-4 py-3 flex gap-2">
                      {body.status === 'Allocated' && body.allocation && (
                        <>
                          {(body.billing_status === 'PENDING' || body.billing_status === 'GENERATED') && (
                            <button
                              onClick={() => window.location.href = `/dashboard/billing?bodyId=${body.id}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                            >
                              {body.billing_status === 'PENDING' ? 'Go to Billing' : 'Settle Bill'}
                            </button>
                          )}
                          {body.billing_status === 'SETTLED' && (
                            <span className="text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2 py-1 rounded">
                              Bill Settled
                            </span>
                          )}
                        </>
                      )}

                      {body.status === 'Ready for Release' && (
                        <button
                          onClick={() => openReleaseModal(body)}
                          className="btn-primary px-3 py-1 rounded text-sm font-medium"
                        >
                          Final Release
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Release Modal */}
      {showModal && selectedBody && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-800">Body Release Form</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitRelease} className="p-6 space-y-6">
              {/* Body Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Body Number</p>
                    <p className="font-medium text-blue-600">{selectedBody.bodyNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Patient Name</p>
                    <p className="font-medium text-gray-800">{selectedBody.patientName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <span className={`status-badge ${selectedBody.bodyType === 'MLC' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {selectedBody.bodyType}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bill Status</p>
                    <span className="status-badge status-available">Settled</span>
                  </div>
                </div>
              </div>

              {/* Release Type Indicator */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Release Type:</strong> {selectedBody.bodyType === 'MLC' ? 'MLC Case Release (Police NOC Required)' : 'Non-MLC Case Release'}
                </p>
              </div>

              {/* Release Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">Release Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body Taken By *</label>
                    <input
                      type="text"
                      name="takenBy"
                      value={releaseData.takenBy}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <input
                      type="text"
                      name="relationship"
                      value={releaseData.relationship}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address/Locality</label>
                    <input
                      type="text"
                      name="address"
                      value={releaseData.address}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="text"
                      name="contactNumber"
                      value={releaseData.contactNumber}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* MLC Specific Fields */}
              {selectedBody.bodyType === 'MLC' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">MLC Details (Police Information)</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Police Station Name *</label>
                      <input
                        type="text"
                        name="policeStation"
                        value={releaseData.policeStation}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SI Name</label>
                      <input
                        type="text"
                        name="siName"
                        value={releaseData.siName}
                        onChange={handleInputChange}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Document Upload */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Upload size={16} />
                  Document Upload
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NOC/PCC Certificate</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <FileText className="mx-auto text-gray-400 mb-2" size={24} />
                      <p className="text-sm text-gray-500">Upload NOC/PCC</p>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                        onChange={e => setNocFile(e.target.files?.[0] || null)}
                        className="mt-2 text-sm text-gray-500 w-full"
                      />
                      {nocFile && <p className="mt-2 text-xs text-green-700">Selected: {nocFile.name}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Legal Documents</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <FileText className="mx-auto text-gray-400 mb-2" size={24} />
                      <p className="text-sm text-gray-500">Upload Legal Docs</p>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                        onChange={e => setLegalDocumentsFile(e.target.files?.[0] || null)}
                        className="mt-2 text-sm text-gray-500 w-full"
                      />
                      {legalDocumentsFile && <p className="mt-2 text-xs text-green-700">Selected: {legalDocumentsFile.name}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature Capture Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Signature Capture</h3>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    onClick={() => alert('Signature pad would open here')}
                  >
                    <Printer size={14} />
                    Capture Signature
                  </button>
                </div>
                <div className="border-2 border-gray-300 rounded-lg h-32 flex items-center justify-center bg-white">
                  <p className="text-gray-400 text-sm">Signature will appear here</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  {loading ? 'Releasing...' : 'Release Body'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BodyRelease;
