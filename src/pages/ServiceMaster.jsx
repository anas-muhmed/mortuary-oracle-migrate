import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Plus, X, Edit2, Trash2, Save, CheckCircle } from 'lucide-react';

const API_BASE = '/api';

function ServiceMaster() {
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";

  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ service_name: '', tariff: '' });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get(`${API_BASE}/services`);
      setServices(res.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const openModal = (service = null) => {
    if (service) {
      setEditingItem(service);
      setForm({ service_name: service.service_name, tariff: service.tariff });
    } else {
      setEditingItem(null);
      setForm({ service_name: '', tariff: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        service_name: form.service_name.trim(),
        tariff: parseFloat(form.tariff) || 0,
      };
      const headers = { 'x-user-role': role || '' };
      if (editingItem) {
        await axios.put(`${API_BASE}/services/${editingItem.id}`, payload, { headers });
      } else {
        await axios.post(`${API_BASE}/services`, payload, { headers });
      }
      alert(`Service ${editingItem ? 'updated' : 'added'} successfully`);
      setShowModal(false);
      fetchServices();
    } catch (error) {
      const msg = error.response?.data?.error || 'Error saving service';
      alert(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteService = async (id) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const headers = { 'x-user-role': role || '' };
      await axios.delete(`${API_BASE}/services/${id}`, { headers });
      fetchServices();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || 'Error deleting service'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Service Master</h1>
        <p className="text-gray-500">Manage billable services and their tariffs</p>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Tag size={20} className="text-blue-600" />
            Services List
          </h2>
          {isAdmin && (
            <button
              onClick={() => openModal()}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Add Service
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Service Name</th>
                <th className="px-6 py-3 text-left">Tariff (₹)</th>
                {isAdmin && <th className="px-6 py-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {services.length > 0 ? (
                services.map((svc, index) => (
                  <tr key={svc.id} className="table-row">
                    <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{svc.service_name}</td>
                    <td className="px-6 py-4 text-sm text-green-700 font-semibold">₹{Number(svc.tariff).toFixed(2)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openModal(svc)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteService(svc.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? "4" : "3"} className="px-6 py-10 text-center text-gray-400">
                    No services found. Click "Add Service" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingItem ? 'Edit Service' : 'Add New Service'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={form.service_name}
                  onChange={(e) => setForm({ ...form, service_name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Body Dressing, Embalming"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tariff (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input
                    type="number"
                    value={form.tariff}
                    onChange={(e) => setForm({ ...form, tariff: e.target.value })}
                    className="input-field pl-8"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                  {loading ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceMaster;
