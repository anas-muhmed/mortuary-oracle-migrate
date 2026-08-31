import React, { useState } from 'react';
import { Lock, FileText } from 'lucide-react';

export default function BodyReleaseForm({ bodyId, invoiceStatus, bodyStatus, onSuccess }) {
  const [caseType, setCaseType] = useState('NON_MLC');
  const [formData, setFormData] = useState({
    bodyTakenBy: '',
    relationship: '',
    address: '',
    contactNumber: '',
    policeStationName: '',
    siName: ''
  });
  const [files, setFiles] = useState({
    nocFile: null,
    legalDocumentsFile: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [releaseData, setReleaseData] = useState(null);

  if (bodyStatus === 'RELEASED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Released
      </span>
    );
  }

  if (invoiceStatus !== 'Settled' && invoiceStatus !== 'SETTLED') {
    return (
      <div className="flex items-center text-amber-600 text-sm font-medium gap-2">
        <Lock size={16} />
        Bill must be settled before releasing the body
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.bodyTakenBy) newErrors.bodyTakenBy = 'Required';
    if (!formData.contactNumber) newErrors.contactNumber = 'Required';

    if (caseType === 'NON_MLC') {
      if (!formData.relationship) newErrors.relationship = 'Required';
      if (!formData.address) newErrors.address = 'Required';
    } else {
      if (!formData.policeStationName) newErrors.policeStationName = 'Required';
      if (!formData.siName) newErrors.siName = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('bodyId', bodyId);
      data.append('caseType', caseType);
      
      data.append('bodyTakenBy', formData.bodyTakenBy);
      data.append('contactNumber', formData.contactNumber);
      
      if (caseType === 'NON_MLC') {
        data.append('relationship', formData.relationship);
        data.append('address', formData.address);
      } else {
        data.append('policeStationName', formData.policeStationName);
        data.append('siName', formData.siName);
      }

      if (files.nocFile) data.append('nocFile', files.nocFile);
      if (files.legalDocumentsFile) data.append('legalDocumentsFile', files.legalDocumentsFile);

      const res = await fetch('/api/body-releases', {
        method: 'POST',
        body: data
      });

      const responseData = await res.json();

      if (!res.ok) throw new Error(responseData.error || 'Failed to release body');

      setSuccess(true);
      setReleaseData({ ...formData, caseType, releaseId: responseData.releaseId, releasedAt: new Date().toISOString() });
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (success) {
    return (
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <p className="text-green-800 font-medium mb-3">Body released successfully</p>
        <button onClick={handlePrint} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded shadow-sm hover:bg-gray-50 flex items-center gap-2 text-sm font-medium">
          <FileText size={16} /> Print Release Form
        </button>

        {/* Print Section (hidden unless printing) */}
        <div id="print-section" className="hidden print:block fixed inset-0 bg-white z-50 p-8">
          <div className="text-center mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold">MOSC Medical College</h1>
            <h2 className="text-xl">Body Release Form</h2>
          </div>
          
          <div className="mb-6 flex justify-between items-center">
            <div className="text-sm border px-2 py-1 rounded bg-gray-100 font-bold">{releaseData?.caseType}</div>
            <div className="text-sm text-gray-600">Release ID: {releaseData?.releaseId}</div>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
               <div><span className="font-semibold">Body ID:</span> {bodyId}</div>
               <div><span className="font-semibold">Body Taken By:</span> {releaseData?.bodyTakenBy}</div>
               <div><span className="font-semibold">Contact Number:</span> {releaseData?.contactNumber}</div>
               
               {releaseData?.caseType === 'NON_MLC' && (
                 <>
                   <div><span className="font-semibold">Relationship:</span> {releaseData?.relationship}</div>
                   <div className="col-span-2"><span className="font-semibold">Address:</span> {releaseData?.address}</div>
                 </>
               )}

               {releaseData?.caseType === 'MLC' && (
                 <>
                   <div><span className="font-semibold">Police Station:</span> {releaseData?.policeStationName}</div>
                   <div><span className="font-semibold">SI Name:</span> {releaseData?.siName}</div>
                 </>
               )}
            </div>
            <div className="mt-4"><span className="font-semibold">Released At:</span> {new Date(releaseData?.releasedAt).toLocaleString()}</div>
          </div>

          <div className="mt-20 flex justify-between">
             <div className="mt-20">Received By: ___________________</div>
             <div className="mt-20">Date: ___________________</div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * { visibility: hidden; }
              #print-section, #print-section * { visibility: visible; }
              #print-section { position: absolute; left: 0; top: 0; width: 100%; }
            }
          `}} />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm max-w-2xl text-left">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Body Release Form</h3>
      
      <div className="space-y-4">
        {/* Section A: Case Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
          <select 
            value={caseType} 
            onChange={(e) => {
              setCaseType(e.target.value);
              setErrors({});
            }} 
            className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="NON_MLC">NON_MLC</option>
            <option value="MLC">MLC</option>
          </select>
        </div>

        {/* Section B: Common Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body Taken By*</label>
            <input 
              type="text" name="bodyTakenBy" value={formData.bodyTakenBy} onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            />
            {errors.bodyTakenBy && <p className="text-red-500 text-xs mt-1">{errors.bodyTakenBy}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number*</label>
            <input 
              type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            />
            {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
          </div>
        </div>

        {/* Section C: NON_MLC Fields */}
        {caseType === 'NON_MLC' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship*</label>
              <input 
                type="text" name="relationship" value={formData.relationship} onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              />
              {errors.relationship && <p className="text-red-500 text-xs mt-1">{errors.relationship}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address*</label>
              <textarea 
                name="address" rows="2" value={formData.address} onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>
          </div>
        )}

        {/* Section D: MLC Fields */}
        {caseType === 'MLC' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Police Station*</label>
              <input 
                type="text" name="policeStationName" value={formData.policeStationName} onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              />
              {errors.policeStationName && <p className="text-red-500 text-xs mt-1">{errors.policeStationName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SI Name*</label>
              <input 
                type="text" name="siName" value={formData.siName} onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              />
              {errors.siName && <p className="text-red-500 text-xs mt-1">{errors.siName}</p>}
            </div>
          </div>
        )}

        {/* Section E: Documents */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NOC / PCC Certificate</label>
            <input 
              type="file" name="nocFile" accept="image/*,.pdf" onChange={handleFileChange}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Legal Documents</label>
            <input 
              type="file" name="legalDocumentsFile" accept="image/*,.pdf" onChange={handleFileChange}
              className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 outline-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Releasing...
              </span>
            ) : 'Release Body'}
          </button>
        </div>
      </div>
    </form>
  );
}
