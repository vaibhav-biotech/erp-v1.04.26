import React, { useState, useEffect } from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';

interface AddEditSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  supplier: any | null;
}

export default function AddEditSupplierModal({ isOpen, onClose, onSave, supplier }: AddEditSupplierModalProps) {
  const { adminToken } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    gstNo: '',
    panNo: '',
    contactPerson: '',
    mobile: '',
    email: '',
    address: { street: '', city: '', state: '', pincode: '' },
    businessDetails: { paymentTerms: 'Net 30', creditLimit: 0, gstPercent: 18, defaultCurrency: 'INR' },
    notes: { isPreferred: false, internalNotes: '' },
    status: 'Active'
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        companyName: supplier.companyName || '',
        gstNo: supplier.gstNo || '',
        panNo: supplier.panNo || '',
        contactPerson: supplier.contactPerson || supplier.contactName || '',
        mobile: supplier.mobile || supplier.phone || '',
        email: supplier.email || '',
        address: {
          street: supplier.address?.street || '',
          city: supplier.address?.city || '',
          state: supplier.address?.state || '',
          pincode: supplier.address?.pincode || ''
        },
        businessDetails: {
          paymentTerms: supplier.businessDetails?.paymentTerms || 'Net 30',
          creditLimit: supplier.businessDetails?.creditLimit || 0,
          gstPercent: supplier.businessDetails?.gstPercent || 18,
          defaultCurrency: supplier.businessDetails?.defaultCurrency || 'INR'
        },
        notes: {
          isPreferred: supplier.notes?.isPreferred || false,
          internalNotes: supplier.notes?.internalNotes || ''
        },
        status: supplier.status || 'Active'
      });
    } else {
      // Reset form
      setFormData({
        name: '',
        companyName: '',
        gstNo: '',
        panNo: '',
        contactPerson: '',
        mobile: '',
        email: '',
        address: { street: '', city: '', state: '', pincode: '' },
        businessDetails: { paymentTerms: 'Net 30', creditLimit: 0, gstPercent: 18, defaultCurrency: 'INR' },
        notes: { isPreferred: false, internalNotes: '' },
        status: 'Active'
      });
    }
  }, [supplier, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const method = supplier ? 'PUT' : 'POST';
      const url = supplier 
        ? buildApiUrl(`/api/suppliers/${supplier._id}`) 
        : buildApiUrl('/api/suppliers');
        
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(adminToken || undefined)
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        onSave();
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error}`);
      }
    } catch (error) {
      console.error('Save supplier error:', error);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">{supplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <FiX size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="supplier-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Details */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Basic Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier/Brand Name *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST No.</label>
                  <input type="text" name="gstNo" value={formData.gstNo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN No. (Optional)</label>
                  <input type="text" name="panNo" value={formData.panNo} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                  <input type="text" name="contactPerson" required value={formData.contactPerson} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <input type="text" name="mobile" required value={formData.mobile} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Address Details */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                  <input type="text" name="address.street" value={formData.address.street} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" name="address.city" value={formData.address.city} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input type="text" name="address.state" value={formData.address.state} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input type="text" name="address.pincode" value={formData.address.pincode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </section>

            {/* Business Details */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Business Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                  <select name="businessDetails.paymentTerms" value={formData.businessDetails.paymentTerms} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="Advance">Advance</option>
                    <option value="On Delivery">On Delivery</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
                  <input type="number" min="0" name="businessDetails.creditLimit" value={formData.businessDetails.creditLimit} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default GST %</label>
                  <input type="number" min="0" max="100" name="businessDetails.gstPercent" value={formData.businessDetails.gstPercent} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </section>

            {/* Notes */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Notes</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isPreferred" name="notes.isPreferred" checked={formData.notes.isPreferred} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <label htmlFor="isPreferred" className="text-sm font-medium text-gray-700">Mark as Preferred Supplier (⭐)</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
                  <textarea name="notes.internalNotes" rows={3} value={formData.notes.internalNotes} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                </div>
              </div>
            </section>

          </form>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium">
            Cancel
          </button>
          <button form="supplier-form" type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50">
            {isSaving ? 'Saving...' : <><FiSave size={18} /> {supplier ? 'Update Supplier' : 'Save Supplier'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
