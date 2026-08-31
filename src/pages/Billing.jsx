import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Receipt, Search, Plus, X, Calculator, CheckCircle, Trash2, Percent, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import BodyReleaseForm from '../components/release/BodyReleaseForm';
import MortuaryBillPrint from './MortuaryBillPrint';
import ServiceBillPrint from './ServiceBillPrint';
import CombinedBillPrint from './CombinedBillPrint';

const API_BASE = '/api';

function Billing() {
  const role = localStorage.getItem("role");
  const isAdmin = role === "Admin";

  const [bills, setBills] = useState([]);
  const [bodies, setBodies] = useState([]);
  const [authorities, setAuthorities] = useState([]);
  const [serviceMasterList, setServiceMasterList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedBody, setSelectedBody] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculation, setCalculation] = useState(null);
  const [allocationId, setAllocationId] = useState(null);
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [printBill, setPrintBill] = useState(null); // { type, id, serviceId }
  const [generationResult, setGenerationResult] = useState(null);

  const [billingData, setBillingData] = useState({
    baseAmount: 0,
    discountAmount: 0,
    discountReason: '',
    concessionAuthorityId: '',
    staffConcession: false,
    staffName: '',
    staffId: '',
    staffAddress: '',
    staffPhone: '',
    staffRelation: '',
    bodyDressingRequired: false,
    bodyDressingCharge: 0,
    serviceDiscountAmount: 0
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    try {
      const [billsRes, bodiesRes, authRes, servicesRes] = await Promise.all([
        axios.get(`${API_BASE}/billing${filterStatus ? `?status=${filterStatus}` : ''}`),
        axios.get(`${API_BASE}/bodies`),
        axios.get(`${API_BASE}/concession-authorities`),
        axios.get(`${API_BASE}/services`)
      ]);

      setBills(billsRes.data);
      const unbilledBodies = bodiesRes.data.filter(b => b.status === 'Allocated' && b.billing_status === 'PENDING');
      setBodies(unbilledBodies);
      setAuthorities(authRes.data);
      setServiceMasterList(servicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    const initFromUrl = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlBodyId = params.get('bodyId');
      if (urlBodyId && bodies.length > 0 && !showModal) {
        const bodyToBill = bodies.find(b => b.id === urlBodyId);
        if (bodyToBill) {
          window.history.replaceState({}, document.title, window.location.pathname);
          await openBillingModal(bodyToBill);
        }
      }
    };
    initFromUrl();
  }, [bodies]);

  // Set default body dressing tariff if master list loads
  useEffect(() => {
    const dressingService = serviceMasterList.find(s => s.service_name.toLowerCase().includes('dressing'));
    if (dressingService && billingData.bodyDressingCharge === 0) {
      setBillingData(prev => ({
        ...prev,
        bodyDressingCharge: Number(dressingService.tariff)
      }));
    }
  }, [serviceMasterList]);

  const fetchCalculation = async (allocId) => {
    try {
      const response = await axios.get(`${API_BASE}/cabin-allocations/${allocId}/calculate`);
      console.log('Calculation response:', response.data);
      setCalculation(response.data);
      const finalAmount = parseFloat(response.data.finalAmount) || 0;
      setBillingData(prevBillingData => {
        return {
          ...prevBillingData,
          totalAmount: finalAmount,
          discountAmount: prevBillingData.staffConcession ? finalAmount : prevBillingData.discountAmount
        };
      });
    } catch (error) {
      console.error('Error fetching calculation:', error);
    }
  };

  const openBillingModal = async (body) => {
    const dressingService = serviceMasterList.find(s => s.service_name.toLowerCase().includes('dressing'));
    const defaultTariff = dressingService ? Number(dressingService.tariff) : 500;

    setSelectedBody(body);
    setBillingData({
      totalAmount: 0,
      discountAmount: 0,
      discountReason: '',
      concessionAuthorityId: '',
      staffConcession: false,
      staffName: '',
      staffId: '',
      staffAddress: '',
      staffPhone: '',
      staffRelation: '',
      bodyDressingRequired: false,
      bodyDressingCharge: defaultTariff,
      serviceDiscountAmount: 0
    });
    setCalculation(null);
    setAllocationId(null);
    setShowModal(true);

    try {
      const allocResponse = await axios.get(`${API_BASE}/bodies/${body.id}/allocation`);
      if (allocResponse.data && allocResponse.data.id) {
        setAllocationId(allocResponse.data.id);
        await fetchCalculation(allocResponse.data.id);
      }
    } catch (error) {
      console.log('No allocation found for this body:', error.response?.data || error.message);
    }
  };

  // Split calculations helper functions
  const getStayGross = () => Number(calculation?.totalAmount || 0);
  const getStayAdvance = () => Number(calculation?.advanceAmount || 0);
  const getStayDiscount = () => {
    if (billingData.staffConcession) {
      return getStayGross();
    }
    return Number(billingData.discountAmount || 0);
  };
  const getStayNet = () => {
    if (billingData.staffConcession) return 0;
    return Math.max(0, getStayGross() - getStayAdvance() - getStayDiscount());
  };

  const getServiceGross = () => {
    return billingData.bodyDressingRequired ? Number(billingData.bodyDressingCharge || 0) : 0;
  };
  const getServiceDiscount = () => 0;
  const getServiceNet = () => {
    if (!billingData.bodyDressingRequired) return 0;
    return getServiceGross();
  };

  const getCombinedNet = () => {
    return getStayNet() + getServiceNet();
  };

  const handleSubmitBilling = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (billingData.staffConcession) {
      if (!billingData.staffName?.trim()) {
        alert('Staff Name is required for staff concession.');
        setLoading(false);
        return;
      }
      if (!billingData.staffId?.trim()) {
        alert('Staff ID is required for staff concession.');
        setLoading(false);
        return;
      }
      if (!billingData.staffPhone?.trim()) {
        alert('Staff Phone Number is required for staff concession.');
        setLoading(false);
        return;
      }
      if (!billingData.staffRelation) {
        alert('Relation to Deceased is required for staff concession.');
        setLoading(false);
        return;
      }
      if (!billingData.staffAddress?.trim()) {
        alert('Staff Address is required for staff concession.');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await axios.post(`${API_BASE}/billing/generate`, {
        bodyId: selectedBody.id,
        cabinAllocationId: allocationId,
        totalAmount: getStayGross(),
        discountAmount: getStayDiscount(),
        discountReason: billingData.staffConcession ? 'Staff Welfare Scheme - 100% Discount' : billingData.discountReason,
        concessionAuthorityId: (billingData.staffConcession || !billingData.concessionAuthorityId) ? null : billingData.concessionAuthorityId,
        firstDayCharge: Number(calculation?.firstDayCharge || 0),
        extraHours: Number(calculation?.extraHours || 0),
        hourlyRate: Number(calculation?.hourlyRate || 0),
        additionalHourCharges: Number(calculation?.additionalHourCharges || 0),
        totalHours: Number(calculation?.totalHours || 0),
        advanceAmount: Number(calculation?.advanceAmount || 0),
        staffConcession: billingData.staffConcession ? 1 : 0,
        staffName: billingData.staffConcession ? billingData.staffName : null,
        staffEmployeeId: billingData.staffConcession ? billingData.staffId : null,
        staffAddress: billingData.staffConcession ? billingData.staffAddress : null,
        staffPhone: billingData.staffConcession ? billingData.staffPhone : null,
        staffRelation: billingData.staffConcession ? billingData.staffRelation : null,
        bodyDressingRequired: billingData.bodyDressingRequired,
        bodyDressingCharge: getServiceGross()
      }, {
        headers: {
          'x-user-role': role || ''
        }
      });

      setGenerationResult(response.data);
    } catch (error) {
      console.error('Error creating bill:', error);
      alert(`Error: ${error.response?.data?.error || error.response?.data?.message || error.message || 'Error creating bill'}`);
    } finally {
      setLoading(false);
    }
  };

  const settleBill = async (billId) => {
    if (!confirm('Are you sure you want to settle this stay bill?')) return;

    try {
      await axios.post(`${API_BASE}/billing/settle`, { id: billId });
      alert('Stay bill settled successfully');
      fetchData();
    } catch (error) {
      console.error('Error settling bill:', error);
      alert(`Error: ${error.response?.data?.message || 'Error settling bill'}`);
    }
  };

  const settleServiceBill = async (serviceBillId) => {
    if (!confirm('Are you sure you want to settle this service bill?')) return;

    try {
      await axios.post(`${API_BASE}/service-billing/settle`, { id: serviceBillId });
      alert('Service bill settled successfully');
      fetchData();
    } catch (error) {
      console.error('Error settling service bill:', error);
      alert(`Error: ${error.response?.data?.message || 'Error settling service bill'}`);
    }
  };

  const filteredBills = bills.filter(bill =>
    !searchQuery ||
    bill.bodyNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mortuary Billing</h1>
          <p className="text-gray-500">Manage billing and settlements</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} /> */}
              <input
                type="text"
                placeholder="Search by body number or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Bills</option>
            <option value="Pending">Pending</option>
            <option value="Settled">Settled</option>
          </select>
        </div>
      </div>

      {/* Bills Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left">Body Number</th>
                <th className="px-6 py-3 text-left">Patient Name</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Mortuary Stay Bill</th>
                <th className="px-6 py-3 text-left">Body Dressing Bill</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => {
                  const isStaySettled = bill.status === 'Settled';
                  const isServiceSettled = !bill.serviceBill || bill.serviceBill.status === 'Settled';
                  const isFullySettled = isStaySettled && isServiceSettled;
                  const isReleased = bill.bodyStatus === 'RELEASED';

                  return (
                    <React.Fragment key={bill.id}>
                      <tr className="table-row">
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">
                          <div className="flex flex-col gap-1">
                            <span>{bill.bodyNumber}</span>
                            {bill.staffConcession === 1 && (
                              <span className="self-start px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-800 rounded-full border border-green-200 uppercase tracking-wider">
                                STAFF CONCESSION
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{bill.patientName || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`status-badge ${bill.bodyType === 'MLC' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {bill.bodyType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-gray-800">₹{bill.netAmount?.toFixed(2) || '0.00'}</span>
                            <span className={`status-badge self-start text-[11px] px-2 py-0.5 ${bill.status === 'Settled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {bill.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {bill.serviceBill ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-gray-800">₹{Number(bill.serviceBill.netAmount || 0).toFixed(2)}</span>
                              <span className={`status-badge self-start text-[11px] px-2 py-0.5 ${bill.serviceBill.status === 'Settled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {bill.serviceBill.status}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">No Dressing</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col gap-2">
                            {/* Settlement Actions */}
                            <div className="flex gap-2 flex-wrap">
                              {bill.status === 'Pending' && (
                                <button
                                  onClick={() => settleBill(bill.id)}
                                  className="px-2.5 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors text-xs font-semibold"
                                >
                                  Settle Stay
                                </button>
                              )}
                              {bill.serviceBill && bill.serviceBill.status === 'Pending' && (
                                <button
                                  onClick={() => settleServiceBill(bill.serviceBill.id)}
                                  className="px-2.5 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors text-xs font-semibold"
                                >
                                  Settle Dressing
                                </button>
                              )}
                            </div>

                            {/* Print Actions */}
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => setPrintBill({ type: 'mortuary', id: bill.id })}
                                className="px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 border"
                              >
                                <Printer size={12} /> Stay Receipt
                              </button>
                              {bill.serviceBill && (
                                <>
                                  <button
                                    onClick={() => setPrintBill({ type: 'service', id: bill.serviceBill.id })}
                                    className="px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 border"
                                  >
                                    <Printer size={12} /> Service Receipt
                                  </button>
                                  <button
                                    onClick={() => setPrintBill({ type: 'combined', id: bill.id, serviceId: bill.serviceBill.id })}
                                    className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 border border-blue-100"
                                  >
                                    <Printer size={12} /> Combined PDF
                                  </button>
                                </>
                              )}
                            </div>

                            {/* Release Action */}
                            <div className="mt-1 border-t pt-2">
                              {isReleased ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-green-700 font-bold text-xs bg-green-50 border border-green-200 px-2 py-0.5 rounded">Released ✔</span>
                                  <button
                                    onClick={() => setExpandedBillId(expandedBillId === bill.id ? null : bill.id)}
                                    className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-xs font-semibold"
                                  >
                                    Print Release Form
                                  </button>
                                </div>
                              ) : isFullySettled ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-green-700 font-bold text-xs bg-green-50 border border-green-200 px-2 py-0.5 rounded">Paid ✔</span>
                                  <button
                                    onClick={() => setExpandedBillId(expandedBillId === bill.id ? null : bill.id)}
                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                                  >
                                    Release Body {expandedBillId === bill.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <button
                                    disabled={true}
                                    className="px-2.5 py-1 bg-gray-300 text-gray-500 rounded-lg opacity-50 cursor-not-allowed text-xs font-semibold self-start"
                                  >
                                    Release Body
                                  </button>
                                  <span className="text-amber-700 text-[10px] font-medium mt-1">
                                    ⚠ Complete settlement before release.
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                      {expandedBillId === bill.id && (
                        <tr>
                          <td colSpan="6" className="bg-gray-50 border-b p-6">
                            <BodyReleaseForm
                              bodyId={bill.bodyId}
                              invoiceStatus={bill.status}
                              bodyStatus={bill.bodyStatus}
                              onSuccess={fetchData}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No bills found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing Modal */}
      {showModal && selectedBody && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-800">Generate Bill</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setGenerationResult(null);
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {generationResult ? (
              <div className="p-6 space-y-6 text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200 shadow-sm">
                  <CheckCircle size={36} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Billing Documents Generated</h3>
                <p className="text-sm text-gray-500">The billing records have been split and generated for this body.</p>

                <div className="bg-gray-50 p-4 rounded-xl text-left max-w-md mx-auto space-y-3 border">
                  <div className="flex justify-between items-center text-sm border-b pb-2">
                    <span className="text-gray-600 font-medium">Mortuary Stay Bill:</span>
                    <span className="font-bold text-blue-700">MB-{selectedBody.bodyNumber.replace('MOSC-', '')}</span>
                  </div>
                  {generationResult.serviceBillId && (
                    <div className="flex justify-between items-center text-sm border-b pb-2">
                      <span className="text-gray-600 font-medium">Body Dressing Service Bill:</span>
                      <span className="font-bold text-blue-700">SB-{selectedBody.bodyNumber.replace('MOSC-', '')}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 border-t">
                  <button
                    onClick={() => setPrintBill({ type: 'mortuary', id: generationResult.mortuaryBillId })}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Printer size={16} /> Print Stay Receipt
                  </button>

                  {generationResult.serviceBillId && (
                    <>
                      <button
                        onClick={() => setPrintBill({ type: 'service', id: generationResult.serviceBillId })}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Printer size={16} /> Print Service Receipt
                      </button>
                      <button
                        onClick={() => setPrintBill({ type: 'combined', id: generationResult.mortuaryBillId, serviceId: generationResult.serviceBillId })}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold text-sm flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Printer size={16} /> Combined Package
                      </button>
                    </>
                  )}
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setGenerationResult(null);
                      setSelectedBody(null);
                      fetchData();
                    }}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitBilling} className="p-6 space-y-6">
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
                  </div>
                </div>

                {/* Calculation Details */}
                {calculation && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Calculator size={16} />
                      Calculation Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-600">Admission:</span>
                        <span className="font-medium">
                          {new Date(calculation.admissionDateTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-600">Current/Release:</span>
                        <span className="font-medium">
                          {new Date(calculation.currentDateTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Stay:</span>
                        <span className="font-medium text-orange-600">{calculation.totalHours} hour{calculation.totalHours !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">First Day Charge:</span>
                        <span className="font-medium">₹{calculation.firstDayCharge}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Extra Hours:</span>
                        <span className="font-medium">{calculation.extraHours} hr{calculation.extraHours !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hourly Rate:</span>
                        <span className="font-medium">₹{calculation.hourlyRate}/hr</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-1 col-span-2">
                        <span className="text-gray-600 font-medium">Additional Hour Charges:</span>
                        <span className="font-medium">₹{calculation.additionalHourCharges}</span>
                      </div>
                      <div className="flex justify-between col-span-2 font-semibold text-gray-800">
                        <span>Total Cabin Stay Charge:</span>
                        <span>₹{calculation.totalAmount}</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-600">Less: Advance Paid:</span>
                        <span className="font-medium text-red-600">- ₹{calculation.advanceAmount}</span>
                      </div>
                      <div className="flex justify-between col-span-2 border-t pt-2 mt-1">
                        <span className="text-gray-800 font-bold">Net Cabin Charge:</span>
                        <span className="font-bold text-blue-600">₹{calculation.finalAmount}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Body Dressing Service */}
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg space-y-4">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                    <Receipt size={16} />
                    Body Dressing Service
                  </h4>

                  <div className="flex items-center gap-2 bg-white/50 p-2.5 rounded-lg border border-blue-100">
                    <label className="flex items-center gap-2 font-medium text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={billingData.bodyDressingRequired}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const dressingService = serviceMasterList.find(s => s.service_name.toLowerCase().includes('dressing'));
                          const defaultTariff = dressingService ? Number(dressingService.tariff) : 500;
                          setBillingData({
                            ...billingData,
                            bodyDressingRequired: checked,
                            bodyDressingCharge: checked ? defaultTariff : 0,
                            serviceDiscountAmount: 0
                          });
                        }}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>Body Dressing Required</span>
                    </label>
                  </div>

                  {billingData.bodyDressingRequired && (
                    <div className="grid grid-cols-1 gap-4 bg-white p-3 border border-blue-100 rounded-lg">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Body Dressing Charge (₹) *</label>
                        <input
                          type="number"
                          value={billingData.bodyDressingCharge || ''}
                          onChange={(e) => setBillingData({ ...billingData, bodyDressingCharge: parseFloat(e.target.value) || 0 })}
                          className="input-field text-sm"
                          min="0"
                          disabled={!isAdmin}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Discount */}
                <div className="bg-green-50 p-4 rounded-lg space-y-4">
                  <h4 className="font-medium text-gray-700 flex items-center gap-2">
                    <Percent size={16} />
                    Apply Discount
                  </h4>

                  <div className="flex items-center gap-2 bg-white/50 p-2.5 rounded-lg border border-green-100">
                    <label className="flex items-center gap-2 font-medium text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={billingData.staffConcession}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setBillingData({
                            ...billingData,
                            staffConcession: checked,
                            discountReason: checked ? 'Staff Welfare Scheme - 100% Discount' : '',
                            concessionAuthorityId: '',
                            ...(!checked && {
                              staffName: '',
                              staffId: '',
                              staffAddress: '',
                              staffPhone: '',
                              staffRelation: ''
                            })
                          });
                        }}
                        className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <span>Staff Concession Case</span>
                    </label>
                  </div>

                  {billingData.staffConcession && (
                    <div className="p-4 bg-white border border-green-200 rounded-lg space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded-full border border-green-200">
                          100% Staff Concession Applied
                        </span>
                        <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                          Staff Welfare Scheme – 100% Discount
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Staff Name *</label>
                          <input
                            type="text"
                            value={billingData.staffName}
                            onChange={(e) => setBillingData({ ...billingData, staffName: e.target.value })}
                            className="input-field"
                            required={billingData.staffConcession}
                            placeholder="Employee Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Staff ID *</label>
                          <input
                            type="text"
                            value={billingData.staffId}
                            onChange={(e) => setBillingData({ ...billingData, staffId: e.target.value })}
                            className="input-field"
                            required={billingData.staffConcession}
                            placeholder="Employee ID"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Staff Phone Number *</label>
                          <input
                            type="text"
                            value={billingData.staffPhone}
                            onChange={(e) => setBillingData({ ...billingData, staffPhone: e.target.value })}
                            className="input-field"
                            required={billingData.staffConcession}
                            placeholder="Phone Number"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Relation to Deceased *</label>
                          <select
                            value={billingData.staffRelation}
                            onChange={(e) => setBillingData({ ...billingData, staffRelation: e.target.value })}
                            className="input-field"
                            required={billingData.staffConcession}
                          >
                            <option value="">Select Relation</option>
                            <option value="Self">Self</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Son">Son</option>
                            <option value="Daughter">Daughter</option>
                            <option value="Brother">Brother</option>
                            <option value="Sister">Sister</option>
                            <option value="Grandfather">Grandfather</option>
                            <option value="Grandmother">Grandmother</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Staff Address *</label>
                          <textarea
                            value={billingData.staffAddress}
                            onChange={(e) => setBillingData({ ...billingData, staffAddress: e.target.value })}
                            className="input-field"
                            rows="2"
                            required={billingData.staffConcession}
                            placeholder="Employee Address"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Concession Authority</label>
                      <select
                        value={billingData.concessionAuthorityId}
                        onChange={(e) => setBillingData({ ...billingData, concessionAuthorityId: e.target.value })}
                        className="input-field text-sm"
                        disabled={billingData.staffConcession}
                      >
                        <option value="">Select Authority</option>
                        {authorities.map((auth) => (
                          <option key={auth.id} value={auth.id}>{auth.name} ({auth.designation})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Discount Amount (₹)</label>
                      <input
                        type="number"
                        value={billingData.staffConcession ? getStayGross() : (billingData.discountAmount || '')}
                        onChange={(e) => setBillingData({ ...billingData, discountAmount: parseFloat(e.target.value) || 0 })}
                        className="input-field text-sm"
                        min="0"
                        disabled={billingData.staffConcession}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Reason for Discount</label>
                    <input
                      type="text"
                      value={billingData.discountReason}
                      onChange={(e) => setBillingData({ ...billingData, discountReason: e.target.value })}
                      className="input-field text-sm"
                      placeholder="Enter reason for discount"
                      disabled={billingData.staffConcession}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Bill Summary</h4>
                  <div className="space-y-4 text-sm">
                    {/* Mortuary Stay Bill Breakdown */}
                    <div className="border-b pb-2">
                      <h5 className="font-semibold text-blue-900 text-xs uppercase tracking-wider mb-2">Mortuary Stay Bill</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Stay Charges (Stay: {calculation?.totalHours || 0} hr{calculation?.totalHours !== 1 ? 's' : ''}):</span>
                          <span>₹{getStayGross().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Less: Advance Paid:</span>
                          <span>- ₹{getStayAdvance().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Less: Concession Discount:</span>
                          <span className="text-red-500">- ₹{getStayDiscount().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-sm pt-1 border-t border-dashed">
                          <span>Stay Net Payable:</span>
                          <span className="text-blue-700">₹{getStayNet().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Service Bill Breakdown (rendered only if required) */}
                    {billingData.bodyDressingRequired && (
                      <div className="border-b pb-2">
                        <h5 className="font-semibold text-blue-900 text-xs uppercase tracking-wider mb-2">Body Dressing Service Bill</h5>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Body Dressing Charge:</span>
                            <span>₹{getServiceGross().toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-medium text-sm pt-1 border-t border-dashed">
                            <span>Service Net Payable:</span>
                            <span className="text-blue-700">₹{getServiceNet().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Combined Totals */}
                    <div className="flex justify-between font-bold text-base pt-1">
                      <span>Total Net Payable:</span>
                      <span className="text-blue-600">₹{getCombinedNet().toFixed(2)}</span>
                    </div>
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
                    {loading ? 'Creating...' : 'Create Bill'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ---- PRINT BILL OVERLAYS ---- */}
      {printBill && printBill.type === 'mortuary' && (
        <MortuaryBillPrint billingId={printBill.id} onClose={() => setPrintBill(null)} />
      )}
      {printBill && printBill.type === 'service' && (
        <ServiceBillPrint billingId={printBill.id} onClose={() => setPrintBill(null)} />
      )}
      {printBill && printBill.type === 'combined' && (
        <CombinedBillPrint billingId={printBill.id} serviceId={printBill.serviceId} onClose={() => setPrintBill(null)} />
      )}
    </div>
  );
}

export default Billing;