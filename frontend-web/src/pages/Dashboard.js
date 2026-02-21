import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, DollarSign, FileText, TrendingUp, Clock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayConsultations: 0,
    totalPatients: 0,
    pendingConsultations: 0,
    todayRevenue: 0,
    recentConsultations: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, trend }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-full ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your overview for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Calendar}
          title="Today's Consultations"
          value={stats.todayConsultations}
          color="bg-blue-600"
          trend="+12% from yesterday"
        />
        <StatCard
          icon={Users}
          title="Total Patients"
          value={stats.totalPatients}
          color="bg-green-600"
          trend="+5 new this week"
        />
        <StatCard
          icon={Clock}
          title="Pending"
          value={stats.pendingConsultations}
          color="bg-orange-600"
        />
        <StatCard
          icon={DollarSign}
          title="Today's Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          color="bg-purple-600"
        />
      </div>

      {/* Recent Consultations */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Consultations</h2>
            <button
              onClick={() => navigate('/patients')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {stats.recentConsultations && stats.recentConsultations.length > 0 ? (
            stats.recentConsultations.map((consultation) => (
              <div
                key={consultation.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => navigate(`/consultation/${consultation.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {consultation.patient?.name?.charAt(0) || 'P'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {consultation.patient?.name || 'Unknown Patient'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {consultation.patient?.age} years • {consultation.patient?.gender}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {consultation.chiefComplaint || 'No complaint recorded'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {new Date(consultation.consultationDate).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                        consultation.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {consultation.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No consultations yet today</p>
              <button
                onClick={() => navigate('/patients')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Consultation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <button
          onClick={() => navigate('/patients')}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
        >
          <Users className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900">View Patients</h3>
          <p className="text-sm text-gray-600 mt-1">Manage patient records</p>
        </button>

        <button
          onClick={() => navigate('/patients')}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
        >
          <Calendar className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900">New Consultation</h3>
          <p className="text-sm text-gray-600 mt-1">Start a new consultation</p>
        </button>

        <button
          onClick={() => navigate('/analytics')}
          className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition text-left"
        >
          <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900">Analytics</h3>
          <p className="text-sm text-gray-600 mt-1">View detailed reports</p>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;