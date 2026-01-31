import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiX } from 'react-icons/hi';
import { createTask, updateTask } from '../../store/slices/taskSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import { Modal, Button, Input, Select, Spinner } from '../../components/common';
import toast from 'react-hot-toast';

const TaskFormModal = ({ isOpen, onClose, onSuccess, task, projectId: initialProjectId }) => {
  const dispatch = useDispatch();
  const { loading: taskLoading } = useSelector((state) => state.tasks);
  const { projects, currentProject, loading: projectLoading } = useSelector((state) => state.projects);
  const { users, loading: userLoading } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    projectId: '',
    assigneeId: '',
    dueDate: '',
    estimatedHours: '',
  });
  const [errors, setErrors] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchProjects({ limit: 100 }));
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (formData.projectId || initialProjectId) {
      const projectIdToUse = formData.projectId || initialProjectId;
      const project = projects.find((p) => p.id === projectIdToUse) || currentProject;
      setSelectedProject(project);
      
      if (project) {
        // Fetch users who are members of the project
        dispatch(fetchUsers({ limit: 100, status: 'active' }));
      }
    }
  }, [formData.projectId, initialProjectId, projects, currentProject, dispatch]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        projectId: task.projectId || '',
        assigneeId: task.assigneeId || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        estimatedHours: task.estimatedHours || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        projectId: initialProjectId || '',
        assigneeId: '',
        dueDate: '',
        estimatedHours: '',
      });
    }
    setErrors({});
  }, [task, isOpen, initialProjectId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.projectId) {
      newErrors.projectId = 'Project is required';
    }

    if (!formData.assigneeId) {
      newErrors.assigneeId = 'Assignee is required';
    }

    if (formData.estimatedHours && (isNaN(formData.estimatedHours) || formData.estimatedHours < 0)) {
      newErrors.estimatedHours = 'Estimated hours must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData = {
      ...formData,
      estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : null,
    };

    try {
      if (task) {
        await dispatch(updateTask({ id: task.id, data: submitData })).unwrap();
        toast.success('Task updated successfully');
      } else {
        await dispatch(createTask(submitData)).unwrap();
        toast.success('Task created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error || `Failed to ${task ? 'update' : 'create'} task`);
    }
  };

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  // Get assignee options - project members + manager
  const getAssigneeOptions = () => {
    if (!selectedProject) return [];
    
    const memberIds = new Set();
    const options = [];

    // Add project manager
    if (selectedProject.manager) {
      memberIds.add(selectedProject.managerId);
      options.push({
        value: selectedProject.managerId,
        label: `${selectedProject.manager.firstName} ${selectedProject.manager.lastName} (Manager)`,
      });
    }

    // Add project members
    if (selectedProject.members) {
      selectedProject.members.forEach((member) => {
        if (!memberIds.has(member.id)) {
          memberIds.add(member.id);
          options.push({
            value: member.id,
            label: `${member.firstName} ${member.lastName}`,
          });
        }
      });
    }

    // If current user is admin, allow selecting any active user
    if (currentUser?.role === 'admin' && users.length > 0) {
      users.forEach((u) => {
        if (!memberIds.has(u.id) && u.status === 'active') {
          options.push({
            value: u.id,
            label: `${u.firstName} ${u.lastName} (${u.role})`,
          });
        }
      });
    }

    return options;
  };

  const assigneeOptions = getAssigneeOptions();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Task' : 'Create Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {projectLoading || userLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Task Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              error={errors.title}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                placeholder="Describe the task..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Project"
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                options={projectOptions}
                placeholder="Select a project"
                error={errors.projectId}
                disabled={!!initialProjectId || !!task}
                required
              />

              <Select
                label="Assignee"
                name="assigneeId"
                value={formData.assigneeId}
                onChange={handleChange}
                options={assigneeOptions}
                placeholder={formData.projectId ? 'Select assignee' : 'Select project first'}
                error={errors.assigneeId}
                disabled={!formData.projectId}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={[
                  { value: 'todo', label: 'To Do' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'review', label: 'Review' },
                  { value: 'done', label: 'Done' },
                ]}
              />

              <Select
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Due Date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />

              <Input
                type="number"
                label="Estimated Hours"
                name="estimatedHours"
                value={formData.estimatedHours}
                onChange={handleChange}
                placeholder="e.g., 8"
                min="0"
                step="0.5"
                error={errors.estimatedHours}
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={taskLoading}>
                {task ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default TaskFormModal;
