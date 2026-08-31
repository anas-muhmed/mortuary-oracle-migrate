import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, UserPlus, Save, X, Eye, Edit2, FileText, Link2, Check, Trash2, Upload, AlertTriangle, ShieldAlert, Printer } from 'lucide-react';
import MLCRegistrationPrint from './MLCRegistrationPrint';

const API_BASE = '/api';

// Dummy patient data for hospital number lookup
const dummyPatients = [
  { hospitalNumber: 'HOS-001', patientName: 'John Mathew', gender: 'Male', age: 65, locality: 'Kolenchery, Ernakulam', dateOfDeath: '2026-04-08', timeOfDeath: '09:30', reasonOfDeath: 'Cardiac Arrest', bodyType: 'Non-MLC', declaredBy: 'Dr. Joseph KP' },
  { hospitalNumber: 'HOS-002', patientName: 'Mary Sebastian', gender: 'Female', age: 72, locality: 'Muvattupuzha, Ernakulam', dateOfDeath: '2026-04-08', timeOfDeath: '14:15', reasonOfDeath: 'Respiratory Failure', bodyType: 'MLC', declaredBy: 'Dr. Thomas Varghese' },
  { hospitalNumber: 'HOS-003', patientName: 'Abraham Joseph', gender: 'Male', age: 45, locality: 'Kottayam, Kottayam', dateOfDeath: '2026-04-07', timeOfDeath: '22:45', reasonOfDeath: 'Road Traffic Accident', bodyType: 'MLC', declaredBy: 'Dr. Paulose Mathew' },
  { hospitalNumber: 'HOS-004', patientName: 'Sarah Abraham', gender: 'Female', age: 58, locality: 'Tripunithura, Ernakulam', dateOfDeath: '2026-04-07', timeOfDeath: '18:30', reasonOfDeath: 'Stroke', bodyType: 'Non-MLC', declaredBy: 'Dr. James Wilson' },
  { hospitalNumber: 'HOS-005', patientName: 'George Thomas', gender: 'Male', age: 78, locality: 'Aluva, Ernakulam', dateOfDeath: '2026-04-06', timeOfDeath: '05:20', reasonOfDeath: 'Multiple Organ Failure', bodyType: 'Non-MLC', declaredBy: 'Dr. Sunny George' },
  { hospitalNumber: 'HOS-006', patientName: 'Annie Varghese', gender: 'Female', age: 34, locality: 'Perumbavoor, Ernakulam', dateOfDeath: '2026-04-06', timeOfDeath: '11:00', reasonOfDeath: 'Dengue Fever', bodyType: 'Non-MLC', declaredBy: 'Dr. Mary Francis' },
  { hospitalNumber: 'HOS-007', patientName: 'Rajan Pillai', gender: 'Male', age: 52, locality: 'Angamaly, Ernakulam', dateOfDeath: '2026-04-05', timeOfDeath: '20:30', reasonOfDeath: 'Heart Attack', bodyType: 'MLC', declaredBy: 'Dr. Biju Sebastian' },
  { hospitalNumber: 'HOS-008', patientName: 'Lakshmi Menon', gender: 'Female', age: 68, locality: 'Kochi, Ernakulam', dateOfDeath: '2026-04-05', timeOfDeath: '16:45', reasonOfDeath: 'Cancer', bodyType: 'Non-MLC', declaredBy: 'Dr. Rajesh Kumar' },
  { hospitalNumber: 'HOS-009', patientName: 'Devassy Mathew', gender: 'Male', age: 41, locality: 'Moovattupuzha, Ernakulam', dateOfDeath: '2026-04-04', timeOfDeath: '08:15', reasonOfDeath: 'Kidney Failure', bodyType: 'Non-MLC', declaredBy: 'Dr. Suresh Nair' },
  { hospitalNumber: 'HOS-010', patientName: 'Philomena D Cruz', gender: 'Female', age: 82, locality: 'Piravom, Ernakulam', dateOfDeath: '2026-04-03', timeOfDeath: '13:00', reasonOfDeath: 'Septicemia', bodyType: 'MLC', declaredBy: 'Dr. Antony Joseph' },
  { hospitalNumber: 'HOS-011', patientName: 'Kurian Joseph', gender: 'Male', age: 29, locality: 'Kolenchery, Ernakulam', dateOfDeath: '2026-04-03', timeOfDeath: '03:30', reasonOfDeath: 'Drowning', bodyType: 'MLC', declaredBy: 'Dr. Ramesh Kumar' },
  { hospitalNumber: 'HOS-012', patientName: 'Mercy Thomas', gender: 'Female', age: 55, locality: 'Kottayam, Kottayam', dateOfDeath: '2026-04-02', timeOfDeath: '19:00', reasonOfDeath: 'Liver Cirrhosis', bodyType: 'Non-MLC', declaredBy: 'Dr. Gopalakrishnan' },
];

function BodyRegistration() {
  const [bodies, setBodies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('form'); // 'form' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedBody, setSelectedBody] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [mlcPrintBodyId, setMlcPrintBodyId] = useState(null);

  // Hospital number search
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [showHospitalSuggestions, setShowHospitalSuggestions] = useState(false);
  const [hospitalSuggestions, setHospitalSuggestions] = useState([]);
  const [linkedPatient, setLinkedPatient] = useState(null);

  const [formData, setFormData] = useState({
    bodyType: 'Non-MLC',
    hospitalNumber: '',
    patientName: '',
    gender: '',
    age: '',
    locality: '',
    dateOfDeath: '',
    timeOfDeath: '',
    declaredBy: '',
    reasonOfDeath: '',
    deathIntimationNo: '',
    mlcNo: '',
    estimatedDaysOfStay: '',
    witness1Name: '',
    witness1Address: '',
    witness1Contact: '',
    witness2Name: '',
    witness2Address: '',
    witness2Contact: '',
    // MLC-specific fields
    policeStationName: '',
    stationSiName: '',
    presentPoliceOfficerName: '',
    nocCertificateUrl: '',
    freezerRequired: true
  });

  const [nocFile, setNocFile] = useState(null);
  const [nocUploading, setNocUploading] = useState(false);
  const nocInputRef = useRef(null);

  // ---------- Time picker state ----------
  const parseTimeOfDeath = (val) => {
    if (!val) return { hour: '12', minute: '00', ampm: 'AM' };
    // Accept "HH:MM AM/PM" format
    const ampmMatch = val.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (ampmMatch) return { hour: String(parseInt(ampmMatch[1])), minute: ampmMatch[2], ampm: ampmMatch[3].toUpperCase() };
    // Accept 24h "HH:MM"
    const plainMatch = val.match(/(\d{1,2}):(\d{2})/);
    if (plainMatch) {
      let h = parseInt(plainMatch[1]);
      const m = plainMatch[2];
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return { hour: String(h), minute: m, ampm };
    }
    return { hour: '12', minute: '00', ampm: 'AM' };
  };

  const buildTimeString = (hour, minute, ampm) =>
    `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;

  // Parse Oracle timestamp (e.g. "26-AUG-26 05.30.00.000000000 AM") or any date into YYYY-MM-DD
  const parseOracleDate = (val) => {
    if (!val) return '';
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // ISO with T
    if (val.includes('T')) return val.split('T')[0];
    // Oracle format: "26-AUG-26 ..."
    const oracleMatch = val.match(/^(\d{1,2})-([A-Z]{3})-(\d{2,4})/i);
    if (oracleMatch) {
      const months = {
        JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
        JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12'
      };
      const day = String(oracleMatch[1]).padStart(2, '0');
      const mon = months[oracleMatch[2].toUpperCase()] || '01';
      let yr = oracleMatch[3];
      if (yr.length === 2) yr = (parseInt(yr) < 50 ? '20' : '19') + yr;
      return `${yr}-${mon}-${day}`;
    }
    // Fallback: try native Date parse
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch (_) { }
    return '';
  };

  useEffect(() => {
    fetchBodies();

    // Check if redirected from Patient List with data
    const pendingData = localStorage.getItem('pendingBodyRegistration');
    if (pendingData) {
      const patient = JSON.parse(pendingData);
      localStorage.removeItem('pendingBodyRegistration');

      // Auto-fill form with patient data
      const newFormData = {
        bodyType: patient.bodyType || 'Non-MLC',
        hospitalNumber: patient.hospitalNumber || '',
        patientName: patient.patientName || '',
        gender: patient.gender || '',
        age: patient.age || '',
        locality: patient.locality || '',
        dateOfDeath: patient.dateOfDeath || '',
        timeOfDeath: patient.timeOfDeath || '',
        declaredBy: patient.declaredBy || '',
        reasonOfDeath: patient.reasonOfDeath || '',
        deathIntimationNo: '',
        mlcNo: '',
        estimatedDaysOfStay: '',
        witness1Name: '',
        witness1Address: '',
        witness1Contact: '',
        witness2Name: '',
        witness2Address: '',
        witness2Contact: '',
        policeStationName: '',
        stationSiName: '',
        presentPoliceOfficerName: '',
        nocCertificateUrl: '',
        freezerRequired: true
      };
      setFormData(newFormData);
      setLinkedPatient(patient);
      setHospitalSearch(patient.hospitalNumber || '');
      setShowForm(true);
      setViewMode('form');
    }
  }, []);

  // Hospital number autocomplete handlers
  const handleHospitalSearch = (e) => {
    const value = e.target.value;
    setHospitalSearch(value);
    setFormData({ ...formData, hospitalNumber: value });

    if (value.length > 0) {
      const filtered = dummyPatients.filter(p =>
        p.hospitalNumber.toLowerCase().includes(value.toLowerCase()) ||
        p.patientName.toLowerCase().includes(value.toLowerCase())
      );
      setHospitalSuggestions(filtered);
      setShowHospitalSuggestions(true);
    } else {
      setHospitalSuggestions([]);
      setShowHospitalSuggestions(false);
    }
  };

  const selectHospitalSuggestion = (patient) => {
    setFormData({
      ...formData,
      hospitalNumber: patient.hospitalNumber,
      patientName: patient.patientName,
      gender: patient.gender,
      age: patient.age,
      locality: patient.locality,
      dateOfDeath: patient.dateOfDeath,
      timeOfDeath: patient.timeOfDeath,
      declaredBy: patient.declaredBy,
      reasonOfDeath: patient.reasonOfDeath,
      bodyType: patient.bodyType
    });
    setLinkedPatient(patient);
    setHospitalSearch(patient.hospitalNumber);
    setShowHospitalSuggestions(false);
  };

  const clearHospitalLink = () => {
    setLinkedPatient(null);
    setHospitalSearch('');
    setFormData({
      ...formData,
      hospitalNumber: '',
      patientName: '',
      gender: '',
      age: '',
      locality: '',
      dateOfDeath: '',
      timeOfDeath: '',
      declaredBy: '',
      reasonOfDeath: '',
      bodyType: 'Non-MLC'
    });
  };

  const fetchBodies = async () => {
    try {
      const url = filterType
        ? `${API_BASE}/bodies?bodyType=${filterType}`
        : `${API_BASE}/bodies`;
      const response = await axios.get(url);
      setBodies(response.data);
    } catch (error) {
      console.error('Error fetching bodies:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleNocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, or PDF files are allowed for NOC upload.');
      return;
    }

    setNocFile(file);
    setNocUploading(true);
    try {
      const fd = new FormData();
      fd.append('noc', file);
      const response = await axios.post('/api/upload/noc', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, nocCertificateUrl: response.data.url }));
    } catch (err) {
      alert('Failed to upload NOC file: ' + (err.response?.data?.error || err.message));
      setNocFile(null);
    } finally {
      setNocUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // MLC validation
    if (formData.bodyType === 'MLC') {
      if (!formData.policeStationName?.trim()) {
        alert('Police Station Name is mandatory for MLC cases.');
        return;
      }
      if (!formData.stationSiName?.trim()) {
        alert('SI Name is mandatory for MLC cases.');
        return;
      }
      if (!formData.presentPoliceOfficerName?.trim()) {
        alert('Present Police Officer Name is mandatory for MLC cases.');
        return;
      }
    }

    setLoading(true);

    try {
      // Prepare data - convert age to number
      const submitData = {
        ...formData,
        dateOfDeath: parseOracleDate(formData.dateOfDeath) || formData.dateOfDeath || null,
        age: formData.age ? parseInt(formData.age) : null,
        freezerRequired: formData.bodyType === 'MLC' ? formData.freezerRequired : null
      };

      console.log('Submitting body registration with data:', submitData);

      let response;
      if (selectedBody && selectedBody.id) {
        // Update existing body
        response = await axios.put(`${API_BASE}/bodies/${selectedBody.id}`, submitData);
        console.log('Update successful:', response.data);
        alert(`Body "${response.data.bodyNumber}" updated successfully!`);
      } else {
        // Create new body
        response = await axios.post(`${API_BASE}/bodies`, submitData);
        console.log('Registration successful:', response.data);
        alert(`Body registered successfully!\nBody Number: ${response.data.bodyNumber}`);
      }

      resetForm();
      setSelectedBody(null);
      fetchBodies();
      setViewMode('list');
    } catch (error) {
      console.error('Error saving body:', error);
      console.log('Error response:', error.response);
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Error saving body';
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bodyType: 'Non-MLC',
      hospitalNumber: '',
      patientName: '',
      gender: '',
      age: '',
      locality: '',
      dateOfDeath: '',
      timeOfDeath: '',
      declaredBy: '',
      reasonOfDeath: '',
      deathIntimationNo: '',
      mlcNo: '',
      estimatedDaysOfStay: '',
      witness1Name: '',
      witness1Address: '',
      witness1Contact: '',
      witness2Name: '',
      witness2Address: '',
      witness2Contact: '',
      policeStationName: '',
      stationSiName: '',
      presentPoliceOfficerName: '',
      nocCertificateUrl: '',
      freezerRequired: true
    });
    setLinkedPatient(null);
    setHospitalSearch('');
    setShowHospitalSuggestions(false);
    setNocFile(null);
  };

  const viewBody = async (id) => {
    try {
      const response = await axios.get(`${API_BASE}/bodies/${id}`);
      setSelectedBody(response.data);
      setIsViewMode(true);
    } catch (error) {
      console.error('Error fetching body:', error);
    }
  };

  const editBody = async (id) => {
    try {
      const response = await axios.get(`${API_BASE}/bodies/${id}`);
      const body = response.data;

      // Set form data for editing
      setFormData({
        bodyType: body.bodyType || 'Non-MLC',
        hospitalNumber: body.hospitalNumber || '',
        patientName: body.patientName || '',
        gender: body.gender || '',
        age: body.age || '',
        locality: body.locality || '',
        dateOfDeath: parseOracleDate(body.dateOfDeath),
        timeOfDeath: body.timeOfDeath || '',
        declaredBy: body.declaredBy || '',
        reasonOfDeath: body.reasonOfDeath || '',
        deathIntimationNo: body.deathIntimationNo || '',
        mlcNo: body.mlcNo || '',
        estimatedDaysOfStay: body.estimatedDaysOfStay || '',
        witness1Name: body.witness1Name || '',
        witness1Address: body.witness1Address || '',
        witness1Contact: body.witness1Contact || '',
        witness2Name: body.witness2Name || '',
        witness2Address: body.witness2Address || '',
        witness2Contact: body.witness2Contact || '',
        policeStationName: body.policeStationName || '',
        stationSiName: body.stationSiName || '',
        presentPoliceOfficerName: body.presentPoliceOfficerName || '',
        nocCertificateUrl: body.nocCertificateUrl || '',
        freezerRequired: body.freezerRequired !== 0
      });
      setNocFile(null);
      setSelectedBody(body);
      setLinkedPatient(null);
      setHospitalSearch(body.hospitalNumber || '');
      setShowForm(true);
      setViewMode('form');
      setIsViewMode(false);
    } catch (error) {
      console.error('Error fetching body for edit:', error);
      alert('Error loading body data for editing');
    }
  };

  const deleteBody = async (id, bodyNumber) => {
    if (!confirm(`Are you sure you want to delete body "${bodyNumber}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/bodies/${id}`);
      alert(`Body "${bodyNumber}" deleted successfully`);
      fetchBodies();
    } catch (error) {
      console.error('Error deleting body:', error);
      alert(`Error: ${error.response?.data?.message || 'Error deleting body'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredBodies = bodies.filter(body => {
    const matchQuery = !searchQuery ||
      body.bodyNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      body.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      body.hospitalNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = !filterType || body.bodyType === filterType;
    return matchQuery && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Body Registration</h1>
          <p className="text-gray-500">Register bodies with or without hospital number</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setViewMode('list'); fetchBodies(); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            View List
          </button>
          <button
            onClick={() => { setViewMode('form'); setShowForm(true); setIsViewMode(false); resetForm(); }}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus size={18} />
            Register New Body
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Filters */}
          <div className="card p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /> */}
                  <input
                    type="text"
                    placeholder="Search by name, body number, or hospital number..."
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

          {/* Bodies Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-3 text-left">Body Number</th>
                    <th className="px-6 py-3 text-left">Patient Name</th>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-left">Age/Gender</th>
                    <th className="px-6 py-3 text-left">Date of Death</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBodies.length > 0 ? (
                    filteredBodies.map((body) => (
                      <tr key={body.id} className="table-row">
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">{body.bodyNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{body.patientName || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`status-badge ${body.bodyType === 'MLC' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {body.bodyType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {body.age || '-'} / {body.gender || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {body.dateOfDeath ? parseOracleDate(body.dateOfDeath)
                            ? new Date(parseOracleDate(body.dateOfDeath)).toLocaleDateString('en-IN')
                            : body.dateOfDeath
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`status-badge ${body.status === 'Released' ? 'status-available' :
                            body.status === 'Allocated' ? 'status-occupied' :
                              body.status === 'Ready for Release' ? 'bg-purple-100 text-purple-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                            {body.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => viewBody(body.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => editBody(body.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            {body.bodyType === 'MLC' && (
                              <button
                                onClick={() => setMlcPrintBodyId(body.id)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Print MLC Registration"
                              >
                                <Printer size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => deleteBody(body.id, body.bodyNumber)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        No bodies found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {showForm && !isViewMode && (
            <div className="card">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedBody && selectedBody.id ? 'Edit Body Registration' : 'Body Registration Form'}
                </h2>
                <button
                  onClick={() => { setShowForm(false); resetForm(); setSelectedBody(null); }}
                  className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Body Type Selection */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Body Type *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bodyType"
                        value="MLC"
                        checked={formData.bodyType === 'MLC'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">MLC (Medico-Legal Case)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="bodyType"
                        value="Non-MLC"
                        checked={formData.bodyType === 'Non-MLC'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">Non-MLC</span>
                    </label>
                  </div>
                </div>

                {/* MLC-Specific Fields */}
                {formData.bodyType === 'MLC' && (
                  <div className="border-2 border-red-200 bg-red-50 rounded-lg p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert size={20} className="text-red-600" />
                      <h3 className="text-base font-semibold text-red-700">MLC Details (Mandatory)</h3>
                    </div>

                    {/* Freezer Required Toggle */}
                    <div className="bg-white border border-red-200 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Freezer / Mortuary Stay Required?</label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="freezerRequired"
                            checked={formData.freezerRequired === true}
                            onChange={() => setFormData(prev => ({ ...prev, freezerRequired: true }))}
                            className="w-4 h-4 text-red-600"
                          />
                          <span className="text-sm font-medium text-gray-700">Yes — Body needs to be kept in mortuary/freezer</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="freezerRequired"
                            checked={formData.freezerRequired === false}
                            onChange={() => setFormData(prev => ({ ...prev, freezerRequired: false }))}
                            className="w-4 h-4 text-red-600"
                          />
                          <span className="text-sm font-medium text-gray-700">No — Body does not need mortuary stay</span>
                        </label>
                      </div>
                      {formData.freezerRequired === false && (
                        <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-700">
                            <strong>Note:</strong> Cabin allocation, billing, and body release workflows will <strong>not</strong> be initiated for this case.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Police Station Name *</label>
                        <input
                          type="text"
                          name="policeStationName"
                          value={formData.policeStationName}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="e.g. Kolenchery Police Station"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SI Name *</label>
                        <input
                          type="text"
                          name="stationSiName"
                          value={formData.stationSiName}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="Sub-Inspector Name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Present Police Officer Name *</label>
                        <input
                          type="text"
                          name="presentPoliceOfficerName"
                          value={formData.presentPoliceOfficerName}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="Officer Name"
                          required
                        />
                      </div>
                    </div>

                    {/* NOC Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">NOC Certificate (JPG / PNG / PDF)</label>
                      <div
                        className="border-2 border-dashed border-red-300 rounded-lg p-4 text-center cursor-pointer hover:border-red-400 hover:bg-red-50 transition-colors"
                        onClick={() => nocInputRef.current?.click()}
                      >
                        <input
                          ref={nocInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          onChange={handleNocUpload}
                        />
                        {nocUploading ? (
                          <p className="text-sm text-red-600">Uploading...</p>
                        ) : formData.nocCertificateUrl ? (
                          <div className="flex items-center justify-center gap-2">
                            <Check size={16} className="text-green-600" />
                            <span className="text-sm text-green-700 font-medium">NOC Uploaded</span>
                            {nocFile && <span className="text-xs text-gray-500">({nocFile.name})</span>}
                          </div>
                        ) : (
                          <div>
                            <Upload size={24} className="mx-auto text-red-400 mb-1" />
                            <p className="text-sm text-gray-500">Click to upload NOC certificate</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG, or PDF • Max 10MB</p>
                          </div>
                        )}
                      </div>
                      {formData.nocCertificateUrl && (
                        <div className="flex items-center justify-between mt-2">
                          <a
                            href={formData.nocCertificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View Uploaded NOC
                          </a>
                          <button
                            type="button"
                            onClick={() => { setFormData(prev => ({ ...prev, nocCertificateUrl: '' })); setNocFile(null); }}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MLC Number and Death Intimation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.bodyType === 'MLC' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">MLC Number *</label>
                      <input
                        type="text"
                        name="mlcNo"
                        value={formData.mlcNo}
                        onChange={handleInputChange}
                        className="input-field"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Death Intimation No</label>
                    <input
                      type="text"
                      name="deathIntimationNo"
                      value={formData.deathIntimationNo}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Hospital Number with Autocomplete */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Hospital Number (Auto-fill)</label>
                    {linkedPatient && (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        <Check size={12} />
                        Patient Linked
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={hospitalSearch}
                        onChange={handleHospitalSearch}
                        onFocus={() => hospitalSearch && setShowHospitalSuggestions(true)}
                        className="input-field flex-1"
                        placeholder="Search by hospital number or patient name..."
                      />
                      {linkedPatient && (
                        <button
                          type="button"
                          onClick={clearHospitalLink}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Clear Link"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>

                    {/* Autocomplete Suggestions */}
                    {showHospitalSuggestions && hospitalSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {hospitalSuggestions.map((patient, index) => (
                          <div
                            key={index}
                            onClick={() => selectHospitalSuggestion(patient)}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-800">{patient.patientName}</p>
                                <p className="text-sm text-gray-500">{patient.hospitalNumber}</p>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs ${patient.bodyType === 'MLC' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {patient.bodyType}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {patient.age} years, {patient.gender} • {patient.reasonOfDeath}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {!linkedPatient && (
                    <p className="text-xs text-gray-500 mt-1">
                      Start typing to search for a patient by hospital number or name
                    </p>
                  )}
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                    <input
                      type="text"
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                </div>

                {/* Location & Death Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Locality/Address</label>
                    <input
                      type="text"
                      name="locality"
                      value={formData.locality}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death</label>
                    <input
                      type="date"
                      name="dateOfDeath"
                      value={formData.dateOfDeath}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time of Death</label>
                    {/* ---- AM/PM Time Picker ---- */}
                    {(() => {
                      const { hour, minute, ampm } = parseTimeOfDeath(formData.timeOfDeath);
                      const setTime = (h, m, a) =>
                        setFormData(prev => ({ ...prev, timeOfDeath: buildTimeString(h, m, a) }));
                      return (
                        <div className="flex gap-1 items-center flex-wrap">
                          {/* Hour */}
                          <select
                            value={hour}
                            onChange={e => setTime(e.target.value, minute, ampm)}
                            style={{ width: '60px', padding: '5px 4px', fontSize: '13px' }}
                            className="border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                              <option key={h} value={String(h)}>{String(h).padStart(2, '0')}</option>
                            ))}
                          </select>
                          <span className="text-gray-500 font-bold text-sm">:</span>
                          {/* Minute */}
                          <select
                            value={minute}
                            onChange={e => setTime(hour, e.target.value, ampm)}
                            style={{ width: '60px', padding: '5px 4px', fontSize: '13px' }}
                            className="border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          >
                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          {/* AM / PM toggle */}
                          <div className="flex rounded-lg overflow-hidden border border-gray-300">
                            {['AM', 'PM'].map(period => (
                              <button
                                key={period}
                                type="button"
                                onClick={() => setTime(hour, minute, period)}
                                style={{ padding: '5px 8px', fontSize: '12px' }}
                                className={`font-semibold transition-colors ${ampm === period
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-gray-600 hover:bg-gray-50'
                                  }`}
                              >
                                {period}
                              </button>
                            ))}
                          </div>
                          {/* Live preview */}
                          {formData.timeOfDeath && (
                            <span style={{ fontSize: '12px' }} className="font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg whitespace-nowrap">
                              {formData.timeOfDeath}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Declared By</label>
                    <input
                      type="text"
                      name="declaredBy"
                      value={formData.declaredBy}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason of Death</label>
                    <input
                      type="text"
                      name="reasonOfDeath"
                      value={formData.reasonOfDeath}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Estimated Days of Stay */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Days of Stay *</label>
                  <input
                    type="number"
                    name="estimatedDaysOfStay"
                    value={formData.estimatedDaysOfStay}
                    onChange={handleInputChange}
                    className="input-field max-w-xs"
                    min="1"
                    required
                  />
                </div>

                {/* Witnesses */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Witness Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Witness 1 */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Witness 1</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Name</label>
                          <input
                            type="text"
                            name="witness1Name"
                            value={formData.witness1Name}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Address</label>
                          <input
                            type="text"
                            name="witness1Address"
                            value={formData.witness1Address}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Contact</label>
                          <input
                            type="text"
                            name="witness1Contact"
                            value={formData.witness1Contact}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Witness 2 */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-3">Witness 2</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Name</label>
                          <input
                            type="text"
                            name="witness2Name"
                            value={formData.witness2Name}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Address</label>
                          <input
                            type="text"
                            name="witness2Address"
                            value={formData.witness2Address}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Contact</label>
                          <input
                            type="text"
                            name="witness2Contact"
                            value={formData.witness2Contact}
                            onChange={handleInputChange}
                            className="input-field"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Upload</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileText className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-500">Upload supporting documents</p>
                    <input
                      type="file"
                      multiple
                      className="mt-2 text-sm text-gray-500"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save size={18} />
                    {loading ? 'Saving...' : (selectedBody && selectedBody.id ? 'Update Body' : 'Register Body')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* View Body Modal */}
      {isViewMode && selectedBody && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-800">Body Details</h2>
              <button
                onClick={() => setIsViewMode(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Body Number</p>
                    <p className="text-xl font-bold text-blue-600">{selectedBody.bodyNumber}</p>
                  </div>
                  <span className={`status-badge ${selectedBody.bodyType === 'MLC' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedBody.bodyType}
                  </span>
                </div>
              </div>

              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Patient Name</p>
                    <p className="font-medium text-gray-800">{selectedBody.patientName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hospital Number</p>
                    <p className="font-medium text-gray-800">{selectedBody.hospitalNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age/Gender</p>
                    <p className="font-medium text-gray-800">{selectedBody.age || '-'} / {selectedBody.gender || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Locality</p>
                    <p className="font-medium text-gray-800">{selectedBody.locality || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Death Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Death Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date of Death</p>
                    <p className="font-medium text-gray-800">
                      {selectedBody.dateOfDeath
                        ? (() => {
                            const d = parseOracleDate(selectedBody.dateOfDeath);
                            return d ? new Date(d).toLocaleDateString('en-IN') : selectedBody.dateOfDeath;
                          })()
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time of Death</p>
                    <p className="font-medium text-gray-800">{selectedBody.timeOfDeath || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Declared By</p>
                    <p className="font-medium text-gray-800">{selectedBody.declaredBy || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reason of Death</p>
                    <p className="font-medium text-gray-800 break-words whitespace-pre-wrap">{selectedBody.reasonOfDeath || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">MLC Number</p>
                    <p className="font-medium text-gray-800">{selectedBody.mlcNo || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Death Intimation No</p>
                    <p className="font-medium text-gray-800">{selectedBody.deathIntimationNo || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* MLC Information */}
              {selectedBody.bodyType === 'MLC' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <ShieldAlert size={18} className="text-red-600" />
                    MLC Information
                  </h3>
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Police Station</p>
                        <p className="font-medium text-gray-800">{selectedBody.policeStationName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">SI Name</p>
                        <p className="font-medium text-gray-800">{selectedBody.stationSiName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Present Officer</p>
                        <p className="font-medium text-gray-800">{selectedBody.presentPoliceOfficerName || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t border-red-200">
                      <div>
                        <p className="text-sm text-gray-500">Freezer / Stay Required</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${selectedBody.freezerRequired !== 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                          {selectedBody.freezerRequired !== 0 ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {selectedBody.nocCertificateUrl && (
                        <div>
                          <p className="text-sm text-gray-500">NOC Certificate</p>
                          <a
                            href={selectedBody.nocCertificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileText size={14} />
                            View NOC
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Documents — shown for all body types */}
              {selectedBody.nocCertificateUrl && selectedBody.bodyType !== 'MLC' && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FileText size={18} className="text-blue-600" />
                    Uploaded Documents
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={selectedBody.nocCertificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <FileText size={16} />
                      View Document
                    </a>
                  </div>
                </div>
              )}

              {/* Witnesses */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Witness Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Witness 1</p>
                    <p className="font-medium text-gray-800">{selectedBody.witness1Name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{selectedBody.witness1Address || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{selectedBody.witness1Contact || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Witness 2</p>
                    <p className="font-medium text-gray-800">{selectedBody.witness2Name || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{selectedBody.witness2Address || 'N/A'}</p>
                    <p className="text-sm text-gray-600">{selectedBody.witness2Contact || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Allocation Info */}
              {selectedBody.allocation && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Cabin Allocation</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Cabin Number</p>
                        <p className="font-medium text-gray-800">{selectedBody.allocation.cabinNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Admission Date/Time</p>
                        <p className="font-medium text-gray-800">{new Date(selectedBody.allocation.admissionDateTime).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MLC Registration Print Actions */}
              {selectedBody.bodyType === 'MLC' && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Printer size={18} className="text-purple-600" />
                    MLC Registration Document
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setMlcPrintBodyId(selectedBody.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                    >
                      <Printer size={16} />
                      View MLC Registration
                    </button>
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Status</h3>
                <span className={`status-badge text-lg ${selectedBody.status === 'Released' ? 'status-available' :
                  selectedBody.status === 'Allocated' ? 'status-occupied' :
                    selectedBody.status === 'Ready for Release' ? 'bg-purple-100 text-purple-700' :
                      'bg-yellow-100 text-yellow-700'
                  }`}>
                  {selectedBody.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MLC Registration Print Modal */}
      {mlcPrintBodyId && (
        <MLCRegistrationPrint
          bodyId={mlcPrintBodyId}
          onClose={() => setMlcPrintBodyId(null)}
        />
      )}
    </div>
  );
}

export default BodyRegistration;
