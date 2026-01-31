import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiArrowLeft,
  HiPencil,
  HiTrash,
  HiClock,
  HiCalendar,
  HiUser,
  HiFolder,
  HiCheckCircle,
  HiExclamation,
} from 'react-icons/hi';
import { fetchTaskById, deleteTask, updateTaskStatus } from '../../store/slices/taskSlice';
import { DashboardLayout } from '../../components/layout';
import { Button, Spinner, Badge, ConfirmDialog, EmptyState, Select } from '../../components/common';
import TaskFormModal from './TaskFormModal';
import toast from 'react-hot-toast';

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTask, loading } = useSelector((state) => state.tasks);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false });

  useEffect(() => {
    if (id) {
      dispatch(fetchTaskById(id));
    }
  }, [id, dispatch]);

  const handleDelete = async () => {
    try {
      await dispatch(deleteTask(id)).unwrap();
      toast.success('Task deleted successfully');
      navigate('/tasks');
    } catch (error) {
      toast.error(error || 'Failed to delete task');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await dispatch(updateTaskStatus({ id, status: newStatus })).unwrap();
      toast.success('Task status updated');
    } catch (error) {
      toast.error(error || 'Failed to update status');
    }
  };

  const canManageTask = () => {
    return (
      currentUser?.role === 'admin' ||
      currentTask?.project?.managerId === currentUser?.id ||
      currentTask?.assigneeId === currentUser?.id
    );
  };

  const canDeleteTask = () => {
    return currentUser?.role === 'admin' || currentTask?.project?.managerId === currentUser?.id;
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

  const isOverdue = () => {
    if (!currentTask?.dueDate || currentTask?.status === 'done') return false;
    return new Date(currentTask.dueDate) < new Date();
  };

  if (loading && !currentTask) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!currentTask) {
    return (
      <DashboardLayout>
        <EmptyState
          title="Task not found"
          description="The task you're looking for doesn't exist or you don't have access to it."
          action={
            <Button onClick={() => navigate('/tasks')}>
              <HiArrowLeft className="w-5 h-5 mr-2" />
              Back to Tasks
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => navigate('/tasks')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
            >
              <HiArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentTask.title}</h1>
              <div className="flex items-center flex-wrap gap-2 mt-2">
                <Badge variant={getStatusBadgeVariant(currentTask.status)}>
                  {currentTask.status.replace('-', ' ')}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(currentTask.priority)}>
                  {currentTask.priority}
                </Badge>
                {isOverdue() && (
                  <Badge variant="danger">Overdue</Badge>
                )}
              </div>
            </div>
          </div>
          {canManageTask() && (
            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
                <HiPencil className="w-5 h-5 mr-2" />
                Edit
              </Button>
              {canDeleteTask() && (
                <Button
                  variant="danger"
                  onClick={() => setDeleteConfirm({ isOpen: true })}
                >
                  <HiTrash className="w-5 h-5 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap">
                {currentTask.description || 'No description provided.'}
              </p>
            </div>

            {/* Status Update */}
            {canManageTask() && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
                <div className="flex flex-wrap gap-3">
                  {['todo', 'in-progress', 'review', 'done'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        currentTask.status === status
                          ? status === 'todo'
                            ? 'bg-gray-700 text-white'
                            : status === 'in-progress'
                            ? 'bg-blue-600 text-white'
                            : status === 'review'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'todo' && 'To Do'}
                      {status === 'in-progress' && 'In Progress'}
                      {status === 'review' && 'Review'}
                      {status === 'done' && 'Done'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Activity/Timeline placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity</h2>
              <div className="text-center text-gray-500 py-8">
                <HiClock className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>Activity tracking coming soon</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              <div className="space-y-4">
                {/* Project */}
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <HiFolder className="w-4 h-4 mr-2" />
                    Project
                  </div>
                  <Link
                    to={`/projects/${currentTask.project?.id}`}
                    className="font-medium text-gray-900 hover:text-primary-600"
                  >
                    {currentTask.project?.name}
                  </Link>
                </div>

                {/* Assignee */}
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <HiUser className="w-4 h-4 mr-2" />
                    Assignee
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                      <span className="text-xs font-medium text-primary-600">
                        {currentTask.assignee?.firstName?.[0]}{currentTask.assignee?.lastName?.[0]}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {currentTask.assignee?.firstName} {currentTask.assignee?.lastName}
                    </span>
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <HiCalendar className="w-4 h-4 mr-2" />
                    Due Date
                  </div>
                  {currentTask.dueDate ? (
                    <span className={`font-medium ${isOverdue() ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(currentTask.dueDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      {isOverdue() && ' (Overdue)'}
                    </span>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>

                {/* Estimated Hours */}
                {currentTask.estimatedHours && (
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <HiClock className="w-4 h-4 mr-2" />
                      Estimated Hours
                    </div>
                    <span className="font-medium text-gray-900">
                      {currentTask.estimatedHours} hours
                    </span>
                  </div>
                )}

                {/* Created */}
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <HiClock className="w-4 h-4 mr-2" />
                    Created
                  </div>
                  <span className="font-medium text-gray-900">
                    {new Date(currentTask.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Last Updated */}
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <HiClock className="w-4 h-4 mr-2" />
                    Last Updated
                  </div>
                  <span className="font-medium text-gray-900">
                    {new Date(currentTask.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Reporter */}
            {currentTask.reporter && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporter</h2>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-gray-600">
                      {currentTask.reporter?.firstName?.[0]}{currentTask.reporter?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {currentTask.reporter?.firstName} {currentTask.reporter?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{currentTask.reporter?.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <TaskFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          dispatch(fetchTaskById(id));
        }}
        task={currentTask}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${currentTask.title}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={loading}
      />
    </DashboardLayout>
  );
};

export default TaskDetailPage;
