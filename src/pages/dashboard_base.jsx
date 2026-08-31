import { Outlet } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
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
  Tag,
  History,
  UserCheck
} from 'lucide-react';

export default function Dashboard_Base() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const role = localStorage.getItem("role");
  const admin = localStorage.getItem("admin");

  const navigotor = useNavigate();
  let navItems = [];

  if (role != "House Keeping" && role != "Admin") {
    navItems = [
      { path: '/dashboard/body-registration', icon: UserPlus, label: 'Body Registration' },
      { path: '/dashboard/cabin-allocation', icon: Bed, label: 'Cabin Allocation' },
      { path: '/dashboard/body-release', icon: LogOut, label: 'Body Release' },
      { path: '/dashboard/billing', icon: Receipt, label: 'Billing' },
      { path: '/dashboard/release-history', icon: History, label: 'Release History' },
      { path: '/dashboard/housekeeping', icon: ClipboardCheck, label: 'Housekeeping' },
    ];
  }
  else if (role === "Admin") {
    navItems = [
      { path: '/dashboard/admin-dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
      { path: '/dashboard/user-approvals',  icon: UserCheck,        label: 'User Approvals' },
      { path: '/dashboard/cabin-master',    icon: Settings,         label: 'Masters' },
      { path: '/dashboard/service-master',  icon: Tag,              label: 'Service Master' },
      { path: '/dashboard/billing-settings',icon: Settings,         label: 'Billing Settings' },
      { path: '/dashboard/reports',         icon: FileText,         label: 'Reports' },
    ];
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200 bg-blue-600">
            {sidebarOpen ? (
              <div className="text-center">
                <h1 className="text-white font-bold text-lg">MOSC</h1>
                <p className="text-blue-200 text-xs">Mortuary Management</p>
              </div>
            ) : (
              <span className="text-white font-bold text-xl">M</span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {
              role == "House Keeping" && admin == null ?
                <button onClick={() => {
                  localStorage.setItem('role', "");
                  localStorage.setItem('username', "");
                  navigotor("/")
                }}>
                  Logout
                </button>
                :
                navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <item.icon size={20} />
                    {sidebarOpen && <span>{item.label}</span>}
                  </NavLink>
                ))
            }
            <button onClick={() => {
              localStorage.setItem('role', "");
              localStorage.setItem('username', "");
              navigotor("/")
            }}>
              Logout
            </button>
          </nav>

          {/* Toggle Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <TrendingUp size={18} className={`transform transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
              {sidebarOpen && <span className="text-sm">Collapse</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Mortuary Management System</h2>
              <p className="text-sm text-gray-500">MOSC Medical College, Kolenchery</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  )
}