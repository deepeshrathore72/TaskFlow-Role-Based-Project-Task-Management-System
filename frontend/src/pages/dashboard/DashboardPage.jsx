import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  HiUsers,
  HiFolder,
  HiClipboardList,
  HiClock,
  HiCheckCircle,
  HiExclamationCircle,
  HiTrendingUp,
} from 'react-icons/hi';
import { fetchDashboardStats, fetchRecentActivity } from '../../store/slices/dashboardSlice';
import { Spinner, Badge } from '../../components/common';
import { DashboardLayout } from '../../components/layout';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

const TaskStatusChart = ({ tasksByStatus }) => {
  const statuses = [
    { key: 'todo', label: 'To Do', color: 'bg-gray-400' },
    { key: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
    { key: 'review', label: 'Review', color: 'bg-yellow-500' },
    { key: 'done', label: 'Done', color: 'bg-green-500' },
  ];

  const total = Object.values(tasksByStatus || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks Overview</h3>
      <div className="space-y-4">
        {statuses.map((status) => {
          const count = tasksByStatus?.[status.key] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;

          return (
            <div key={status.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">{status.label}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${status.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RecentActivity = ({ activities }) => {
  const getStatusBadge = (status) => {
    const variants = {
      'todo': 'default',
      'in-progress': 'info',
      'review': 'warning',
      'done': 'success',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      {activities?.length > 0 ? (
        <div className="space-y-4">
          {activities.map((task) => (
            <div key={task.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <HiClipboardList className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                <p className="text-xs text-gray-500">{task.project?.name}</p>
                <div className="flex items-center mt-1 space-x-2">
                  <Badge variant={getStatusBadge(task.status)} size="sm">
                    {task.status.replace('-', ' ')}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {new Date(task.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
      )}
    </div>
  );
};

const AdminDashboard = ({ stats, recentActivity }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Users"
        value={stats?.totalUsers || 0}
        icon={HiUsers}
        color="blue"
        subtitle={`${stats?.activeUsers || 0} active`}
      />
      <StatCard
        title="Total Projects"
        value={stats?.totalProjects || 0}
        icon={HiFolder}
        color="green"
      />
      <StatCard
        title="Total Tasks"
        value={stats?.totalTasks || 0}
        icon={HiClipboardList}
        color="purple"
      />
      <StatCard
        title="Completed Tasks"
        value={stats?.tasksByStatus?.done || 0}
        icon={HiCheckCircle}
        color="indigo"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TaskStatusChart tasksByStatus={stats?.tasksByStatus} />
      <RecentActivity activities={recentActivity} />
    </div>

    {/* Recent Users */}
    {stats?.recentUsers?.length > 0 && (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
          <Link to="/users" className="text-sm text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                <th className="pb-3">User</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recentUsers.map((user) => (
                <tr key={user.id}>
                  <td className="py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">
                          {user.firstName[0]}{user.lastName[0]}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <Badge variant={user.role === 'admin' ? 'danger' : user.role === 'manager' ? 'info' : 'default'}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

const ManagerDashboard = ({ stats, recentActivity }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Managed Projects"
        value={stats?.managedProjects || 0}
        icon={HiFolder}
        color="blue"
      />
      <StatCard
        title="Total Tasks"
        value={stats?.totalTasks || 0}
        icon={HiClipboardList}
        color="green"
      />
      <StatCard
        title="Team Members"
        value={stats?.teamMembers || 0}
        icon={HiUsers}
        color="purple"
      />
      <StatCard
        title="Overdue Tasks"
        value={stats?.overdueTasks || 0}
        icon={HiExclamationCircle}
        color="red"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TaskStatusChart tasksByStatus={stats?.tasksByStatus} />
      <RecentActivity activities={recentActivity} />
    </div>
  </div>
);

const UserDashboard = ({ stats, recentActivity }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Assigned Tasks"
        value={stats?.assignedTasks || 0}
        icon={HiClipboardList}
        color="blue"
      />
      <StatCard
        title="My Projects"
        value={stats?.memberProjects || 0}
        icon={HiFolder}
        color="green"
      />
      <StatCard
        title="Overdue Tasks"
        value={stats?.overdueTasks || 0}
        icon={HiExclamationCircle}
        color="red"
      />
      <StatCard
        title="Completed This Week"
        value={stats?.completedThisWeek || 0}
        icon={HiTrendingUp}
        color="purple"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TaskStatusChart tasksByStatus={stats?.tasksByStatus} />
      <RecentActivity activities={recentActivity} />
    </div>
  </div>
);

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats, recentActivity, loading } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchRecentActivity({ limit: 5 }));
  }, [dispatch]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard stats={stats} recentActivity={recentActivity} />;
      case 'manager':
        return <ManagerDashboard stats={stats} recentActivity={recentActivity} />;
      default:
        return <UserDashboard stats={stats} recentActivity={recentActivity} />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.firstName}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>

        {loading && !stats ? (
          <div className="space-y-6">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-4">
                  {[...Array(4)].map((_, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-4">
                  {[...Array(5)].map((_, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          renderDashboard()
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
