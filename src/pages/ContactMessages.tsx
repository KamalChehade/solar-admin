import React, { useEffect, useState } from 'react';
import { Mail, Trash2, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';
import { supabase } from '../lib/supabase';

interface ContactMessage {
  id: string;
  name: string;
  email_address: string;
  subject: string;
  message: string;
  date_received: string;
  is_read: boolean;
}

export const ContactMessages: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<ContactMessage | null>(null);
  const { showToast } = useToast();
  const { t } = useLocale();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('date_received', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      showToast('Error fetching messages', 'error');
    }
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsViewModalOpen(true);

    if (!message.is_read) {
      try {
        await supabase.from('contact_messages').update({ is_read: true }).eq('id', message.id);
        fetchMessages();
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingMessage) return;

    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', deletingMessage.id);

      if (error) throw error;
      showToast('Message deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setDeletingMessage(null);
      fetchMessages();
    } catch (error) {
      showToast('Error deleting message', 'error');
    }
  };

  const columns = [
    {
      key: 'is_read',
      label: '',
      render: (message: ContactMessage) => (
        <div className="flex items-center">
          {!message.is_read && (
            <div className="w-2 h-2 bg-[#FFD700] rounded-full" title="Unread" />
          )}
        </div>
      ),
    },
    { key: 'name', label: 'Name' },
    { key: 'email_address', label: 'Email' },
    { key: 'subject', label: 'Subject' },
    {
      key: 'date_received',
      label: 'Date',
      render: (message: ContactMessage) => new Date(message.date_received).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (message: ContactMessage) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewMessage(message);
            }}
            className="p-2 text-[#0077B6] hover:bg-[#0077B6]/10 rounded-lg transition-colors"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingMessage(message);
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
          <div className="p-3 bg-[#0077B6]/10 rounded-lg">
            <Mail className="text-[#0077B6]" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('contact_messages')}</h1>
            <p className="text-gray-600">View and manage customer inquiries</p>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={messages}
        keyExtractor={(message) => message.id}
        searchPlaceholder="Search messages..."
        onRowClick={handleViewMessage}
      />

      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Message Details"
        size="lg"
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">From</p>
                <p className="font-medium text-gray-900">{selectedMessage.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{selectedMessage.email_address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="font-medium text-gray-900">{selectedMessage.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedMessage.date_received).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">Message</p>
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="danger"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setDeletingMessage(selectedMessage);
                  setIsDeleteModalOpen(true);
                }}
                className="gap-2"
              >
                <Trash2 size={18} />
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Message"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this message from <strong>{deletingMessage?.name}</strong>?
            This action cannot be undone.
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
