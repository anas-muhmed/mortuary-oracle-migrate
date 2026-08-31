import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ClipboardList,
  CheckCircle,
  Clock,
  UserPlus,
  RefreshCw
} from 'lucide-react';

const API_BASE = '/api';

function HousekeepingDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningTask, setAssigningTask] = useState(null);
  const [staffName, setStaffName] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/housekeeping/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!staffName || !assigningTask) return;
    try {
      await axios.post(`${API_BASE}/housekeeping/assign`, {
        taskId: assigningTask,
        staffName
      });
      setAssigningTask(null);
      setStaffName('');
      fetchTasks();
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await axios.post(`${API_BASE}/housekeeping/complete`, { taskId });
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleVerify = async (taskId) => {
    if (!window.confirm("Verify this cabin is clean and mark it Available?")) return;
    try {
      await axios.post(`${API_BASE}/housekeeping/verify`, { taskId });
      fetchTasks();
    } catch (error) {
      console.error('Error verifying task:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'VERIFIED':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const PENDING = tasks.filter(t => t.status === 'PENDING');
  const IN_PROGRESS = tasks.filter(t => t.status === 'IN_PROGRESS');
  const COMPLETED = tasks.filter(t => t.status === 'COMPLETED');
  const VERIFIED = tasks.filter(t => t.status === 'VERIFIED');

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Housekeeping Dashboard</h1>
          <p className="text-gray-500">Manage cabin cleaning workflows</p>
        </div>
        <button
          onClick={fetchTasks}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Status columns or stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{PENDING.length}</p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-full">
            <ClipboardList className="text-yellow-500" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">In Progress</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{IN_PROGRESS.length}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full">
            <Clock className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Awaiting Verify</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{COMPLETED.length}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-full">
            <CheckCircle className="text-purple-500" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Verified</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{VERIFIED.length}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-full">
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Task Queue</h2>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No active housekeeping tasks.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cabin Number</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Staff</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{task.cabinNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${task.assignedTo ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                        {task.assignedTo || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(task.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">

                      {task.status === 'PENDING' && (
                        <button
                          onClick={() => setAssigningTask(task.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1 ml-auto"
                        >
                          <UserPlus size={16} /> Assign
                        </button>
                      )}

                      {task.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleComplete(task.id)}
                          className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs rounded-md shadow-sm transition-colors ml-auto"
                        >
                          Mark Complete
                        </button>
                      )}

                      {task.status === 'COMPLETED' && (
                        <button
                          onClick={() => handleVerify(task.id)}
                          className="text-white bg-purple-600 hover:bg-purple-700 px-3 py-1 text-xs rounded-md shadow-sm transition-colors ml-auto"
                        >
                          Verify & Release
                        </button>
                      )}

                      {task.status === 'VERIFIED' && (
                        <span className="text-gray-400 text-xs flex items-center justify-end gap-1">
                          <CheckCircle size={14} /> Done
                        </span>
                      )}

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {assigningTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Assign Housekeeping Staff</h3>
              <button onClick={() => setAssigningTask(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handleAssign} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff Name
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAssigningTask(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HousekeepingDashboard;
