import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiSearch,
  HiFilter,
  HiEye,
  HiUserGroup,
} from 'react-icons/hi';
import { fetchProjects, deleteProject } from '../../store/slices/projectSlice';
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
import ProjectFormModal from './ProjectFormModal';
import toast from 'react-hot-toast';

const ProjectsPage = () => {
  const dispatch = useDispatch();
  const { projects, pagination, loading } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, project: null });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    loadProjects();
  }, [filters.page, filters.status, filters.priority]);

  const loadProjects = () => {
    const params = {
      page: filters.page,
      limit: filters.limit,
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
    };
    dispatch(fetchProjects(params));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadProjects();
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteProject(deleteConfirm.project.id)).unwrap();
      toast.success('Project deleted successfully');
      setDeleteConfirm({ isOpen: false, project: null });
    } catch (error) {
      toast.error(error || 'Failed to delete project');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    loadProjects();
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

  const canManageProject = (project) => {
    return user?.role === 'admin' || project.managerId === user?.id;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-500 mt-1">Manage and track your projects</p>
          </div>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Button onClick={() => setIsModalOpen(true)}>
              <HiPlus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={filters.search}
                  onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              options={[
                { value: 'planning', label: 'Planning' },
                { value: 'active', label: 'Active' },
                { value: 'on-hold', label: 'On Hold' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              placeholder="All Status"
              className="w-full sm:w-40"
            />
            <Select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
              placeholder="All Priority"
              className="w-full sm:w-40"
            />
            <Button type="submit" variant="secondary">
              <HiFilter className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </form>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="flex items-center pt-4 border-t border-gray-100">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="ml-3 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {project.description || 'No description'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-4">
                      <Badge variant={getStatusBadgeVariant(project.status)}>
                        {project.status.replace('-', ' ')}
                      </Badge>
                      <Badge variant={getPriorityBadgeVariant(project.priority)}>
                        {project.priority}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    {project.totalTasks > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-medium text-gray-900">
                            {Math.round((project.taskCounts?.done / project.totalTasks) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${(project.taskCounts?.done / project.totalTasks) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <HiUserGroup className="w-4 h-4 mr-1" />
                        {project.members?.length || 0} members
                      </div>
                      <div>
                        {project.totalTasks || 0} tasks
                      </div>
                    </div>

                    {/* Manager */}
                    <div className="flex items-center pt-4 border-t border-gray-100">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">
                          {project.manager?.firstName?.[0]}{project.manager?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {project.manager?.firstName} {project.manager?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Manager</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-3 bg-gray-50 flex items-center justify-end space-x-2">
                    <Link
                      to={`/projects/${project.id}`}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <HiEye className="w-5 h-5" />
                    </Link>
                    {canManageProject(project) && (
                      <>
                        <button
                          onClick={() => handleEdit(project)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
                        >
                          <HiPencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, project })}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Pagination pagination={pagination} onPageChange={handlePageChange} />
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <EmptyState
              title="No projects found"
              description={
                user?.role === 'user'
                  ? "You haven't been assigned to any projects yet."
                  : 'Get started by creating your first project.'
              }
              action={
                (user?.role === 'admin' || user?.role === 'manager') && (
                  <Button onClick={() => setIsModalOpen(true)}>
                    <HiPlus className="w-5 h-5 mr-2" />
                    Create Project
                  </Button>
                )
              }
            />
          </div>
        )}
      </div>

      {/* Project Form Modal */}
      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        project={editingProject}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, project: null })}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteConfirm.project?.name}"? All tasks in this project will also be deleted. This action cannot be undone.`}
        confirmText="Delete"
        loading={loading}
      />
    </DashboardLayout>
  );
};

export default ProjectsPage;
