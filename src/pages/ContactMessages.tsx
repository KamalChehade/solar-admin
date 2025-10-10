import React, { useEffect, useState } from 'react';
import { Mail, Trash2, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Table } from '../components/ui/Table';
import { useToast } from '../components/ui/Toast';
import { useLocale } from '../contexts/LocaleContext';
import useContactMessages from '../hooks/useContactMessages';

const ContactMessages: React.FC = () => {
  const {
    messages,
    loading,
    fetch,
    remove,
    totalPages,
    currentPage,
    perPage,
    setCurrentPage,
    setPerPage,
  } = useContactMessages();

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [deletingMessage, setDeletingMessage] = useState<any>(null);

  const { showToast } = useToast();
  const { t } = useLocale();

  useEffect(() => {
    fetch(currentPage, perPage);
  }, [fetch, currentPage, perPage]);

  const handleViewMessage = (message: any) => {
    setSelectedMessage(message);
    setIsViewModalOpen(true);
  };

  const loadPage = async (p: number, pp: number) => {
    const pageNum = Math.max(1, Math.floor(p));
    setCurrentPage(pageNum);
    await fetch(pageNum, pp);
  };

  const handleDelete = async () => {
    if (!deletingMessage) return;
    try {
      await remove(deletingMessage.id);
      showToast(t('message_deleted') || 'Message deleted successfully', 'success');
      setIsDeleteModalOpen(false);
      setDeletingMessage(null);
    } catch (err) {
      showToast(t('error_deleting') || 'Error deleting', 'error');
    }
  };

  const columns = [
    { key: 'name', label: t('name') || 'Name' },
    { key: 'email', label: t('email') || 'Email' },
    { key: 'phone', label: t('phone') || 'Phone' },
    { key: 'subject', label: t('subject') || 'Subject' },
    { key: 'createdAt', label: t('date') || 'Date', render: (m: any) => new Date(m.createdAt).toLocaleDateString() },
    {
      key: 'actions',
      label: t('actions') || 'Actions',
      render: (m: any) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewMessage(m);
            }}
            className="p-2 text-[#0077B6] hover:bg-[#0077B6]/10 rounded-lg transition-colors"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeletingMessage(m);
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
            <p className="text-gray-600">{t('view_manage_customer_inquiries') || 'View and manage customer inquiries'}</p>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={messages}
        keyExtractor={(message) => String(message.id)}
        searchPlaceholder={t('search_messages') || 'Search messages...'}
        onRowClick={handleViewMessage}
      />

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">{t('items_per_page') || 'Items per page'}</label>
          <select
            value={perPage}
            onChange={(e) => {
              const v = Number(e.target.value);
              setPerPage(v);
              loadPage(1, v);
            }}
            className="border rounded p-1"
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => loadPage(currentPage - 1, perPage)}
            disabled={currentPage <= 1}
          >
            {t('prev') || 'Prev'}
          </button>
          <div className="text-sm text-gray-700">{t('page') || 'Page'} {currentPage} / {totalPages}</div>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => loadPage(currentPage + 1, perPage)}
            disabled={currentPage >= totalPages}
          >
            {t('next') || 'Next'}
          </button>
        </div>
      </div>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={t('message_details') || 'Message Details'} size="lg">
        {selectedMessage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">{t('from') || 'From'}</p>
                <p className="font-medium text-gray-900">{selectedMessage.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('email') || 'Email'}</p>
                <p className="font-medium text-gray-900">{selectedMessage.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('phone') || 'Phone'}</p>
                <p className="font-medium text-gray-900">
                  <a href={`tel:${selectedMessage.phone}`} className="text-[#0077B6] hover:underline">{selectedMessage.phone}</a>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('subject') || 'Subject'}</p>
                <p className="font-medium text-gray-900">{selectedMessage.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('date') || 'Date'}</p>
                <p className="font-medium text-gray-900">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600 font-medium">{t('message') || 'Message'}</p>
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
                {t('delete') || 'Delete'}
              </Button>
              <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>{t('close') || 'Close'}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={t('delete') || 'Delete'} size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('are_you_sure_delete') || 'Are you sure you want to delete'} <strong>{deletingMessage?.name}</strong>? {t('will_permanently_remove') || 'This action cannot be undone.'}
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>{t('cancel') || 'Cancel'}</Button>
            <Button variant="danger" onClick={handleDelete}>{t('delete') || 'Delete'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ContactMessages;
