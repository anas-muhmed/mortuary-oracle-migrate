
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bed, Search, Plus, X, CheckCircle, AlertTriangle, Clock, DollarSign } from 'lucide-react';

const API_BASE = '/api';
export default function HouseKeeping()
{
const [cabins, setCabins] = useState([]);
  const [bodies, setBodies] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCabin, setSelectedCabin] = useState(null);
  const [selectedBody, setSelectedBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [allocationData, setAllocationData] = useState({
    advanceAmount: 0,
    dailyRate: 500
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cabinsRes, bodiesRes, allocationsRes] = await Promise.all([
        axios.get(`${API_BASE}/cabins`),
        axios.get(`${API_BASE}/bodies?status=Registered`),
        axios.get(`${API_BASE}/cabin-allocations`)
      ]);
      
      setCabins(cabinsRes.data);
      setBodies(bodiesRes.data);
      setAllocations(allocationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getCabinStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-500 hover:bg-green-600';
      case 'Occupied':
        return 'bg-red-500 hover:bg-red-600';
      case 'Under Maintenance':
        return 'bg-gray-400 hover:bg-gray-500';
      case 'NEEDS_CLEANING':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-300';
    }
  };

  const getCabinBorderColor = (status) => {
    switch (status) {
      case 'Available':
        return 'border-green-400';
      case 'Occupied':
        return 'border-red-400';
      case 'Under Maintenance':
        return 'border-gray-400';
      case 'NEEDS_CLEANING':
        return 'border-yellow-400';
      default:
        return 'border-gray-300';
    }
  };

  const openAllocationModal = (cabin) => {
    if (cabin.status !== 'Available') {
      alert('This cabin is not available for allocation');
      return;
    }
    setSelectedCabin(cabin);
    setSelectedBody(''); // Reset selected body
    setSearchQuery(''); // Reset search query when opening modal
    setAllocationData({
      advanceAmount: 0,
      dailyRate: cabin.daily_rate || cabin.tariff || 500
    });
    setShowModal(true);
  };

  const handleAllocationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBody) {
      alert('Please select a body');
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting allocation:', { bodyId: selectedBody, cabinId: selectedCabin.id, ...allocationData });
      const response = await axios.post(`${API_BASE}/cabin-allocations`, {
        bodyId: selectedBody,
        cabinId: selectedCabin.id,
        ...allocationData
      });
      console.log('Allocation response:', response.data);

      alert('Cabin allocated successfully');
      setShowModal(false);
      setSelectedBody('');
      fetchData();
    } catch (error) {
      console.error('Error allocating cabin:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error: ${error.response?.data?.error || error.response?.data?.message || error.message || 'Error allocating cabin'}`);
    } finally {
      setLoading(false);
    }
  };

  const releaseCabin = async (allocationId) => {
    if (!confirm('Are you sure you want to release this body from the cabin?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE}/cabin-allocations/${allocationId}/release`);
      console.log('Release response:', response.data);
      alert('Body released from cabin successfully');
      // Wait a small delay to ensure server has processed the update
      await new Promise(resolve => setTimeout(resolve, 100));
      await fetchData();
    } catch (error) {
      console.error('Error releasing cabin:', error);
      alert(`Error: ${error.response?.data?.message || 'Error releasing cabin'}`);
    } finally {
      setLoading(false);
    }
  };

  const getAllocationByCabinId = (cabinId) => {
    return allocations.find(a => a.cabinId === cabinId && a.status === 'Allocated');
  };

  const filteredBodies = bodies.filter(body =>
    !searchQuery ||
    body.bodyNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    body.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Cabin Allocation</h1>
        <p className="text-gray-500">Manage cabin allocation and view availability</p>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-600">Needs Cleaning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-400 rounded"></div>
            <span className="text-sm text-gray-600">Under Maintenance</span>
          </div>
        </div>
      </div>

      {/* Cabin Grid */}
      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Cabin Availability</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {cabins.filter(c => c.status !== 'Deactivated').map((cabin) => {
              const allocation = getAllocationByCabinId(cabin.id);
              return (
                <div
                  key={cabin.id}
                  onClick={() => openAllocationModal(cabin)}
                  className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${getCabinBorderColor(cabin.status)} ${getCabinStatusColor(cabin.status)} ${cabin.status === 'Available' ? 'hover:shadow-lg' : ''}`}
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      <Bed className="text-white" size={32} />
                    </div>
                    <h3 className="text-white font-bold text-lg">{cabin.cabinNumber}</h3>
                    <p className="text-white text-opacity-80 text-sm mt-1">
                      ₹{cabin.daily_rate || cabin.tariff}/day
                    </p>
                    {allocation && (
                      <div className="mt-3 pt-3 border-t border-white border-opacity-30">
                        <p className="text-white text-xs font-medium truncate">
                          {allocation.patientName || 'Unknown'}
                        </p>
                        <p className="text-white text-opacity-70 text-xs">
                          {allocation.bodyNumber}
                        </p>
                      </div>
                    )}
                  </div>
                  {cabin.status === 'Occupied' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Allocations */}
      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Active Allocations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Body Number</th>
                <th className="px-4 py-3 text-left">Patient Name</th>
                <th className="px-4 py-3 text-left">Cabin</th>
                <th className="px-4 py-3 text-left">Admission Date/Time</th>
                <th className="px-4 py-3 text-left">Est. Release</th>
                <th className="px-4 py-3 text-left">Duration</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.filter(a => a.status === 'Allocated').length > 0 ? (
                allocations.filter(a => a.status === 'Allocated').map((allocation) => {
                  const admissionTime = new Date(allocation.admissionDateTime);
                  const now = new Date();
                  const diffMs = now - admissionTime;
                  const hours = Math.floor(diffMs / (1000 * 60 * 60));
                  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  
                  const estimatedReleaseTime = allocation.estimatedReleaseDateTime ? new Date(allocation.estimatedReleaseDateTime) : null;

                  return (
                    <tr key={allocation.id} className="table-row">
                      <td className="px-4 py-4 text-sm font-medium text-blue-600">{allocation.bodyNumber}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{allocation.patientName || 'N/A'}</td>
                      <td className="px-4 py-4 text-sm">
                        <span className="status-badge status-occupied">{allocation.cabinNumber}</span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {admissionTime.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-4 text-sm text-orange-600 font-medium">
                        {estimatedReleaseTime ? estimatedReleaseTime.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {hours}h {minutes}m
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <button
                          onClick={() => releaseCabin(allocation.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          Release
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No active allocations
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation Modal */}
      {showModal && selectedCabin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Allocate Cabin</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAllocationSubmit} className="p-6 space-y-4">
              {/* Cabin Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Bed className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Allocating Cabin</p>
                    <p className="text-xl font-bold text-blue-600">{selectedCabin.cabinNumber}</p>
                  </div>
                </div>
              </div>

              {/* Search Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Body *</label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search registered bodies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-9"
                  />
                </div>
                <select
                  value={selectedBody}
                  onChange={(e) => setSelectedBody(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select a registered body</option>
                  {filteredBodies.map((body) => (
                    <option key={body.id} value={body.id}>
                      {body.bodyNumber} - {body.patientName || 'N/A'}
                    </option>
                  ))}
                </select>
                {filteredBodies.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">No registered bodies found</p>
                )}
              </div>

              {/* Advance Collection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Collection</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    value={allocationData.advanceAmount}
                    onChange={(e) => setAllocationData({ ...allocationData, advanceAmount: parseFloat(e.target.value) || 0 })}
                    className="input-field pl-7"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Billing Configuration */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  ₹ Billing Configuration
                </h4>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Daily Rate (₹/day)</label>
                  <input
                    type="number"
                    value={allocationData.dailyRate}
                    onChange={(e) => setAllocationData({ ...allocationData, dailyRate: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    min="0"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedBody}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  {loading ? 'Allocating...' : 'Allocate Cabin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
