import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiSearch,
  HiFilter,
  HiEye,
  HiCalendar,
} from 'react-icons/hi';
import { fetchTasks, deleteTask, updateTaskStatus } from '../../store/slices/taskSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import { DashboardLayout } from '../../components/layout';
import {
  Button,
  Spinner,
  Badge,
  Pagination,
  EmptyState,
  ConfirmDialog,
  Input,
  Select,
} from '../../components/common';
import TaskFormModal from './TaskFormModal';
import toast from 'react-hot-toast';

const TasksPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tasks, pagination, loading } = useSelector((state) => state.tasks);
  const { projects } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, task: null });
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    projectId: searchParams.get('projectId') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 10,
  });

  useEffect(() => {
    // Fetch projects for filter dropdown
    dispatch(fetchProjects({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    loadTasks();
  }, [filters.page, filters.status, filters.priority, filters.projectId]);

  const loadTasks = () => {
    const params = {
      page: filters.page,
      limit: filters.limit,
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.projectId && { projectId: filters.projectId }),
    };
    dispatch(fetchTasks(params));

    // Update URL params
    const newParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
    });
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadTasks();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteTask(deleteConfirm.task.id)).unwrap();
      toast.success('Task deleted successfully');
      setDeleteConfirm({ isOpen: false, task: null });
    } catch (error) {
      toast.error(error || 'Failed to delete task');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await dispatch(updateTaskStatus({ id: task.id, status: newStatus })).unwrap();
      toast.success('Task status updated');
    } catch (error) {
      toast.error(error || 'Failed to update status');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    loadTasks();
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      todo: 'default',
      'in-progress': 'info',
      review: 'warning',
      done: 'success',
    };
    return variants[status] || 'default';
  };

  const getPriorityBadgeVariant = (priority) => {
    const variants = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      urgent: 'danger',
    };
    return variants[priority] || 'default';
  };

  const canManageTask = (task) => {
    return (
      user?.role === 'admin' ||
      task.project?.managerId === user?.id ||
      task.assigneeId === user?.id
    );
  };

  const canDeleteTask = (task) => {
    return user?.role === 'admin' || task.project?.managerId === user?.id;
  };

  const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'done') return false;
    return new Date(task.dueDate) < new Date();
  };

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-500 mt-1">Manage and track your tasks</p>
          </div>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Button onClick={() => setIsModalOpen(true)}>
              <HiPlus className="w-5 h-5 mr-2" />
              New Task
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.projectId}
              onChange={(e) => handleFilterChange('projectId', e.target.value)}
              options={projectOptions}
              placeholder="All Projects"
              className="w-full lg:w-48"
            />
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[
                { value: 'todo', label: 'To Do' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'review', label: 'Review' },
                { value: 'done', label: 'Done' },
              ]}
              placeholder="All Status"
              className="w-full lg:w-36"
            />
            <Select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]}
              placeholder="All Priority"
              className="w-full lg:w-36"
            />
            <Button type="submit" variant="secondary">
              <HiFilter className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </form>
        </div>

        {/* Tasks Table */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Task</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Project</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Status</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Priority</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Assignee</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Due Date</th>
                    <th className="text-right py-4 px-6 font-semibold text-gray-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...Array(8)].map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-6">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-48"></div>
                          <div className="h-3 bg-gray-200 rounded w-64"></div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="ml-2 h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end gap-2">
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : tasks.length > 0 ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">
                        Task
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">
                        Project
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">
                        Priority
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">
                        Assignee
                      </th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">
                        Due Date
                      </th>
                      <th className="text-right py-4 px-6 font-semibold text-gray-600 text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <Link
                              to={`/tasks/${task.id}`}
                              className="font-medium text-gray-900 hover:text-primary-600"
                            >
                              {task.title}
                            </Link>
                            {task.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Link
                            to={`/projects/${task.project?.id}`}
                            className="text-sm text-gray-600 hover:text-primary-600"
                          >
                            {task.project?.name}
                          </Link>
                        </td>
                        <td className="py-4 px-6">
                          {canManageTask(task) ? (
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task, e.target.value)}
                              className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer
                                ${task.status === 'todo' ? 'bg-gray-100 text-gray-700' : ''}
                                ${task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : ''}
                                ${task.status === 'review' ? 'bg-yellow-100 text-yellow-700' : ''}
                                ${task.status === 'done' ? 'bg-green-100 text-green-700' : ''}
                              `}
                            >
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="review">Review</option>
                              <option value="done">Done</option>
                            </select>
                          ) : (
                            <Badge variant={getStatusBadgeVariant(task.status)}>
                              {task.status.replace('-', ' ')}
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <Badge variant={getPriorityBadgeVariant(task.priority)}>
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-2">
                              <span className="text-xs font-medium text-gray-600">
                                {task.assignee?.firstName?.[0]}{task.assignee?.lastName?.[0]}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {task.assignee?.firstName} {task.assignee?.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {task.dueDate ? (
                            <div className={`flex items-center text-sm ${isOverdue(task) ? 'text-red-600' : 'text-gray-600'}`}>
                              <HiCalendar className="w-4 h-4 mr-1" />
                              {new Date(task.dueDate).toLocaleDateString()}
                              {isOverdue(task) && (
                                <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                  Overdue
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">No due date</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/tasks/${task.id}`}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <HiEye className="w-5 h-5" />
                            </Link>
                            {canManageTask(task) && (
                              <button
                                onClick={() => handleEdit(task)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              >
                                <HiPencil className="w-5 h-5" />
                              </button>
                            )}
                            {canDeleteTask(task) && (
                              <button
                                onClick={() => setDeleteConfirm({ isOpen: true, task })}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <HiTrash className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <EmptyState
              title="No tasks found"
              description={
                user?.role === 'user'
                  ? "You haven't been assigned any tasks yet."
                  : 'Get started by creating your first task.'
              }
              action={
                (user?.role === 'admin' || user?.role === 'manager') && (
                  <Button onClick={() => setIsModalOpen(true)}>
                    <HiPlus className="w-5 h-5 mr-2" />
                    Create Task
                  </Button>
                )
              }
            />
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        task={editingTask}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, task: null })}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteConfirm.task?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={loading}
      />
    </DashboardLayout>
  );
};

export default TasksPage;
