import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import {
  Users, Bed, Receipt, LogOut, Clock, ShieldAlert,
  Activity, AlertTriangle, CheckSquare, Sparkles, TrendingUp,
  UserPlus, ArrowRight, ArrowUpDown, UserCheck
} from 'lucide-react';

const API_BASE = '/api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [cabins, setCabins] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  // Sorting state for occupied cabins table
  const [sortConfig, setSortConfig] = useState({ key: 'cabinNumber', direction: 'asc' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, cabinsRes, allocsRes, tasksRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard/stats`).catch(() => ({ data: null })),
        axios.get(`${API_BASE}/cabins`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/cabin-allocations`).catch(() => ({ data: [] })),
        axios.get(`${API_BASE}/housekeeping/tasks`).catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data);
      setCabins(cabinsRes.data);
      setAllocations(allocsRes.data);
      setTasks(tasksRes.data);

      // Fetch pending registration count
      try {
        const usersRes = await axios.get(`${API_BASE}/admin/users`, {
          headers: { 'x-admin-role': 'Admin' }
        });
        const pending = (usersRes.data || []).filter(u => u.approval_status === 'pending').length;
        setPendingUsersCount(pending);
      } catch { /* non-critical */ }

    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Process stats & counts
  const computedMetrics = useMemo(() => {
    const total = cabins.filter(c => c.status !== 'Deactivated').length || 10;
    const occupied = cabins.filter(c => c.status === 'Occupied').length;
    const cleaning = cabins.filter(c => c.status === 'NEEDS_CLEANING').length;
    const maintenance = cabins.filter(c => c.status === 'Under Maintenance').length;
    const available = cabins.filter(c => c.status === 'Available').length;
    
    // Housekeeping tasks
    const pendingTasks = tasks.filter(t => t.status === 'PENDING').length;
    const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completedTasksToday = tasks.filter(t => t.status === 'VERIFIED' || t.status === 'COMPLETED').length;

    const occupancyRate = total > 0 ? ((occupied / total) * 100) : 0;

    return {
      total,
      occupied,
      cleaning,
      maintenance,
      available,
      pendingTasks,
      inProgressTasks,
      completedTasksToday,
      occupancyRate
    };
  }, [cabins, tasks]);

  // 2. Format dates & times
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 3. Format stay durations
  const getStayDuration = (admissionDateTime) => {
    if (!admissionDateTime) return '—';
    const diff = new Date() - new Date(admissionDateTime);
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ${hrs % 24}h`;
    return `${hrs}h`;
  };

  // 4. Concat cabin allocations mapping
  const cabinMatrixData = useMemo(() => {
    return cabins.filter(c => c.status !== 'Deactivated').map(cabin => {
      // Find active allocation for this cabin
      const activeAlloc = allocations.find(a => a.cabinId === cabin.id && a.status === 'Allocated');
      // Find active housekeeping task for this cabin
      const cabinTask = tasks.find(t => t.cabinId === cabin.id && t.status !== 'VERIFIED');

      return {
        ...cabin,
        allocation: activeAlloc || null,
        task: cabinTask || null
      };
    });
  }, [cabins, allocations, tasks]);

  // 5. Currently occupied cabins list
  const occupiedCabinsList = useMemo(() => {
    const list = cabinMatrixData.filter(c => c.status === 'Occupied' && c.allocation);
    
    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'patientName' || sortConfig.key === 'bodyNumber') {
          aVal = a.allocation?.[sortConfig.key] || '';
          bVal = b.allocation?.[sortConfig.key] || '';
        } else if (sortConfig.key === 'admissionDateTime') {
          aVal = a.allocation?.admissionDateTime ? new Date(a.allocation.admissionDateTime) : 0;
          bVal = b.allocation?.admissionDateTime ? new Date(b.allocation.admissionDateTime) : 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [cabinMatrixData, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 6. Chart data
  const donutChartData = [
    { name: 'Available', value: computedMetrics.available, color: '#10b981' },
    { name: 'Occupied', value: computedMetrics.occupied, color: '#ef4444' },
    { name: 'Cleaning', value: computedMetrics.cleaning, color: '#f59e0b' },
    { name: 'Maintenance', value: computedMetrics.maintenance, color: '#6b7280' }
  ].filter(d => d.value > 0);

  // 7. Live Insights Generator
  const liveInsights = useMemo(() => {
    const list = [];
    if (computedMetrics.occupancyRate >= 80) {
      list.push({
        type: 'warning',
        text: `High occupancy warning: Control center reports ${computedMetrics.occupancyRate.toFixed(0)}% capacity. Consider prep-allocating freezers.`
      });
    } else {
      list.push({
        type: 'info',
        text: `Mortuary stay capacity is stable at ${computedMetrics.occupancyRate.toFixed(0)}% occupancy.`
      });
    }

    if (computedMetrics.pendingTasks > 0) {
      list.push({
        type: 'alert',
        text: `${computedMetrics.pendingTasks} cabins are pending housekeeping attention. Cleaning turnaround is key to new registrations.`
      });
    }

    // Check allocations expected to release today
    const releasesToday = allocations.filter(a => {
      if (a.status !== 'Allocated' || !a.estimatedReleaseDateTime) return false;
      const date = new Date(a.estimatedReleaseDateTime);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    }).length;

    if (releasesToday > 0) {
      list.push({
        type: 'success',
        text: `${releasesToday} cabin allocations are scheduled for release today. Coordinate billing files.`
      });
    }

    const pendingBillsCount = stats?.pendingBills || 0;
    if (pendingBillsCount > 3) {
      list.push({
        type: 'billing',
        text: `Billing action required: ${pendingBillsCount} pending invoices are outstanding. Coordinate with financial services.`
      });
    }

    return list;
  }, [computedMetrics, allocations, stats]);

  // 8. Generate Activity Feed
  const recentActivity = useMemo(() => {
    const items = [];
    
    // Add allocations
    allocations.forEach(a => {
      items.push({
        time: new Date(a.createdAt || a.admissionDateTime),
        action: 'Cabin Allocated',
        user: 'System Registrar',
        ref: a.bodyNumber || 'Allocation',
        detail: `Allocated to Cabin ${a.cabinNumber}`
      });
    });

    // Add recent bodies from stats
    if (stats?.recentBodies) {
      stats.recentBodies.forEach(b => {
        items.push({
          time: new Date(b.createdAt),
          action: 'Body Registered',
          user: 'M Staff Desk',
          ref: b.bodyNumber,
          detail: `Patient: ${b.patientName || 'Unknown'} (${b.bodyType})`
        });
      });
    }

    // Sort newest first, limit to 6
    return items.sort((a, b) => b.time - a.time).slice(0, 6);
  }, [allocations, stats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-slate-50/50">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <span className="text-sm font-semibold text-slate-600 mt-4 animate-pulse">
          Loading Admin Command Center Dashboard...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 bg-slate-50/30">
      
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wider uppercase bg-blue-50 px-2.5 py-1 rounded-full w-fit mb-1.5">
            <Activity size={12} className="animate-pulse" /> Admin Operations Control Center
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            MOSC Medical College Command Center • System configuration and live resource tracking
          </p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="btn-primary flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-200"
        >
          <Sparkles size={16} /> Sync Live Data
        </button>
      </div>

      {/* SECTION 1: Executive KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { label: 'Total Bodies', val: stats?.totalBodies || 0, icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'Active Stay', val: computedMetrics.occupied, icon: Bed, color: 'text-red-600 bg-red-50 border-red-100' },
          { label: 'Cabins Avail', val: computedMetrics.available, icon: CheckSquare, color: 'text-green-600 bg-green-50 border-green-100' },
          { label: 'Needs Clean', val: computedMetrics.cleaning, icon: Clock, color: 'text-amber-500 bg-amber-50 border-amber-100' },
          { label: 'Maintenance', val: computedMetrics.maintenance, icon: ShieldAlert, color: 'text-slate-500 bg-slate-100 border-slate-200' },
          { label: 'Pending Bills', val: stats?.pendingBills || 0, icon: Receipt, color: 'text-purple-600 bg-purple-50 border-purple-100' },
          { label: 'Released Today', val: stats?.releasedToday || 0, icon: LogOut, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Occupancy %', val: `${computedMetrics.occupancyRate.toFixed(0)}%`, icon: TrendingUp, color: 'text-sky-600 bg-sky-50 border-sky-100' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white border rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 leading-tight">{kpi.label}</span>
              <div className={`${kpi.color.split(' ')[1]} p-1.5 rounded-lg border`}>
                <kpi.icon className={kpi.color.split(' ')[0]} size={14} />
              </div>
            </div>
            <div className="text-lg font-bold text-slate-900 leading-none">{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* Primary Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Live Matrix Grid & Stay Log (occupies 2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECTION 2: Live Cabin Status Matrix */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Live Cabin Status Grid</h2>
                <p className="text-xs text-slate-500">Real-time status overview of active containment cabins</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[10px] font-semibold bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full">Available</span>
                <span className="text-[10px] font-semibold bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded-full">Occupied</span>
                <span className="text-[10px] font-semibold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full">Cleaning</span>
                <span className="text-[10px] font-semibold bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Maintenance</span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {cabinMatrixData.map((cabin) => {
                  let statusBg = 'bg-slate-50 border-slate-200 text-slate-700';
                  let badgeBg = 'bg-slate-100 text-slate-700';
                  
                  if (cabin.status === 'Available') {
                    statusBg = 'bg-green-50/60 border-green-200/80 text-green-800';
                    badgeBg = 'bg-green-100 text-green-800';
                  } else if (cabin.status === 'Occupied') {
                    statusBg = 'bg-red-50/60 border-red-200/80 text-red-800';
                    badgeBg = 'bg-red-100 text-red-800';
                  } else if (cabin.status === 'NEEDS_CLEANING') {
                    if (cabin.task?.status === 'IN_PROGRESS') {
                      statusBg = 'bg-orange-50/60 border-orange-200/80 text-orange-800';
                      badgeBg = 'bg-orange-100 text-orange-800';
                    } else {
                      statusBg = 'bg-amber-50/60 border-amber-200/80 text-amber-800';
                      badgeBg = 'bg-amber-100 text-amber-800';
                    }
                  } else if (cabin.status === 'Under Maintenance') {
                    statusBg = 'bg-slate-50 border-slate-300 text-slate-600';
                    badgeBg = 'bg-slate-200 text-slate-600';
                  }

                  const expectedReleaseStr = cabin.allocation?.estimatedReleaseDateTime 
                    ? new Date(cabin.allocation.estimatedReleaseDateTime).toLocaleDateString('en-IN') 
                    : null;

                  return (
                    <div 
                      key={cabin.id} 
                      className={`border rounded-xl p-4 flex flex-col justify-between min-h-[145px] transition-all hover:shadow-md ${statusBg}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-sm tracking-tight">{cabin.cabinNumber}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badgeBg}`}>
                            {cabin.status === 'NEEDS_CLEANING' && cabin.task?.status === 'IN_PROGRESS' 
                              ? 'CLEANING IN PROGRESS' 
                              : cabin.status}
                          </span>
                        </div>
                        
                        {cabin.status === 'Occupied' && cabin.allocation ? (
                          <div className="space-y-1 mt-2">
                            <p className="text-xs font-bold truncate">{cabin.allocation.patientName || 'Unknown'}</p>
                            <p className="text-[10px] opacity-75 truncate">{cabin.allocation.bodyNumber}</p>
                          </div>
                        ) : cabin.status === 'NEEDS_CLEANING' ? (
                          <div className="text-[10px] opacity-85 mt-2">
                            {cabin.task?.status === 'IN_PROGRESS' 
                              ? `Assigned: ${cabin.task.assignedTo || 'Staff'}` 
                              : 'Pending clean assignation'}
                          </div>
                        ) : (
                          <div className="text-[10px] opacity-75 mt-2">
                            Type: {cabin.cabin_type === 'FREEZER' ? 'Freezer' : 'Normal'} • Flr {cabin.floor}
                          </div>
                        )}
                      </div>

                      {cabin.status === 'Occupied' && cabin.allocation && (
                        <div className="mt-3 pt-2 border-t border-red-100 flex items-center justify-between text-[9px] opacity-75">
                          <span>In: {new Date(cabin.allocation.admissionDateTime).toLocaleDateString('en-IN')}</span>
                          {expectedReleaseStr && <span>Out: {expectedReleaseStr}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 5: Currently Occupied Cabins */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Occupied Cabins Stay Log</h2>
                <p className="text-xs text-slate-500">Currently admitted bodies and active cabin allocations</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                    <th className="px-6 py-3 cursor-pointer select-none" onClick={() => requestSort('cabinNumber')}>
                      Cabin <ArrowUpDown size={12} className="inline ml-1 opacity-70" />
                    </th>
                    <th className="px-6 py-3 cursor-pointer select-none" onClick={() => requestSort('bodyNumber')}>
                      Body Number <ArrowUpDown size={12} className="inline ml-1 opacity-70" />
                    </th>
                    <th className="px-6 py-3 cursor-pointer select-none" onClick={() => requestSort('patientName')}>
                      Occupant Name <ArrowUpDown size={12} className="inline ml-1 opacity-70" />
                    </th>
                    <th className="px-6 py-3 cursor-pointer select-none" onClick={() => requestSort('admissionDateTime')}>
                      Admission Date/Time <ArrowUpDown size={12} className="inline ml-1 opacity-70" />
                    </th>
                    <th className="px-6 py-3">Est. Release</th>
                    <th className="px-6 py-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {occupiedCabinsList.length > 0 ? (
                    occupiedCabinsList.map((cabin) => (
                      <tr key={cabin.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">{cabin.cabinNumber}</td>
                        <td className="px-6 py-4 font-medium text-blue-600">{cabin.allocation?.bodyNumber}</td>
                        <td className="px-6 py-4 font-semibold">{cabin.allocation?.patientName || 'N/A'}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatDateTime(cabin.allocation?.admissionDateTime)}
                        </td>
                        <td className="px-6 py-4 text-orange-600 font-medium">
                          {formatDateTime(cabin.allocation?.estimatedReleaseDateTime)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {getStayDuration(cabin.allocation?.admissionDateTime)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-slate-400">
                        No cabins currently occupied.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        {/* Right Column: Quick Actions, Capacity Analytics, System Info & Feed (occupies 1 col on desktop) */}
        <div className="space-y-8">
          
          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Quick Actions</h2>
              <p className="text-xs text-slate-500">Direct links to primary registration flow routes</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Link to="/dashboard/body-registration" className="group flex items-center justify-between p-3.5 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Register New Body</p>
                    <p className="text-[10px] text-slate-500">Admit new body entry</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/dashboard/cabin-allocation" className="group flex items-center justify-between p-3.5 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform">
                    <Bed size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Allocate Cabin</p>
                    <p className="text-[10px] text-slate-500">Assign cabin space</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/dashboard/billing" className="group flex items-center justify-between p-3.5 bg-purple-50/50 hover:bg-purple-50 border border-purple-100 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600 group-hover:scale-110 transition-transform">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Generate Invoicing</p>
                    <p className="text-[10px] text-slate-500">Create stay invoice bills</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/dashboard/user-approvals" className="group flex items-center justify-between p-3.5 bg-amber-50/50 hover:bg-amber-50 border border-amber-100 rounded-xl transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600 group-hover:scale-110 transition-transform">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">User Approvals</p>
                    <p className="text-[10px] text-slate-500">Review staff registrations</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pendingUsersCount > 0 && (
                    <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full animate-pulse">
                      {pendingUsersCount}
                    </span>
                  )}
                  <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            </div>
          </div>

          {/* SECTION 3: Cabin Occupancy Analytics */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-800">Capacity Analytics</h2>
              <p className="text-xs text-slate-500 font-medium">Mortuary capacity allocation metrics</p>
            </div>

            {/* Donut Chart */}
            <div className="flex justify-center h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Cabins`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Occupancy Legend Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { name: 'Available', val: computedMetrics.available, pct: (computedMetrics.available / computedMetrics.total) * 100, color: 'bg-green-500' },
                { name: 'Occupied', val: computedMetrics.occupied, pct: (computedMetrics.occupied / computedMetrics.total) * 100, color: 'bg-red-500' },
                { name: 'Cleaning', val: computedMetrics.cleaning, pct: (computedMetrics.cleaning / computedMetrics.total) * 100, color: 'bg-amber-500' },
                { name: 'Maintenance', val: computedMetrics.maintenance, pct: (computedMetrics.maintenance / computedMetrics.total) * 100, color: 'bg-gray-500' }
              ].map((item, i) => (
                <div key={i} className="border border-slate-100 rounded-lg p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.val} ({item.pct.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Information Panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">System Information</h2>
              <p className="text-xs text-slate-500 font-medium">Instance parameters and server environment</p>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-500 font-medium">Facility</span>
                <span className="font-bold text-slate-800">MOSC Medical College</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-500 font-medium">Location</span>
                <span className="font-bold text-slate-800">Kolenchery, IN</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-500 font-medium">Total System Capacity</span>
                <span className="font-bold text-slate-800">{computedMetrics.total} Cabins</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-500 font-medium">Instance Occupancy</span>
                <span className="font-bold text-slate-800">{computedMetrics.occupancyRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-500 font-medium">Server API Status</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Operational
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 7: Operational Insights Panel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Operational Insights</h2>
              <p className="text-xs text-slate-500">Live operational alerts generated by command center intelligence</p>
            </div>
            
            <div className="space-y-3">
              {liveInsights.map((insight, i) => {
                let alertColor = 'bg-blue-50/50 text-blue-800 border-blue-100';
                if (insight.type === 'warning') alertColor = 'bg-red-50/50 text-red-800 border-red-100';
                if (insight.type === 'alert') alertColor = 'bg-amber-50/50 text-amber-800 border-amber-100';
                if (insight.type === 'success') alertColor = 'bg-emerald-50/50 text-emerald-800 border-emerald-100';
                if (insight.type === 'billing') alertColor = 'bg-purple-50/50 text-purple-800 border-purple-100';

                return (
                  <div key={i} className={`p-3.5 border rounded-xl flex gap-3 text-xs leading-relaxed ${alertColor}`}>
                    <Activity size={16} className="shrink-0 mt-0.5 animate-pulse" />
                    <span className="font-semibold">{insight.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 6: Recent Activity Feed */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Recent Operational Logs</h2>
              <p className="text-xs text-slate-500 font-medium">Newest operational transactions listed first</p>
            </div>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivity.map((act, i) => (
                  <li key={i}>
                    <div className="relative pb-6">
                      {i !== recentActivity.length - 1 && (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                            <Activity size={12} className="text-blue-600" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-800 flex justify-between">
                            <span>{act.action}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {act.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{act.detail}</p>
                          <div className="text-[9px] text-slate-400 mt-1">
                            Ref: <strong className="text-slate-600">{act.ref}</strong> • Op: {act.user}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

      </div>

      {/* SECTION 4: Housekeeping Command Center */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Housekeeping Command Center</h2>
            <p className="text-xs text-slate-500">Monitor cabin sanitization workflows and cleaning assignments</p>
          </div>
          <div className="flex gap-4 text-xs font-bold">
            <span className="text-slate-600">Pending: <strong className="text-amber-600">{computedMetrics.pendingTasks}</strong></span>
            <span className="text-slate-600">In Progress: <strong className="text-blue-600">{computedMetrics.inProgressTasks}</strong></span>
            <span className="text-slate-600">Completed Today: <strong className="text-green-600">{computedMetrics.completedTasksToday}</strong></span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <th className="px-6 py-3">Cabin</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Assigned Staff</th>
                <th className="px-6 py-3">Task Created Time</th>
                <th className="px-6 py-3">Last Action Time</th>
                <th className="px-6 py-3">SLA Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {tasks.filter(t => t.status !== 'VERIFIED').length > 0 ? (
                tasks.filter(t => t.status !== 'VERIFIED').map((task) => {
                  const createdDate = new Date(task.createdAt);
                  const isOverdue = task.status === 'PENDING' && (new Date() - createdDate > 1000 * 60 * 60 * 2); // 2 hours overdue

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-900">{task.cabinNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`status-badge ${
                          task.status === 'IN_PROGRESS' 
                            ? 'bg-blue-100 text-blue-700 border-blue-200' 
                            : task.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">{task.assignedTo || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDateTime(task.createdAt)}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDateTime(task.updatedAt)}</td>
                      <td className="px-6 py-4">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase animate-pulse">
                            <AlertTriangle size={10} /> SLA OVERDUE (&gt;2h)
                          </span>
                        ) : (
                          <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            WITHIN SLA
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                    No active cleaning tasks required. All cabins clean and sterilized.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default AdminDashboard;
