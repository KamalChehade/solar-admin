import React, { useEffect, useState } from 'react';
import { UserCircle, Plus, Edit, Trash2, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CMSUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Publisher';
  created_at: string;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<CMSUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CMSUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<CMSUser | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Publisher' as const });
  const { showToast } = useToast();
  const { userRole } = useAuth();

  useEffect(() => {
    if (userRole === 'Admin') {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      showToast('Error fetching users', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('cms_users')
          .update({ name: formData.name, role: formData.role })
          .eq('id', editingUser.id);

        if (error) throw error;
        showToast('User updated successfully', 'success');
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: Math.random().toString(36).slice(-12),
          options: {
            data: {
              name: formData.name,
            },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: insertError } = await supabase.from('cms_users').insert([
            {
              id: authData.user.id,
              name: formData.name,
              email: formData.email,
              role: formData.role,
            },
          ]);

          if (insertError) throw insertError;
        }

        showToast('User created successfully', 'success');
      }

      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'Publisher' });
      fetchUsers();
    } catch (error: any) {
      showToast(error.message || 'Error saving user', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(deletingUser.id);
      if (authError) throw authError;

      showToast('User deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (error: any) {
      showToast(error.message || 'Error deleting user', 'error');
    }
  };

  const openEditModal = (user: CMSUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'Publisher' });
    setIsModalOpen(true);
  };

  if (userRole !== 'Admin') {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Shield size={64} className="text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only administrators can access user management.</p>
        </div>
      </div>
    );
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (user: CMSUser) => (
        <span
          className={`px-3 py-1 rounded-md text-sm font-medium ${
            user.role === 'Admin'
              ? 'bg-[#FFD700]/20 text-[#FFC700]'
              : 'bg-[#0077B6]/10 text-[#0077B6]'
          }`}
        >
          {user.role}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (user: CMSUser) => new Date(user.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: CMSUser) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(user);
            }}
            className="p-2 text-[#0077B6] hover:bg-[#0077B6]/10 rounded-lg transition-colors"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingUser(user);
              setIsDeleteModalOpen(true);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#FFD700]/20 rounded-lg">
            <UserCircle className="text-[#FFC700]" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600">Manage admin and publisher accounts</p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus size={20} />
          Add User
        </Button>
      </div>

      <Table
        columns={columns}
        data={users}
        keyExtractor={(user) => user.id}
        searchPlaceholder="Search users..."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!editingUser}
          />
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value as 'Admin' | 'Publisher' })
            }
            options={[
              { value: 'Publisher', label: 'Publisher' },
              { value: 'Admin', label: 'Admin' },
            ]}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingUser ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deletingUser?.name}</strong>? This will
            permanently remove their account and all associated data.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
