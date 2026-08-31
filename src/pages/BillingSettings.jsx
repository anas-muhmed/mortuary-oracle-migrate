import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Save, Clock, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

const API_BASE = '/api';

function BillingSettings() {
  const [rates, setRates] = useState({
    first_day_charge: 2100,
    hourly_charge_after_24hrs: 130,
    updated_by: 'System',
    updated_at: ''
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await axios.get(`${API_BASE}/billing-settings`);
      setRates(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setStatus({ type: 'error', message: 'Failed to load stay billing settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRates((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    // Get admin user from localStorage
    const adminStr = localStorage.getItem("admin");
    const adminUser = adminStr ? JSON.parse(adminStr) : null;
    const username = adminUser?.username || "Admin";

    try {
      const response = await axios.post(`${API_BASE}/billing-settings`, {
        first_day_charge: parseFloat(rates.first_day_charge),
        hourly_charge_after_24hrs: parseFloat(rates.hourly_charge_after_24hrs),
        updated_by: username
      });

      setStatus({ type: 'success', message: 'Stay billing settings updated successfully!' });
      setRates(response.data.settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to update stay billing settings.' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (role !== "Admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-2xl border border-red-100 shadow-sm">
        <ShieldAlert size={48} className="text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-500 max-w-sm">
          You do not have permission to access the stay billing configuration page. This screen is reserved for Administrators only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="text-blue-600" />
          Stay Billing Settings
        </h1>
        <p className="text-gray-500">Configure mortuary stay charges and hourly billing parameters</p>
      </div>

      {status && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
          status.type === 'success' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {status.message}
        </div>
      )}

      {loading ? (
        <div className="card p-6 flex flex-col items-center justify-center min-h-[200px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-500 mt-3">Loading rates configuration...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="card p-6 space-y-6 bg-white shadow-sm border rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First 24 Hours Charge */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">
                First 24 Hours Charge (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  name="first_day_charge"
                  value={rates.first_day_charge}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <p className="text-xs text-gray-400">
                Mandatory flat fee and minimum advance required during allocation.
              </p>
            </div>

            {/* Additional Hourly Charge */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Additional Hourly Charge (₹/hr) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input
                  type="number"
                  name="hourly_charge_after_24hrs"
                  value={rates.hourly_charge_after_24hrs}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <p className="text-xs text-gray-400">
                Charged for each additional hour after the initial 24-hour stay.
              </p>
            </div>
          </div>

          {/* Stay Pricing Explainer Card */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Clock className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-blue-800 space-y-1">
              <p className="font-semibold text-sm text-blue-900 mb-1">Pricing Stay Logic Preview</p>
              <p>For stay ≤ 24 hours: Total Charge = ₹{rates.first_day_charge}</p>
              <p>For stay &gt; 24 hours: Total Charge = ₹{rates.first_day_charge} + (Extra Hours × ₹{rates.hourly_charge_after_24hrs}/hr)</p>
            </div>
          </div>

          {/* Audit Trail */}
          {rates.updated_at && (
            <div className="text-xs text-gray-400 pt-4 border-t flex justify-between">
              <span>Last Updated By: <strong>{rates.updated_by}</strong></span>
              <span>Updated At: <strong>{new Date(rates.updated_at).toLocaleString('en-IN')}</strong></span>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={fetchSettings}
              className="btn-secondary text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default BillingSettings;
