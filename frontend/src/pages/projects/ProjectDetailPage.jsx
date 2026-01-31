import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiArrowLeft,
  HiPencil,
  HiTrash,
  HiUserAdd,
  HiUserRemove,
  HiPlus,
  HiClock,
  HiCheckCircle,
  HiExclamation,
} from 'react-icons/hi';
import { fetchProjectById, deleteProject, addProjectMember, removeProjectMember } from '../../store/slices/projectSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import { DashboardLayout } from '../../components/layout';
import { Button, Spinner, Badge, Modal, Select, ConfirmDialog, EmptyState } from '../../components/common';
import ProjectFormModal from './ProjectFormModal';
import TaskFormModal from '../tasks/TaskFormModal';
import toast from 'react-hot-toast';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentProject, loading } = useSelector((state) => state.projects);
  const { users } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false });
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState({ isOpen: false, member: null });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [memberRole, setMemberRole] = useState('member');

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (isMemberModalOpen) {
      dispatch(fetchUsers({ limit: 100, status: 'active' }));
    }
  }, [isMemberModalOpen, dispatch]);

  const handleDelete = async () => {
    try {
      await dispatch(deleteProject(id)).unwrap();
      toast.success('Project deleted successfully');
      navigate('/projects');
    } catch (error) {
      toast.error(error || 'Failed to delete project');
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      await dispatch(addProjectMember({ projectId: id, userId: selectedUserId, role: memberRole })).unwrap();
      toast.success('Member added successfully');
      setIsMemberModalOpen(false);
      setSelectedUserId('');
      setMemberRole('member');
      dispatch(fetchProjectById(id));
    } catch (error) {
      toast.error(error || 'Failed to add member');
    }
  };

  const handleRemoveMember = async () => {
    try {
      await dispatch(removeProjectMember({ projectId: id, userId: removeMemberConfirm.member.id })).unwrap();
      toast.success('Member removed successfully');
      setRemoveMemberConfirm({ isOpen: false, member: null });
      dispatch(fetchProjectById(id));
    } catch (error) {
      toast.error(error || 'Failed to remove member');
    }
  };

  const canManageProject = () => {
    return currentUser?.role === 'admin' || currentProject?.managerId === currentUser?.id;
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      planning: 'default',
      active: 'success',
      'on-hold': 'warning',
      completed: 'info',
      cancelled: 'danger',
    };
    return variants[status] || 'default';
  };

  const getPriorityBadgeVariant = (priority) => {
    const variants = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      critical: 'danger',
    };
    return variants[priority] || 'default';
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return <HiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <HiClock className="w-5 h-5 text-blue-500" />;
      case 'review':
        return <HiExclamation className="w-5 h-5 text-yellow-500" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const availableUsers = users.filter(
    (u) => !currentProject?.members?.some((m) => m.id === u.id)
  );

  if (loading && !currentProject) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!currentProject) {
    return (
      <DashboardLayout>
        <EmptyState
          title="Project not found"
          description="The project you're looking for doesn't exist or you don't have access to it."
          action={
            <Button onClick={() => navigate('/projects')}>
              <HiArrowLeft className="w-5 h-5 mr-2" />
              Back to Projects
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/projects')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <HiArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={getStatusBadgeVariant(currentProject.status)}>
                  {currentProject.status.replace('-', ' ')}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(currentProject.priority)}>
                  {currentProject.priority}
                </Badge>
              </div>
            </div>
          </div>
          {canManageProject() && (
            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
                <HiPencil className="w-5 h-5 mr-2" />
                Edit
              </Button>
              <Button
                variant="danger"
                onClick={() => setDeleteConfirm({ isOpen: true })}
              >
                <HiTrash className="w-5 h-5 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h2>
              <p className="text-gray-600 mb-6">
                {currentProject.description || 'No description provided.'}
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Manager</p>
                  <p className="font-medium text-gray-900">
                    {currentProject.manager?.firstName} {currentProject.manager?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium text-gray-900">
                    {new Date(currentProject.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {currentProject.startDate && (
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(currentProject.startDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {currentProject.endDate && (
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(currentProject.endDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
                {(canManageProject() || currentProject?.members?.some((m) => m.id === currentUser?.id)) && (
                  <Button size="sm" onClick={() => setIsTaskModalOpen(true)}>
                    <HiPlus className="w-4 h-4 mr-1" />
                    Add Task
                  </Button>
                )}
              </div>

              {currentProject.tasks?.length > 0 ? (
                <div className="space-y-3">
                  {currentProject.tasks.map((task) => (
                    <Link
                      key={task.id}
                      to={`/tasks/${task.id}`}
                      className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {getTaskStatusIcon(task.status)}
                      <div className="ml-4 flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{task.title}</p>
                        <p className="text-sm text-gray-500">
                          Assigned to {task.assignee?.firstName} {task.assignee?.lastName}
                        </p>
                      </div>
                      <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
                        {task.priority}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No tasks yet</p>
              )}

              {currentProject.tasks?.length > 5 && (
                <div className="mt-4 text-center">
                  <Link
                    to={`/tasks?projectId=${currentProject.id}`}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View all tasks →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Progress</h2>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Overall</span>
                  <span className="font-medium text-gray-900">
                    {currentProject.totalTasks > 0
                      ? Math.round((currentProject.taskCounts?.done / currentProject.totalTasks) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        currentProject.totalTasks > 0
                          ? (currentProject.taskCounts?.done / currentProject.totalTasks) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">To Do</span>
                  <span className="font-medium text-gray-900">{currentProject.taskCounts?.todo || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">In Progress</span>
                  <span className="font-medium text-blue-600">{currentProject.taskCounts?.['in-progress'] || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">In Review</span>
                  <span className="font-medium text-yellow-600">{currentProject.taskCounts?.review || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Done</span>
                  <span className="font-medium text-green-600">{currentProject.taskCounts?.done || 0}</span>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Team</h2>
                {canManageProject() && (
                  <button
                    onClick={() => setIsMemberModalOpen(true)}
                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <HiUserAdd className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {/* Manager */}
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {currentProject.manager?.firstName?.[0]}{currentProject.manager?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">
                        {currentProject.manager?.firstName} {currentProject.manager?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Project Manager</p>
                    </div>
                  </div>
                </div>

                {/* Members */}
                {currentProject.members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {member.ProjectMember?.role || 'Member'}
                        </p>
                      </div>
                    </div>
                    {canManageProject() && member.id !== currentUser?.id && (
                      <button
                        onClick={() => setRemoveMemberConfirm({ isOpen: true, member })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <HiUserRemove className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                {(!currentProject.members || currentProject.members.length === 0) && (
                  <p className="text-center text-gray-500 py-4 text-sm">No team members yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          dispatch(fetchProjectById(id));
        }}
        project={currentProject}
      />

      {/* Add Task Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={() => {
          setIsTaskModalOpen(false);
          dispatch(fetchProjectById(id));
        }}
        projectId={currentProject.id}
      />

      {/* Add Member Modal */}
      <Modal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Team Member</h2>

          <div className="space-y-4">
            <Select
              label="Select User"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              options={availableUsers.map((u) => ({
                value: u.id,
                label: `${u.firstName} ${u.lastName} (${u.role})`,
              }))}
              placeholder="Choose a user..."
            />

            <Select
              label="Role in Project"
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
              options={[
                { value: 'member', label: 'Member' },
                { value: 'lead', label: 'Lead' },
              ]}
            />

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setIsMemberModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMember} loading={loading}>
                Add Member
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false })}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${currentProject.name}"? All tasks in this project will also be deleted. This action cannot be undone.`}
        confirmText="Delete"
        loading={loading}
      />

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        isOpen={removeMemberConfirm.isOpen}
        onClose={() => setRemoveMemberConfirm({ isOpen: false, member: null })}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${removeMemberConfirm.member?.firstName} ${removeMemberConfirm.member?.lastName} from this project?`}
        confirmText="Remove"
        loading={loading}
      />
    </DashboardLayout>
  );
};

export default ProjectDetailPage;
