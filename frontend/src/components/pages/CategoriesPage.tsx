'use client';

import { useState, useEffect } from 'react';
import { useCategories } from '@/hooks/useCategories';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import type { Column } from '@/components/DataTable';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  subcategories: { name: string; slug: string }[];
  displayOrder?: number;
}

export default function CategoriesPage() {
  const { fetchCategories, deleteCategory, loading, error } = useCategories();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await fetchCategories();
    setCategories(data);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      try {
        await deleteCategory(id);
        setCategories(categories.filter((c) => c._id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, row: Category) => {
    setDraggedId(row._id);
    e.dataTransfer!.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetRow: Category) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetRow._id) return;

    const draggedIndex = categories.findIndex((c) => c._id === draggedId);
    const targetIndex = categories.findIndex((c) => c._id === targetRow._id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newCategories = [...categories];
    [newCategories[draggedIndex], newCategories[targetIndex]] = [
      newCategories[targetIndex],
      newCategories[draggedIndex],
    ];

    setCategories(newCategories);
    setDraggedId(null);

    // Save new order to backend
    setReorderLoading(true);
    try {
      const response = await fetch('http://localhost:5050/api/categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: newCategories }),
      });
      if (!response.ok) {
        throw new Error('Failed to reorder categories');
      }
    } catch (err) {
      console.error('Error reordering:', err);
      // Reload categories on error
      loadCategories();
    } finally {
      setReorderLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingId(null);
    loadCategories();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-black">Categories</h1>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Add Category
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {reorderLoading && (
        <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Updating order...
        </div>
      )}

      {loading && <p className="text-gray-600">Loading...</p>}

      {categories.length === 0 && !loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">No categories yet. Create one to get started!</p>
        </div>
      )}

      {categories.length > 0 && (
        <div>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 rounded-lg">
            ✋ Drag rows to reorder categories - they'll appear in this order in the public menu
          </div>
          <DataTable
            columns={[
              {
                key: 'icon',
                label: 'Icon',
                width: '80px',
                render: (value) => <span className="text-2xl">{value}</span>,
              },
              {
                key: 'name',
                label: 'Name',
                render: (value) => <span className="font-semibold text-black">{value}</span>,
              },
              {
                key: 'slug',
                label: 'Slug',
                render: (value) => (
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">{value}</code>
                ),
              },
              {
                key: 'description',
                label: 'Description',
                render: (value) => <span className="text-gray-600">{value || '-'}</span>,
              },
              {
                key: 'subcategories',
                label: 'Subcategories',
                width: '120px',
                render: (value) => (
                  <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                    {Array.isArray(value) ? value.length : 0}
                  </span>
                ),
              },
              {
                key: 'updatedAt',
                label: 'Modified',
                width: '130px',
                render: (value) => {
                  const date = new Date(value);
                  return (
                    <span className="text-xs text-gray-600">
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  );
                },
              },
            ]}
            data={categories}
            onView={(row: Category) => setViewingId(row._id)}
            onEdit={(row: Category) => setEditingId(row._id)}
            onDelete={(row: Category) => handleDelete(row._id)}
            selectable={false}
            actions={true}
            draggable={true}
            draggedId={draggedId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        </div>
      )}

      {(showForm || editingId) && (
        <CategoryForm
          categoryId={editingId}
          categories={categories}
          onClose={handleFormClose}
        />
      )}

      {viewingId && (
        <CategoryViewModal
          categoryId={viewingId}
          categories={categories}
          onClose={() => setViewingId(null)}
        />
      )}
    </div>
  );
}

function CategoryForm({ categoryId, categories, onClose }: any) {
  const { createCategory, updateCategory, loading } = useCategories();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🌿');
  const [subcategories, setSubcategories] = useState<{ name: string; slug: string }[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubSlug, setNewSubSlug] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (categoryId) {
      const category = categories.find((c: any) => c._id === categoryId);
      if (category) {
        setName(category.name);
        setSlug(category.slug);
        setDescription(category.description);
        setIcon(category.icon);
        setSubcategories(category.subcategories);
      }
    }
  }, [categoryId, categories]);

  const handleAddSubcategory = () => {
    if (newSubName && newSubSlug) {
      setSubcategories([...subcategories, { name: newSubName, slug: newSubSlug }]);
      setNewSubName('');
      setNewSubSlug('');
    }
  };

  const handleRemoveSubcategory = (idx: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !slug) {
      setError('Name and slug are required');
      return;
    }

    if (subcategories.length === 0) {
      setError('Please add at least one subcategory before saving');
      return;
    }

    try {
      const data = { name, slug, description, icon, subcategories };

      if (categoryId) {
        await updateCategory(categoryId, data);
      } else {
        await createCategory(data);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving category');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold text-black mb-6">
          {categoryId ? 'Edit Category' : 'Create New Category'}
        </h2>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Category Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">Icon</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-lg font-semibold text-black mb-3">Subcategories</h3>

            {subcategories.length > 0 && (
              <div className="bg-gray-50 p-3 rounded mb-4 space-y-2">
                {subcategories.map((sub, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded">
                    <span className="text-sm text-black">
                      {sub.name} <code className="text-xs text-gray-500">({sub.slug})</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubcategory(idx)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="Subcategory name"
                className="col-span-2 px-3 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:border-blue-600"
              />
              <input
                type="text"
                value={newSubSlug}
                onChange={(e) => setNewSubSlug(e.target.value)}
                placeholder="slug"
                className="px-3 py-2 border border-gray-300 rounded bg-white text-black focus:outline-none focus:border-blue-600"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddSubcategory}
              className="mt-2 w-full"
            >
              + Add Subcategory
            </Button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-300">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Saving...' : 'Save Category'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryViewModal({ categoryId, categories, onClose }: any) {
  const category = categories.find((c: any) => c._id === categoryId);

  if (!category) return null;

  return (
    <Modal
      isOpen={!!categoryId}
      title="Category Details"
      onClose={onClose}
      size="md"
    >
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Slug */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Slug
            </p>
            <code className="text-sm text-gray-800 font-mono bg-gray-100 px-3 py-2 rounded block break-all">
              {category.slug}
            </code>
          </div>

          {/* Category Name & Icon */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Category
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{category.icon}</span>
              <p className="text-sm font-bold text-gray-900">{category.name}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Description
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {category.description || '—'}
            </p>
          </div>
        </div>

        {/* Right Column - Subcategory List */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Subcategory List
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {category.subcategories.length > 0 ? (
              category.subcategories.map((sub: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-gray-50 p-3 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                  <code className="text-xs text-gray-600">{sub.slug}</code>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No subcategories</p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
