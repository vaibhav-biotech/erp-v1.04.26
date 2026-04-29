'use client';

import { useEffect, useState } from 'react';
import { fetchWithStore } from '@/lib/storeConfig';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import type { Column } from '@/components/DataTable';

interface NotificationItem {
  _id: string;
  message: string;
  bgColor: string;
  textColor: string;
  fontWeight: 'regular' | 'bold';
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const defaultForm = {
  message: '',
  bgColor: '#fef08a',
  textColor: '#713f12',
  fontWeight: 'regular' as 'regular' | 'bold',
  isActive: true,
};

const getAdminToken = () => (typeof window !== 'undefined' ? localStorage.getItem('adminToken') || undefined : undefined);

export default function NotificationBarPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<NotificationItem | null>(null);
  const [form, setForm] = useState(defaultForm);

  const loadNotifications = async () => {
    setIsLoading(true);
    setStatusMsg('');
    try {
      const res = await fetchWithStore('/api/notification-bar/admin', {
        token: getAdminToken(),
      });

      if (!res.ok) throw new Error('Failed to fetch notifications');

      const data = await res.json();
      setNotifications(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setStatusMsg('');
    setShowModal(true);
  };

  const openEdit = (row: NotificationItem) => {
    setEditing(row);
    setForm({
      message: row.message || '',
      bgColor: row.bgColor || '#fef08a',
      textColor: row.textColor || '#713f12',
      fontWeight: row.fontWeight || 'regular',
      isActive: Boolean(row.isActive),
    });
    setStatusMsg('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(defaultForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');

    if (!form.message.trim()) {
      setStatusMsg('Message is required');
      return;
    }

    setIsSaving(true);
    try {
      const endpoint = editing
        ? `/api/notification-bar/admin/${editing._id}`
        : '/api/notification-bar/admin';

      const res = await fetchWithStore(endpoint, {
        method: editing ? 'PATCH' : 'POST',
        token: getAdminToken(),
        body: JSON.stringify({
          message: form.message.trim(),
          bgColor: form.bgColor,
          textColor: form.textColor,
          fontWeight: form.fontWeight,
          isActive: form.isActive,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || 'Failed to save notification');
      }

      closeModal();
      await loadNotifications();
      setStatusMsg(editing ? 'Notification updated' : 'Notification created');
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (row: NotificationItem) => {
    try {
      const res = await fetchWithStore(`/api/notification-bar/admin/${row._id}`, {
        method: 'PATCH',
        token: getAdminToken(),
        body: JSON.stringify({ isActive: !row.isActive }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || 'Failed to update status');
      }

      await loadNotifications();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const columns: Column[] = [
    {
      key: 'message',
      label: 'Message',
      render: (value, row: NotificationItem) => (
        <span style={{ fontWeight: row.fontWeight === 'bold' ? 700 : 500 }} className="text-gray-900">
          {value}
        </span>
      ),
    },
    {
      key: 'preview',
      label: 'Preview',
      render: (_, row: NotificationItem) => (
        <div
          className="rounded px-3 py-1.5 text-xs inline-block border"
          style={{
            backgroundColor: row.bgColor,
            color: row.textColor,
            fontWeight: row.fontWeight === 'bold' ? 700 : 500,
          }}
        >
          Sample
        </div>
      ),
      width: '140px',
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
      width: '120px',
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (value) => (
        <span className="text-xs text-gray-600">
          {value ? new Date(value).toLocaleString() : '-'}
        </span>
      ),
      width: '180px',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row: NotificationItem) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant={row.isActive ? 'danger' : 'success'}
            onClick={() => handleToggleStatus(row)}
          >
            {row.isActive ? 'Set Inactive' : 'Set Active'}
          </Button>
        </div>
      ),
      width: '260px',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Bar</h1>
          <p className="mt-2 text-gray-600">Create announcements and control active/inactive state.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Create Notification</Button>
      </div>

      {statusMsg && (
        <div className="mt-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-200">
          {statusMsg}
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <p className="text-gray-600">Loading notifications...</p>
        ) : (
          <DataTable columns={columns} data={notifications} selectable={false} actions={false} />
        )}
      </div>

      <Modal
        isOpen={showModal}
        title={editing ? 'Edit Notification' : 'Create Notification'}
        onClose={closeModal}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <input
              type="text"
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Enter notification text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              maxLength={160}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className="space-y-2"
            >
              <label className="block text-sm font-medium text-gray-700">Background Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.bgColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, bgColor: e.target.value }))}
                  className="h-10 w-12 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={form.bgColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, bgColor: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.textColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, textColor: e.target.value }))}
                  className="h-10 w-12 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={form.textColor}
                  onChange={(e) => setForm((prev) => ({ ...prev, textColor: e.target.value }))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Weight</label>
              <select
                value={form.fontWeight}
                onChange={(e) => setForm((prev) => ({ ...prev, fontWeight: e.target.value as 'regular' | 'bold' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="regular">Regular</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-7">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4"
              />
              Set Active
            </label>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
            <div
              className="rounded-md border px-4 py-3 text-sm"
              style={{
                backgroundColor: form.bgColor,
                color: form.textColor,
                fontWeight: form.fontWeight === 'bold' ? 700 : 500,
              }}
            >
              {form.message || 'Notification message'}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {editing ? 'Update Notification' : 'Create Notification'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
