import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Download, Calendar, Filter, TrendingUp, DollarSign, Users, Bed, Percent } from 'lucide-react';

const API_BASE = '/api';

function Reports() {
  const [activeReport, setActiveReport] = useState('occupancy');
  const [occupancyData, setOccupancyData] = useState({ data: [], summary: {} });
  const [invoiceData, setInvoiceData] = useState({ data: [], summary: {} });
  const [concessionData, setConcessionData] = useState({ data: [], summary: {} });
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    cabinNo: '',
    bodyType: '',
    status: ''
  });

  useEffect(() => {
    if (activeReport === 'occupancy') fetchOccupancyReport();
    else if (activeReport === 'invoice') fetchInvoiceReport();
    else if (activeReport === 'concession') fetchConcessionReport();
  }, [activeReport]);

  const fetchOccupancyReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.cabinNo) params.append('cabinNo', filters.cabinNo);
      if (filters.bodyType) params.append('bodyType', filters.bodyType);

      const response = await axios.get(`${API_BASE}/reports/cabin-occupancy?${params}`);
      setOccupancyData(response.data);
    } catch (error) {
      console.error('Error fetching occupancy report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);
      if (filters.concessionApplied) params.append('concessionApplied', filters.concessionApplied);

      const response = await axios.get(`${API_BASE}/reports/invoice-analysis?${params}`);
      setInvoiceData(response.data);
    } catch (error) {
      console.error('Error fetching invoice report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConcessionReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await axios.get(`${API_BASE}/reports/concession?${params}`);
      setConcessionData(response.data);
    } catch (error) {
      console.error('Error fetching concession report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => {
    if (activeReport === 'occupancy') fetchOccupancyReport();
    else if (activeReport === 'invoice') fetchInvoiceReport();
    else if (activeReport === 'concession') fetchConcessionReport();
  };

  const exportToCSV = () => {
    let data, headers;
    
    if (activeReport === 'occupancy') {
      data = occupancyData.data;
      headers = ['Body Number', 'Patient Name', 'Cabin', 'Type', 'Admission', 'Release', 'Duration (hrs)'];
    } else if (activeReport === 'invoice') {
      data = invoiceData.data;
      headers = ['Body Number', 'Patient Name', 'Type', 'Total', 'Discount', 'Net Amount', 'Status'];
    } else {
      data = concessionData.data;
      headers = ['Body Number', 'Patient Name', 'Authority', 'Discount Amount', 'Reason', 'Date'];
    }

    const csvContent = [
      headers.join(','),
      ...data.map(row => {
        if (activeReport === 'occupancy') {
          return `${row.bodyNumber},${row.patientName || ''},${row.cabinNumber},${row.bodyType},${row.admissionDateTime},${row.releaseDateTime || 'N/A'},${row.durationHours || 0}`;
        } else if (activeReport === 'invoice') {
          return `${row.bodyNumber},${row.patientName || ''},${row.bodyType},${row.totalAmount},${row.discountAmount},${row.netAmount},${row.status}`;
        } else {
          return `${row.bodyNumber},${row.patientName || ''},${row.authorityName || 'N/A'},${row.discountAmount},${row.discountReason || ''},${row.createdAt}`;
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const tabs = [
    { id: 'occupancy', label: 'Cabin Occupancy', icon: TrendingUp },
    { id: 'invoice', label: 'Invoice Analysis', icon: FileText },
    { id: 'concession', label: 'Concession Report', icon: Percent }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-500">View and export various reports</p>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                activeReport === tab.id
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
          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">From:</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="input-field w-auto text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">To:</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="input-field w-auto text-sm"
                />
              </div>

              {activeReport === 'occupancy' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Cabin:</label>
                    <input
                      type="text"
                      name="cabinNo"
                      value={filters.cabinNo}
                      onChange={handleFilterChange}
                      className="input-field w-24 text-sm"
                      placeholder="CAB-001"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Type:</label>
                    <select
                      name="bodyType"
                      value={filters.bodyType}
                      onChange={handleFilterChange}
                      className="input-field w-auto text-sm"
                    >
                      <option value="">All</option>
                      <option value="MLC">MLC</option>
                      <option value="Non-MLC">Non-MLC</option>
                    </select>
                  </div>
                </>
              )}

              {activeReport === 'invoice' && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Status:</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="input-field w-auto text-sm"
                  >
                    <option value="">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Settled">Settled</option>
                  </select>
                </div>
              )}

              <button
                onClick={applyFilters}
                className="btn-primary text-sm flex items-center gap-1"
              >
                <Filter size={14} />
                Apply
              </button>
            </div>
          </div>

          {/* Cabin Occupancy Report */}
          {activeReport === 'occupancy' && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{occupancyData.summary?.totalAllocations || 0}</p>
                  <p className="text-sm text-gray-600">Total Allocations</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">{occupancyData.summary?.occupied || 0}</p>
                  <p className="text-sm text-gray-600">Occupied</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{occupancyData.summary?.released || 0}</p>
                  <p className="text-sm text-gray-600">Released</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-orange-600">{occupancyData.summary?.mlcCases || 0}</p>
                  <p className="text-sm text-gray-600">MLC Cases</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{occupancyData.summary?.nonMlcCases || 0}</p>
                  <p className="text-sm text-gray-600">Non-MLC</p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3 text-left">Body Number</th>
                      <th className="px-4 py-3 text-left">Patient</th>
                      <th className="px-4 py-3 text-left">Cabin</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Admission</th>
                      <th className="px-4 py-3 text-left">Release</th>
                      <th className="px-4 py-3 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occupancyData.data?.map((row, i) => (
                      <tr key={i} className="table-row">
                        <td className="px-4 py-3 text-sm text-blue-600">{row.bodyNumber}</td>
                        <td className="px-4 py-3 text-sm">{row.patientName || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">{row.cabinNumber}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`status-badge ${row.bodyType === 'MLC' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {row.bodyType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{new Date(row.admissionDateTime).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-sm">{row.releaseDateTime ? new Date(row.releaseDateTime).toLocaleString('en-IN') : 'Active'}</td>
                        <td className="px-4 py-3 text-sm">{row.durationHours != null ? `${row.durationHours} hrs` : '-'}</td>
                      </tr>
                    ))}
                    {occupancyData.data?.length === 0 && (
                      <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No data found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Invoice Report */}
          {activeReport === 'invoice' && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{invoiceData.summary?.totalBills || 0}</p>
                  <p className="text-sm text-gray-600">Total Bills</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">₹{invoiceData.summary?.totalAmount?.toFixed(0) || 0}</p>
                  <p className="text-sm text-gray-600">Total Amount</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-600">₹{invoiceData.summary?.totalDiscount?.toFixed(0) || 0}</p>
                  <p className="text-sm text-gray-600">Total Discount</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">₹{invoiceData.summary?.totalNetAmount?.toFixed(0) || 0}</p>
                  <p className="text-sm text-gray-600">Net Amount</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-600">{invoiceData.summary?.pending || 0}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{invoiceData.summary?.settled || 0}</p>
                  <p className="text-sm text-gray-600">Settled</p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3 text-left">Body Number</th>
                      <th className="px-4 py-3 text-left">Patient</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Discount</th>
                      <th className="px-4 py-3 text-right">Net Amount</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.data?.map((row, i) => (
                      <tr key={i} className="table-row">
                        <td className="px-4 py-3 text-sm text-blue-600">{row.bodyNumber}</td>
                        <td className="px-4 py-3 text-sm">{row.patientName || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`status-badge ${row.bodyType === 'MLC' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {row.bodyType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">₹{row.totalAmount?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-500">-₹{row.discountAmount?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">₹{row.netAmount?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`status-badge ${row.status === 'Settled' ? 'status-available' : 'bg-yellow-100 text-yellow-700'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{new Date(row.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                    {invoiceData.data?.length === 0 && (
                      <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No data found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Concession Report */}
          {activeReport === 'concession' && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{concessionData.summary?.totalConcessions || 0}</p>
                  <p className="text-sm text-gray-600">Total Concessions</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">₹{concessionData.summary?.totalAmount?.toFixed(0) || 0}</p>
                  <p className="text-sm text-gray-600">Total Amount Conceded</p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3 text-left">Body Number</th>
                      <th className="px-4 py-3 text-left">Patient</th>
                      <th className="px-4 py-3 text-left">Authority</th>
                      <th className="px-4 py-3 text-left">Designation</th>
                      <th className="px-4 py-3 text-right">Discount Amount</th>
                      <th className="px-4 py-3 text-left">Reason</th>
                      <th className="px-4 py-3 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {concessionData.data?.map((row, i) => (
                      <tr key={i} className="table-row">
                        <td className="px-4 py-3 text-sm text-blue-600">{row.bodyNumber}</td>
                        <td className="px-4 py-3 text-sm">{row.patientName || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm font-medium">{row.authorityName || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm">{row.designation || '-'}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-500 font-medium">₹{row.discountAmount?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm">{row.discountReason || '-'}</td>
                        <td className="px-4 py-3 text-sm">{new Date(row.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                    {concessionData.data?.length === 0 && (
                      <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No concessions found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Export Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={exportToCSV}
              className="btn-primary flex items-center gap-2"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
