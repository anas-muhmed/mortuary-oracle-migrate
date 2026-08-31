import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, MapPin, Phone, Heart, ArrowRight, Filter } from 'lucide-react';

const API_BASE = '/api';

// Dummy patient data for demonstration
const dummyPatients = [
  {
    hospitalNumber: 'HOS-001',
    patientName: 'John Mathew',
    gender: 'Male',
    age: 65,
    locality: 'Kolenchery, Ernakulam',
    dateOfDeath: '2026-04-08',
    timeOfDeath: '09:30',
    reasonOfDeath: 'Cardiac Arrest',
    bodyType: 'Non-MLC',
    declaredBy: 'Dr. Joseph KP',
    department: 'Cardiology',
    ward: 'ICU',
    bedNumber: 'ICU-05'
  },
  {
    hospitalNumber: 'HOS-002',
    patientName: 'Mary Sebastian',
    gender: 'Female',
    age: 72,
    locality: 'Muvattupuzha, Ernakulam',
    dateOfDeath: '2026-04-08',
    timeOfDeath: '14:15',
    reasonOfDeath: 'Respiratory Failure',
    bodyType: 'MLC',
    declaredBy: 'Dr. Thomas Varghese',
    department: 'Pulmonology',
    ward: 'General Ward A',
    bedNumber: 'A-23'
  },
  {
    hospitalNumber: 'HOS-003',
    patientName: 'Abraham Joseph',
    gender: 'Male',
    age: 45,
    locality: 'Kottayam, Kottayam',
    dateOfDeath: '2026-04-07',
    timeOfDeath: '22:45',
    reasonOfDeath: 'Road Traffic Accident',
    bodyType: 'MLC',
    declaredBy: 'Dr. Paulose Mathew',
    department: 'Emergency',
    ward: 'Emergency Ward',
    bedNumber: 'ER-12'
  },
  {
    hospitalNumber: 'HOS-004',
    patientName: 'Sarah Abraham',
    gender: 'Female',
    age: 58,
    locality: 'Tripunithura, Ernakulam',
    dateOfDeath: '2026-04-07',
    timeOfDeath: '18:30',
    reasonOfDeath: 'Stroke',
    bodyType: 'Non-MLC',
    declaredBy: 'Dr. James Wilson',
    department: 'Neurology',
    ward: 'ICU',
    bedNumber: 'ICU-08'
  },
  {
    hospitalNumber: 'HOS-005',
    patientName: 'George Thomas',
    gender: 'Male',
    age: 78,
    locality: 'Aluva, Ernakulam',
    dateOfDeath: '2026-04-06',
    timeOfDeath: '05:20',
    reasonOfDeath: 'Multiple Organ Failure',
    bodyType: 'Non-MLC',
    declaredBy: 'Dr. Sunny George',
    department: 'General Medicine',
    ward: 'General Ward B',
    bedNumber: 'B-15'
  },
  {
    hospitalNumber: 'HOS-006',
    patientName: ' Annie Varghese',
    gender: 'Female',
    age: 34,
    locality: 'Perumbavoor, Ernakulam',
    dateOfDeath: '2026-04-06',
    timeOfDeath: '11:00',
    reasonOfDeath: 'Dengue Fever',
    bodyType: 'Non-MLC',
    declaredBy: 'Dr. Mary Francis',
    department: 'General Medicine',
    ward: 'General Ward C',
    bedNumber: 'C-07'
  },
  {
    hospitalNumber: 'HOS-007',
    patientName: 'Rajan Pillai',
    gender: 'Male',
    age: 52,
    locality: 'Angamaly, Ernakulam',
    dateOfDeath: '2026-04-05',
    timeOfDeath: '20:30',
    reasonOfDeath: 'Heart Attack',
    bodyType: 'MLC',
    declaredBy: 'Dr. Biju Sebastian',
    department: 'Cardiology',
    ward: 'CCU',
    bedNumber: 'CCU-03'
  },
  {
    hospitalNumber: 'HOS-008',
    patientName: 'Lakshmi Menon',
    gender: 'Female',
    age: 68,
    locality: 'Kochi, Ernakulam',
    dateOfDeath: '2026-04-05',
    timeOfDeath: '16:45',
    reasonOfDeath: 'Cancer',
    bodyType: 'Non-MLC',
    declaredBy: 'Dr. Rajesh Kumar',
    department: 'Oncology',
    ward: 'General Ward A',
    bedNumber: 'A-12'
  },
  {
    hospitalNumber: 'HOS-009',
    patientName: 'Devassy Mathew',
    gender: 'Male',
    age: 41,
    locality: 'Moovattupuzha, Ernakulam',
    dateOfDeath: '2026-04-04',
    timeOfDeath: '08:15',
    reasonOfDeath: 'Kidney Failure',
    bodyType: 'Non-MLC',
    declaredBy: 'Dr. Suresh Nair',
    department: 'Nephrology',
    ward: 'General Ward D',
    bedNumber: 'D-04'
  },
  {
    hospitalNumber: 'HOS-010',
    patientName: 'Philomena D Cruz',
    gender: 'Female',
    age: 82,
    locality: 'Piravom, Ernakulam',
    dateOfDeath: '2026-04-03',
    timeOfDeath: '13:00',
    reasonOfDeath: 'Septicemia',
    bodyType: 'MLC',
    declaredBy: 'Dr. Antony Joseph',
    department: 'Emergency',
    ward: 'Emergency Ward',
    bedNumber: 'ER-06'
  },
  {
    hospitalNumber: 'HOS-011',
    patientName: 'Kurian Joseph',
    gender: 'Male',
    age: 29,
    locality: 'Kolenchery, Ernakulam',
    dateOfDeath: '2026-04-03',
    timeOfDeath: '03:30',
    reasonOfDeath: 'Drowning',
    bodyType: 'MLC',
    declaredBy: 'Dr. Ramesh Kumar',
    department: 'Forensic Medicine',
    ward: 'Morgue Holding',
    bedNumber: 'MH-01'
  },
  {
    hospitalNumber: 'HOS-012',
    patientName: 'Mercy Thomas',
    gender: 'Female',
    age: 55,
    locality: 'Kottayam, Kottayam',
    dateOfDeath: '2026-04-02',
    timeOfDeath: '19:00',
    reasonOfDeath: 'Liver Cirrhosis',
    bodyType: 'Non-MLC',
    declaredBy: 'Dr. Gopalakrishnan',
    department: 'Gastroenterology',
    ward: 'General Ward B',
    bedNumber: 'B-18'
  }
];

function PatientList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recentDeaths, setRecentDeaths] = useState([]);

  useEffect(() => {
    // In a real app, this would fetch from hospital database
    // For now, we use the dummy data
  }, []);

  const filteredPatients = dummyPatients.filter(patient => {
    const matchesSearch = !searchQuery ||
      patient.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.hospitalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.reasonOfDeath.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = !filterType || patient.bodyType === filterType;

    return matchesSearch && matchesType;
  });

  const viewPatientDetails = (patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const registerAsBody = (patient) => {
    // Navigate to body registration with patient data
    // Using localStorage to pass data temporarily
    localStorage.setItem('pendingBodyRegistration', JSON.stringify(patient));
    window.location.href = '/body-registration?fromPatient=true';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Patient List</h1>
          <p className="text-gray-500">View patients and register deceased for mortuary</p>
        </div>
        <div className="flex gap-3">
          <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
            {filteredPatients.length} Patients
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, hospital number, or cause..."
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

      {/* Patient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient, index) => (
            <div key={index} className="card hover:shadow-lg transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{patient.patientName}</h3>
                      <p className="text-sm text-gray-500">{patient.hospitalNumber}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${patient.bodyType === 'MLC'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
                    {patient.bodyType}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Heart size={16} className="text-gray-400" />
                    <span>{patient.age} years / {patient.gender}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="truncate">{patient.locality}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <span>{new Date(patient.dateOfDeath).toLocaleDateString('en-IN')} at {patient.timeOfDeath}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Cause:</span> {patient.reasonOfDeath}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Department:</span> {patient.department}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => viewPatientDetails(patient)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <User size={16} />
                    View
                  </button>
                  <button
                    onClick={() => registerAsBody(patient)}
                    className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowRight size={16} />
                    Register
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="card p-8 text-center text-gray-500">
              <User size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No patients found</p>
            </div>
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-800">Patient Details</h2>
              <button
                onClick={() => setShowPatientModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">Hospital Number</p>
                    <p className="text-xl font-bold text-blue-600">{selectedPatient.hospitalNumber}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${selectedPatient.bodyType === 'MLC'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
                    {selectedPatient.bodyType}
                  </span>
                </div>
              </div>

              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Patient Name</p>
                    <p className="font-medium text-gray-800">{selectedPatient.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age / Gender</p>
                    <p className="font-medium text-gray-800">{selectedPatient.age} / {selectedPatient.gender}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Locality</p>
                    <p className="font-medium text-gray-800">{selectedPatient.locality}</p>
                  </div>
                </div>
              </div>

              {/* Hospital Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Hospital Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium text-gray-800">{selectedPatient.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ward / Bed</p>
                    <p className="font-medium text-gray-800">{selectedPatient.ward} - {selectedPatient.bedNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Declared By</p>
                    <p className="font-medium text-gray-800">{selectedPatient.declaredBy}</p>
                  </div>
                </div>
              </div>

              {/* Death Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Death Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date of Death</p>
                    <p className="font-medium text-gray-800">{new Date(selectedPatient.dateOfDeath).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time of Death</p>
                    <p className="font-medium text-gray-800">{selectedPatient.timeOfDeath}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Reason of Death</p>
                    <p className="font-medium text-gray-800">{selectedPatient.reasonOfDeath}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowPatientModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowPatientModal(false);
                    registerAsBody(selectedPatient);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <ArrowRight size={18} />
                  Register as Body
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientList;
