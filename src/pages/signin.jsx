import { useState } from "react";
 import { useNavigate } from "react-router-dom";
const initialForm = { employeeId: "", password: "" };
 
function validate(fields) {
  const errors = {};
  if (!fields.employeeId.trim()) {
    errors.employeeId = "Employee ID is required.";
  } else if (!/^[A-Za-z0-9]+$/.test(fields.employeeId)) {
    errors.employeeId = "Employee ID must be alphanumeric.";
  }
  if (!fields.password) {
    errors.password = "Password is required.";
  } else if (fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}
 
export default function Login() {
    const navigation=useNavigate();
       const API_BASE = '/api';
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loading, setLoading] = useState(false);
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setSubmitStatus(null);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitStatus({ type: "success", msg: data.message || "Login successful! Redirecting..." });
        localStorage.setItem('username',data.user.fullname) 
        localStorage.setItem('role',data.user.role)
      
        if(data.user.role === "House Keeping")
        {
          navigation("/dashboard/housekeeping");
        }
        else if(data.user.role === "M Staff")
        { 
          navigation("/dashboard/body-registration");
        }
        else if(data.user.role === "Admin")
        {
          navigation("/dashboard/admin-dashboard");
        }
        else
        {
          navigation("/dashboard/body-registration");
        }
        
        // e.g. navigate to dashboard: window.location.href = "/dashboard";
      } else {
        setSubmitStatus({ type: "error", msg: data.message || "Invalid credentials. Please try again." });
      }
    } catch {
      setSubmitStatus({ type: "error", msg: "Network error. Please check your connection." });
    } finally {
      setLoading(false);
    }
  };
 
  const inputClass = (field) =>
    `w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white text-gray-900
    placeholder:text-gray-400 transition-all outline-none
    focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500
    ${errors[field]
      ? "border-red-400 bg-red-50 focus:ring-red-400/20 focus:border-red-400"
      : "border-gray-200 hover:border-gray-300"}`;
 
  const ErrorMsg = ({ field }) =>
    errors[field] ? (
      <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {errors[field]}
      </p>
    ) : null;
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
 
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-200">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your staff account</p>
        </div>
 
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
 
          {/* Status Banner */}
          {submitStatus && (
            <div className={`mb-6 p-3.5 rounded-lg text-sm flex items-center gap-2 font-medium
              ${submitStatus.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-600 border border-red-200"}`}>
              {submitStatus.type === "success"
                ? <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                : <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>}
              {submitStatus.msg}
            </div>
          )}
 
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
 
            {/* Employee ID */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Employee ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                  </svg>
                </span>
                <input
                  type="text"
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. EMP001"
                  autoComplete="username"
                  className={inputClass("employeeId") + " pl-10"}
                />
              </div>
              <ErrorMsg field="employeeId" />
            </div>
 
            {/* Password */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  onClick={() => alert("Forgot password flow — implement as needed.")}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={inputClass("password") + " pl-10 pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                      </svg>}
                </button>
              </div>
              <ErrorMsg field="password" />
            </div>
 
            {/* Remember Me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                Remember me on this device
              </span>
            </label>
 
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
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
            <span className="text-xs text-gray-400 font-medium">New staff member?</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
 
          {/* Register Link */}
          <a
            href="/signup"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg
              border border-gray-200 text-sm font-medium text-gray-600
              bg-white hover:bg-gray-50 hover:border-gray-300
              active:scale-[0.98] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Create an account
          </a>

          {/* Need Help Getting Started section */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Need Help Getting Started?</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a
              href="/user-guide"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg
                border border-indigo-100 text-xs font-semibold text-indigo-600
                bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-200
                active:scale-[0.98] transition-all text-center"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Open User Guide
            </a>
            <a
              href="/user-guide?watch=true"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg
                border border-rose-100 text-xs font-semibold text-rose-600
                bg-rose-50/50 hover:bg-rose-50 hover:border-rose-200
                active:scale-[0.98] transition-all text-center"
            >
              <svg className="w-3.5 h-3.5 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Watch Tutorial
            </a>
          </div>
        </div>
 
        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Mortuary Management System &mdash; Staff Portal
        </p>
      </div>
    </div>
  );
}