'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheckCircle, FiCalendar, FiClock, FiXCircle } from 'react-icons/fi';
import DataTable, { Column } from '@/components/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/lib/storeConfig';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StaffDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { adminToken } = useAuth();
  
  const [attendance, setAttendance] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'attendance' | 'tasks'>('attendance');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!adminToken) return;
    
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const [attendanceRes, tasksRes] = await Promise.all([
          fetch(buildApiUrl(`/api/superadmin/staff/${id}/attendance`), {
            headers: { Authorization: `Bearer ${adminToken}` }
          }),
          fetch(buildApiUrl(`/api/superadmin/staff/${id}/tasks`), {
            headers: { Authorization: `Bearer ${adminToken}` }
          })
        ]);

        const attJson = await attendanceRes.json();
        const tskJson = await tasksRes.json();

        if (attJson.success) setAttendance(attJson.data);
        if (tskJson.success) setTasks(tskJson.data);
      } catch (err) {
        console.error('Failed to fetch staff details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, adminToken]);

  // Task Columns
  const taskColumns: Column[] = [
    { key: 'title', label: 'Task Title' },
    { key: 'scheduledDate', label: 'Scheduled Date' },
    { 
      key: 'workType', 
      label: 'Work Type',
      render: (val: string) => (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          {val ? String(val).replace('_', ' ').toUpperCase() : 'N/A'}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (val: string) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
          val === 'done' ? 'bg-green-50 text-green-700' : 
          val === 'in_progress' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {val ? String(val).replace('_', ' ').toUpperCase() : 'UNKNOWN'}
        </span>
      )
    }
  ];

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Headers
    const headers = weekDays.map(day => (
      <div key={day} className="text-center font-bold text-gray-500 py-2 text-sm">{day}</div>
    ));

    // Empty slots before 1st day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="bg-gray-50/50 p-2 min-h-[80px] rounded-lg border border-transparent"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = attendance.find(a => a.date === dateStr);
      
      let statusColor = 'bg-gray-50 hover:bg-gray-100 text-gray-400';
      let statusText = 'No Record';

      if (record) {
        switch (record.status) {
          case 'present':
            statusColor = 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200';
            statusText = 'Present';
            break;
          case 'absent':
            statusColor = 'bg-red-100 border-red-200 text-red-800 hover:bg-red-200';
            statusText = 'Absent';
            break;
          case 'half_day':
          case 'leave':
          case 'holiday':
            statusColor = 'bg-yellow-100 border-yellow-200 text-yellow-800 hover:bg-yellow-200';
            statusText = record.status.replace('_', ' ');
            break;
        }
      } else {
        // Check if future date
        const today = new Date();
        const calDate = new Date(year, month, day);
        if (calDate > today) {
          statusColor = 'bg-white border-dashed text-gray-300';
          statusText = '';
        }
      }

      days.push(
        <div key={day} className={`p-3 min-h-[80px] rounded-xl border flex flex-col justify-between transition-colors cursor-default ${statusColor}`}>
          <span className="font-bold text-lg opacity-80">{day}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{statusText}</span>
        </div>
      );
    }

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            &larr; Prev
          </button>
          <h3 className="text-xl font-bold text-gray-800">
            {currentDate.toLocaleString('default', { month: 'long' })} {year}
          </h3>
          <button 
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Next &rarr;
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {headers}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>
      </div>
    );
  };

  // Stats (filtered by selected month)
  const currentMonthAttendance = attendance.filter(a => {
    if (!a.date) return false;
    const [y, m] = a.date.split('-');
    return parseInt(y, 10) === currentDate.getFullYear() && parseInt(m, 10) === currentDate.getMonth() + 1;
  });

  const totalRecords = currentMonthAttendance.length;
  const presentDays = currentMonthAttendance.filter(a => a.status === 'present').length;
  const absentDays = currentMonthAttendance.filter(a => a.status === 'absent').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/superadmin?page=manage-staff')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <FiArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="font-playfair text-3xl text-gray-900">Staff Details</h1>
          <p className="font-montserrat text-sm text-gray-500">
            View attendance and daily tasks for staff member
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading details...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs Header */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 font-medium transition-colors ${
                activeTab === 'attendance'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiCalendar className="w-5 h-5" />
              Attendance Records
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 font-medium transition-colors ${
                activeTab === 'tasks'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiCheckCircle className="w-5 h-5" />
              Assigned Tasks
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'attendance' && (
              <div className="animate-in fade-in duration-300">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                      <FiClock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-600 mb-1">Total Records</p>
                      <h3 className="text-3xl font-bold text-blue-900">{totalRecords}</h3>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600">
                      <FiCheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600 mb-1">Present</p>
                      <h3 className="text-3xl font-bold text-green-900">{presentDays}</h3>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-lg text-red-600">
                      <FiXCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-600 mb-1">Absent</p>
                      <h3 className="text-3xl font-bold text-red-900">{absentDays}</h3>
                    </div>
                  </div>
                </div>

                {/* Calendar */}
                {renderCalendar()}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="animate-in fade-in duration-300">
                <DataTable 
                  columns={taskColumns} 
                  data={tasks} 
                  actions={false} 
                  selectable={false} 
                />
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
