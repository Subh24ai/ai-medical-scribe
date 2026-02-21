import React, { useEffect, useState } from 'react';
import { BarChart, LineChart, Users, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalConsultations: 0,
    totalPatients: 0,
    averagePerConsultation: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load analytics');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics & Reports</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`₹${stats.totalRevenue?.toLocaleString() || 0}`}
          subtitle="All time"
          color="bg-green-600"
        />
        <StatCard
          icon={Calendar}
          title="Total Consultations"
          value={stats.totalConsultations || 0}
          subtitle="All time"
          color="bg-blue-600"
        />
        <StatCard
          icon={Users}
          title="Total Patients"
          value={stats.totalPatients || 0}
          subtitle="Registered"
          color="bg-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          title="Avg per Consultation"
          value={`₹${stats.averagePerConsultation || 0}`}
          subtitle="Revenue"
          color="bg-orange-600"
        />
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
            <div className="text-center">
              <BarChart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Chart placeholder</p>
              <p className="text-sm text-gray-400">Install recharts for visualization</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Growth</h2>
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
            <div className="text-center">
              <LineChart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Chart placeholder</p>
              <p className="text-sm text-gray-400">Install recharts for visualization</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;