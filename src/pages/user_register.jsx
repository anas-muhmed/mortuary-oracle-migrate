import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = '/api';
const DEPARTMENTS = ["House Keeping", "M Staff"];

const initialForm = {
  fullName: "",
  employeeId: "",
  department: "",
  phone1: "",
  phone2: "",
  email: "",
  password: "",
};

function validate(fields) {
  const errors = {};
  if (!fields.fullName.trim()) errors.fullName = "Full name is required.";
  if (!fields.employeeId.trim()) {
    errors.employeeId = "Employee ID is required.";
  } else if (!/^[A-Za-z0-9]+$/.test(fields.employeeId.trim())) {
    errors.employeeId = "Employee ID must be alphanumeric.";
  }
  if (!fields.department) errors.department = "Please select a department.";
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!fields.phone1.trim()) {
    errors.phone1 = "Phone number is required.";
  } else if (!phoneRegex.test(fields.phone1.trim())) {
    errors.phone1 = "Enter a valid 10-digit phone number.";
  }
  if (fields.phone2.trim() && !phoneRegex.test(fields.phone2.trim())) {
    errors.phone2 = "Enter a valid 10-digit phone number.";
  }
  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!fields.password || fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

// ---- Sub-components ----

function InputField({ label, name, type = "text", placeholder, required = true, form, errors, handleChange, extra }) {
  const hasError = Boolean(errors[name]);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white text-gray-900
            placeholder:text-gray-400 transition-all outline-none
            focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
            ${hasError
              ? "border-red-400 bg-red-50 focus:ring-red-400/20 focus:border-red-400"
              : "border-gray-200 hover:border-gray-300"
            }`}
        />
        {extra}
      </div>
      {hasError && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {errors[name]}
        </p>
      )}
    </div>
  );
}

// ---- Approval Success Modal ----
function ApprovalModal({ onGoToLogin }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-fade-in">
        {/* Success Icon */}
        <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center border-4 border-amber-200">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Registration Submitted!</h2>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-amber-800 font-semibold mb-1 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Pending Admin Approval
          </p>
          <p className="text-sm text-amber-700">
            Your registration has been received. You <strong>cannot log in</strong> until an admin approves your account.
            Please contact the system administrator.
          </p>
        </div>

        <button
          onClick={onGoToLogin}
          className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white
            bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200
            flex items-center justify-center gap-2"
        >
          Go to Login
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---- Main Register Component ----
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
    setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setSubmitError("");
    try {
      const payload = {
        fullname: form.fullName.trim(),
        employee_id: form.employeeId.trim(),
        department: form.department,
        phone1: form.phone1.trim(),
        phone2: form.phone2.trim() || "",
        email: form.email.trim(),
        password: form.password,
      };

      const res = await fetch(`${API_BASE}/user_register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setForm(initialForm);
        setErrors({});
        setShowSuccessModal(true);
      } else {
        setSubmitError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Approval Pending Modal */}
      {showSuccessModal && (
        <ApprovalModal onGoToLogin={() => navigate("/")} />
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-200">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Staff Account</h1>
            <p className="text-sm text-gray-500 mt-1">Register for access — subject to admin approval</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">

            {/* Global error banner */}
            {submitError && (
              <div className="mb-5 p-3.5 rounded-lg text-sm flex items-center gap-2 font-medium bg-red-50 text-red-600 border border-red-200">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Full Name */}
              <InputField label="Full Name" name="fullName" placeholder="e.g. John Mathew"
                form={form} errors={errors} handleChange={handleChange} />

              {/* Employee ID */}
              <InputField label="Employee ID" name="employeeId" placeholder="e.g. EMP001"
                form={form} errors={errors} handleChange={handleChange} />

              {/* Department */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white text-gray-900
                    outline-none transition-all
                    focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
                    ${errors.department
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                    <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.department}
                  </p>
                )}
              </div>

              {/* Phone Row */}
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Phone (Primary)" name="phone1" placeholder="e.g. 9876543210"
                  form={form} errors={errors} handleChange={handleChange} />
                <InputField label="Phone (Secondary)" name="phone2" placeholder="Optional" required={false}
                  form={form} errors={errors} handleChange={handleChange} />
              </div>

              {/* Email */}
              <InputField label="Email" name="email" type="email" placeholder="e.g. john@hospital.in"
                form={form} errors={errors} handleChange={handleChange} />

              {/* Password */}
              <InputField
                label="Password" name="password" type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                form={form} errors={errors} handleChange={handleChange}
                extra={
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    }
                  </button>
                }
              />

              {/* Notice */}
              <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-700">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>After registration, your account will be <strong>reviewed by an admin</strong> before you can log in.</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white
                  bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]
                  transition-all shadow-md shadow-indigo-200
                  disabled:opacity-60 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Registration
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">Already registered?</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Login link */}
            <a
              href="/"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg
                border border-gray-200 text-sm font-medium text-gray-600
                bg-white hover:bg-gray-50 hover:border-gray-300
                active:scale-[0.98] transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In Instead
            </a>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Mortuary Management System &mdash; Staff Portal
          </p>
        </div>
      </div>
    </>
  );
}