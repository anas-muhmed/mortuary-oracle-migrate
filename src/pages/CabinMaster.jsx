import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, X, Edit2, Trash2, Save, Users, Percent, Bed } from 'lucide-react';

const API_BASE = '/api';

function CabinMaster() {
  const [activeTab, setActiveTab] = useState('cabins');
  const [cabins, setCabins] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const [cabinForm, setCabinForm] = useState({
    cabinNumber: '',
    tariff: 500,
    dailyRate: 500,
    floor: 1,
    status: 'Available',
    cabinType: 'NORMAL_CABIN'
  });

  const [authorityForm, setAuthorityForm] = useState({
    name: '',
    designation: '',
    department: '',
    maxDiscountPercent: 100
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cabinsRes, authRes] = await Promise.all([
        axios.get(`${API_BASE}/cabins`),
        axios.get(`${API_BASE}/concession-authorities`)
      ]);

      setCabins(cabinsRes.data);
      setAuthorities(authRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Cabin Functions
  const openCabinModal = (cabin = null) => {
    if (cabin) {
      setEditingItem(cabin);
      setCabinForm({
        cabinNumber: cabin.cabinNumber,
        tariff: cabin.tariff,
        dailyRate: cabin.daily_rate || cabin.tariff || 500,
        floor: cabin.floor,
        status: cabin.status,
        cabinType: cabin.cabin_type || 'NORMAL_CABIN'
      });
    } else {
      setEditingItem(null);
      setCabinForm({
        cabinNumber: '',
        tariff: 500,
        dailyRate: 500,
        floor: 1,
        status: 'Available',
        cabinType: 'NORMAL_CABIN'
      });
    }
    setShowModal(true);
  };

  const handleCabinSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...cabinForm,
        tariff: parseFloat(cabinForm.tariff) || 500,
        dailyRate: parseFloat(cabinForm.dailyRate) || 500,
        floor: parseInt(cabinForm.floor, 10) || 1,
      };

      if (editingItem) {
        await axios.put(`${API_BASE}/cabins/${editingItem.id}`, payload);
      } else {
        await axios.post(`${API_BASE}/cabins`, payload);
      }

      alert(`Cabin ${editingItem ? 'updated' : 'added'} successfully`);
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving cabin:', error);
      const msg = error.response?.data?.error || error.response?.data?.message || 'Error saving cabin';
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteCabin = async (id) => {
    if (!confirm('Are you sure you want to deactivate this cabin?')) return;

    try {
      await axios.delete(`${API_BASE}/cabins/${id}`);
      alert('Cabin deactivated successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting cabin:', error);
      alert(`Error: ${error.response?.data?.message || 'Error deleting cabin'}`);
    }
  };

  // Authority Functions
  const openAuthorityModal = (authority = null) => {
    if (authority) {
      setEditingItem(authority);
      setAuthorityForm({
        name: authority.name,
        designation: authority.designation,
        department: authority.department,
        maxDiscountPercent: authority.maxDiscountPercent
      });
    } else {
      setEditingItem(null);
      setAuthorityForm({
        name: '',
        designation: '',
        department: '',
        maxDiscountPercent: 100
      });
    }
    setShowModal(true);
  };

  const handleAuthoritySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_BASE}/concession-authorities`, authorityForm);
      alert('Authority added successfully');
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving authority:', error);
      alert(`Error: ${error.response?.data?.message || 'Error saving authority'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAuthority = async (id) => {
    if (!confirm('Are you sure you want to delete this concession authority?')) return;

    try {
      await axios.delete(`${API_BASE}/concession-authorities/${id}`);
      alert('Authority deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting authority:', error);
      const errMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Error deleting authority';
      alert(`Error: ${errMsg}`);
    }
  };

  const tabs = [
    { id: 'cabins', label: 'Cabin Master', icon: Bed },
    { id: 'authorities', label: 'Concession Authority', icon: Percent }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Masters</h1>
        <p className="text-gray-500">Manage cabins, body types, and authorities</p>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'cabins' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Cabin List</h2>
                <button
                  onClick={() => openCabinModal()}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Cabin
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-6 py-3 text-left">Cabin Number</th>
                      <th className="px-6 py-3 text-left">Floor</th>
                      <th className="px-6 py-3 text-left">Tariff (₹/hr)</th>
                      <th className="px-6 py-3 text-left">Cabin Type</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cabins.filter(c => c.status !== 'Deactivated').map((cabin) => (
                      <tr key={cabin.id} className="table-row">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{cabin.cabinNumber}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">Floor {cabin.floor}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">₹{cabin.tariff}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`status-badge ${
                            cabin.cabin_type === 'FREEZER'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {cabin.cabin_type === 'FREEZER' ? 'FREEZER' : 'NORMAL'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`status-badge ${
                            cabin.status === 'Available' ? 'status-available' :
                            cabin.status === 'Occupied' ? 'status-occupied' :
                            cabin.status === 'NEEDS_CLEANING' ? 'bg-yellow-100 text-yellow-700' :
                            'status-maintenance'
                          }`}>
                            {cabin.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openCabinModal(cabin)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteCabin(cabin.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'authorities' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Concession Authority List</h2>
                <button
                  onClick={() => openAuthorityModal()}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Authority
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">Designation</th>
                      <th className="px-6 py-3 text-left">Department</th>
                      <th className="px-6 py-3 text-left">Max Discount %</th>
                      <th className="px-6 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {authorities.map((authority) => (
                      <tr key={authority.id} className="table-row">
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{authority.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{authority.designation || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{authority.department || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{authority.maxDiscountPercent}%</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => deleteAuthority(authority.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Authority"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {authorities.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          No authorities found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cabin Modal */}
      {showModal && activeTab === 'cabins' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingItem ? 'Edit Cabin' : 'Add Cabin'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCabinSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cabin Number *</label>
                <input
                  type="text"
                  value={cabinForm.cabinNumber}
                  onChange={(e) => setCabinForm({ ...cabinForm, cabinNumber: e.target.value })}
                  className="input-field"
                  placeholder="e.g., CAB-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                <input
                  type="number"
                  value={cabinForm.floor}
                  onChange={(e) => setCabinForm({ ...cabinForm, floor: e.target.value })}
                  className="input-field"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cabin Type</label>
                <select
                  value={cabinForm.cabinType}
                  onChange={(e) => setCabinForm({ ...cabinForm, cabinType: e.target.value })}
                  className="input-field"
                >
                  <option value="NORMAL_CABIN">Normal Cabin</option>
                  <option value="FREEZER">Freezer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={cabinForm.status}
                  onChange={(e) => setCabinForm({ ...cabinForm, status: e.target.value })}
                  className="input-field"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="NEEDS_CLEANING">Needs Cleaning</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>

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
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Authority Modal */}
      {showModal && activeTab === 'authorities' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Add Concession Authority</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAuthoritySubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={authorityForm.name}
                  onChange={(e) => setAuthorityForm({ ...authorityForm, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={authorityForm.designation}
                  onChange={(e) => setAuthorityForm({ ...authorityForm, designation: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={authorityForm.department}
                  onChange={(e) => setAuthorityForm({ ...authorityForm, department: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount %</label>
                <input
                  type="number"
                  value={authorityForm.maxDiscountPercent}
                  onChange={(e) => setAuthorityForm({ ...authorityForm, maxDiscountPercent: parseFloat(e.target.value) })}
                  className="input-field"
                  min="0"
                  max="100"
                />
              </div>

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
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save size={18} />
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CabinMaster;
