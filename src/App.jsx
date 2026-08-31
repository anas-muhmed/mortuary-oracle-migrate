import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Bed,
  UserPlus,
  Receipt,
  LogOut,
  FileText,
  Settings,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  List,
  ClipboardCheck,
  Tag
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import BodyRegistration from './pages/BodyRegistration';
import PatientList from './pages/PatientList';
import CabinAllocation from './pages/CabinAllocation';
import Billing from './pages/Billing';
import BodyRelease from './pages/BodyRelease';
import CabinMaster from './pages/CabinMaster';
import Reports from './pages/Reports';
import HousekeepingDashboard from './pages/HousekeepingDashboard';
import ServiceMaster from './pages/ServiceMaster';
import Register from './pages/user_register';
import Login from './pages/signin';
import Dashboard_Base from './pages/dashboard_base';
import HouseKeeping from './pages/housekeeping';
import StaffHouseKeeping from './pages/staff_housekeeping';
import AdminLogin from './pages/adminlogin';
import AdminRegister from './pages/admin_register';
import AdminDashboard from './pages/admin_dashboard';
import BillingSettings from './pages/BillingSettings';
import ReleaseHistory from './pages/ReleaseHistory';
import UserApprovals from './pages/UserApprovals';
import UserGuide from './pages/UserGuide';

function DashboardIndex() {
  const role = localStorage.getItem("role");
  if (role === "Admin") {
    return <Navigate to="/dashboard/admin-dashboard" replace />;
  }
  if (role === "House Keeping") {
    return <Navigate to="/dashboard/housekeeping" replace />;
  }
  return <Navigate to="/dashboard/body-registration" replace />;
}

function MStaffDashboardGuard() {
  const role = localStorage.getItem("role");
  if (role !== "Admin") {
    return <Navigate to="/dashboard/body-registration" replace />;
  }
  return <Dashboard />;
}

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<Register/>}/>
      <Route path="/" element={<Login/>}/>
      <Route path="/admin" element={<AdminLogin/>}/>
      <Route path="/admin_register" element={<AdminRegister/>}/>
      <Route path="/user-guide" element={<UserGuide/>}/>
      <Route path="/dashboard" element={<Dashboard_Base/>}>
        <Route index element={<DashboardIndex />} />
        <Route path="admin-dashboard" element={<AdminDashboard/>}/>
        <Route path="housekeeping" element={<HousekeepingDashboard/>}/>
        <Route path="dashboard" element={<MStaffDashboardGuard />} />
        <Route path="patient-list" element={<PatientList />} />
        <Route path="body-registration" element={<BodyRegistration />} />
        <Route path="cabin-allocation" element={<CabinAllocation />} />
        <Route path="billing" element={<Billing />} />
        <Route path="body-release" element={<BodyRelease />} />
        <Route path="cabin-master" element={<CabinMaster />} />
        <Route path="service-master" element={<ServiceMaster />} />
        <Route path="billing-settings" element={<BillingSettings />} />
        <Route path="reports" element={<Reports />} />
        <Route path="release-history" element={<ReleaseHistory />} />
        <Route path="user-approvals" element={<UserApprovals />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
