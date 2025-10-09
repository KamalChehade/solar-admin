import React, { useEffect, useState } from 'react';
import { Users, Mail, Trash2, Send } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';
import { supabase } from '../lib/supabase';

interface Subscriber {
  id: string;
  name: string;
  email_address: string;
  date_subscribed: string;
  is_active: boolean;
}

export const Newsletter: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [deletingSubscriber, setDeletingSubscriber] = useState<Subscriber | null>(null);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const { showToast } = useToast();
  const { t } = useLocale();

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('date_subscribed', { ascending: false });

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      showToast('Error fetching subscribers', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingSubscriber) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', deletingSubscriber.id);

      if (error) throw error;
      showToast('Subscriber deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setDeletingSubscriber(null);
      fetchSubscribers();
    } catch (error) {
      showToast('Error deleting subscriber', 'error');
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    const recipients =
      selectedSubscribers.length > 0
        ? subscribers.filter((sub) => selectedSubscribers.includes(sub.id))
        : subscribers.filter((sub) => sub.is_active);

    if (recipients.length === 0) {
      showToast('No recipients selected', 'error');
      return;
    }

    showToast(
      `Email "${emailData.subject}" would be sent to ${recipients.length} subscribers`,
      'success'
    );
    setIsSendModalOpen(false);
    setEmailData({ subject: '', message: '' });
    setSelectedSubscribers([]);
  };

  const openSendModal = (subscriberId?: string) => {
    if (subscriberId) {
      setSelectedSubscribers([subscriberId]);
    } else {
      setSelectedSubscribers([]);
    }
    setIsSendModalOpen(true);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email_address', label: 'Email' },
    {
      key: 'date_subscribed',
      label: 'Subscribed',
      render: (subscriber: Subscriber) =>
        new Date(subscriber.date_subscribed).toLocaleDateString(),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (subscriber: Subscriber) => (
        <span
          className={`px-2 py-1 rounded-md text-sm ${
            subscriber.is_active
              ? 'bg-[#00A86B]/10 text-[#00A86B]'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {subscriber.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (subscriber: Subscriber) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openSendModal(subscriber.id);
            }}
            className="p-2 text-[#0077B6] hover:bg-[#0077B6]/10 rounded-lg transition-colors"
            title="Send Email"
          >
            <Send size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingSubscriber(subscriber);
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
            <Users className="text-[#FFC700]" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('newsletter_subscribers')}</h1>
            <p className="text-gray-600">Manage your email list</p>
          </div>
        </div>
        <Button onClick={() => openSendModal()} className="gap-2">
          <Mail size={20} />
          Send to All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Total Subscribers</p>
          <p className="text-3xl font-bold text-gray-900">{subscribers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">Active</p>
          <p className="text-3xl font-bold text-[#00A86B]">
            {subscribers.filter((sub) => sub.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600 text-sm mb-1">This Month</p>
          <p className="text-3xl font-bold text-[#0077B6]">
            {
              subscribers.filter(
                (sub) =>
                  new Date(sub.date_subscribed).getMonth() === new Date().getMonth() &&
                  new Date(sub.date_subscribed).getFullYear() === new Date().getFullYear()
              ).length
            }
          </p>
        </div>
      </div>

      <Table
        columns={columns}
        data={subscribers}
        keyExtractor={(subscriber) => subscriber.id}
        searchPlaceholder="Search subscribers..."
      />

      <Modal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        title="Send Newsletter"
        size="lg"
      >
        <form onSubmit={handleSendEmail} className="space-y-4">
          <div className="p-4 bg-[#0077B6]/10 rounded-lg">
            <p className="text-sm text-gray-700">
              Recipients:{' '}
              <strong>
                {selectedSubscribers.length > 0
                  ? `${selectedSubscribers.length} selected subscriber(s)`
                  : `${subscribers.filter((sub) => sub.is_active).length} active subscribers`}
              </strong>
            </p>
          </div>

          <Input
            label="Subject"
            value={emailData.subject}
            onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
            required
            placeholder="Newsletter subject"
          />

          <TextArea
            label="Message"
            value={emailData.message}
            onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
            rows={10}
            required
            placeholder="Your newsletter content..."
          />

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsSendModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <Send size={18} />
              Send Email
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Subscriber"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{deletingSubscriber?.name}</strong> from the
            newsletter? This action cannot be undone.
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
