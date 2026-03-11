'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import axios, { isAxiosError } from 'axios';
import { Plus, Download, Pencil, Search, X, Loader2, ArrowLeft } from 'lucide-react';

interface Producer {
  id: number;
  name: string;
  contact: string;
  email: string;
  address: string;
  registration_number: string;
}

interface ErrorMessages {
  name?: string[];
  contact?: string[];
  email?: string[];
  address?: string[];
  registration_number?: string[];
  general?: string[];
}

const emptyForm = { name: '', contact: '', email: '', address: '', registration_number: '' };

const apiBase = process.env.NEXT_PUBLIC_API_URL;

function authHeaders() {
  return { Authorization: `Token ${localStorage.getItem('token')}` };
}

export default function ProducersPage() {
  const router = useRouter();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [formVisible, setFormVisible] = useState(false);
  const [errorMessages, setErrorMessages] = useState<ErrorMessages>({});
  const [success, setSuccess] = useState('');
  const [editingProducerId, setEditingProducerId] = useState<number | null>(null);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducers = async (limit: number, offset: number, search = '') => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiBase}/api/v1/producers/`, {
        params: { limit, offset, search },
        headers: authHeaders(),
      });
      setProducers(response.data.results);
      setTotalCount(response.data.count);
    } catch (error) {
      console.error('Error fetching producers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducers(limit, offset, searchQuery);
  }, [offset, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setOffset(0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessages({ ...errorMessages, [e.target.name]: undefined });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProducerId) {
        await axios.patch(
          `${apiBase}/api/v1/producers/${editingProducerId}/`,
          formData,
          { headers: authHeaders() }
        );
        setSuccess('Producer updated successfully.');
      } else {
        await axios.post(
          `${apiBase}/api/v1/producers/`,
          formData,
          { headers: authHeaders() }
        );
        setSuccess('Producer added successfully.');
      }
      setErrorMessages({});
      setFormData(emptyForm);
      setFormVisible(false);
      setEditingProducerId(null);
      fetchProducers(limit, offset, searchQuery);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        setErrorMessages(error.response?.data ?? { general: ['An error occurred.'] });
      } else {
        setErrorMessages({ general: ['Failed to add or update producer.'] });
      }
    }
  };

  const handlePageChange = (newOffset: number) => setOffset(newOffset);

  const totalPages = useMemo(() => Math.ceil(totalCount / limit), [totalCount, limit]);

  const handleEditClick = (producer: Producer) => {
    setFormVisible(true);
    setFormData({ ...producer });
    setEditingProducerId(producer.id);
  };

  const openAddForm = () => {
    setFormData(emptyForm);
    setEditingProducerId(null);
    setErrorMessages({});
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setEditingProducerId(null);
    setErrorMessages({});
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${apiBase}/api/export/producers/`, {
        responseType: 'blob',
        headers: authHeaders(),
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'producers.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('Export error:', error.response?.data);
      }
      setErrorMessages({ general: ['Error exporting data.'] });
    }
  };

  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-2xl font-bold text-ink font-serif">Producers List</h2>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded mb-4 text-sm">
            {success}
          </div>
        )}

        {errorMessages.general && (
          <div className="bg-red-50 border-l-4 border-vermilion text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {errorMessages.general[0]}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by name..."
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={openAddForm}
              className="flex items-center gap-2 bg-vermilion text-white px-4 py-2.5 rounded-lg hover:bg-deep-red transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" /> Add Producer
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Producer Name', 'Contact', 'Email', 'Address', 'Registration Number', 'Actions'].map(col => (
                  <th key={col} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-3 text-gray-500 text-sm">
                      <Loader2 className="h-5 w-5 animate-spin text-vermilion" />
                      Loading producers...
                    </div>
                  </td>
                </tr>
              ) : producers.length > 0 ? (
                producers.map(producer => (
                  <tr key={producer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{producer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producer.contact}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producer.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{producer.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producer.registration_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEditClick(producer)}
                        className="flex items-center gap-1.5 text-vermilion hover:text-deep-red font-medium transition-colors text-sm"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                    No producers available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <button
            disabled={offset === 0}
            onClick={() => handlePageChange(offset - limit)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              offset === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-vermilion text-white hover:bg-deep-red'
            }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            disabled={offset + limit >= totalCount}
            onClick={() => handlePageChange(offset + limit)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              offset + limit >= totalCount
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-vermilion text-white hover:bg-deep-red'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {formVisible && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-10 px-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-ink font-serif">
                {editingProducerId ? 'Edit Producer' : 'Add Producer'}
              </h3>
              <button onClick={closeForm} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessages.general && (
                <p className="text-red-500 text-sm">{errorMessages.general[0]}</p>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Producer Name <span className="text-vermilion">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${
                    errorMessages.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errorMessages.name && <p className="mt-1 text-xs text-red-600">{errorMessages.name[0]}</p>}
              </div>

              {/* Contact */}
              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Information <span className="text-vermilion">*</span>
                </label>
                <input
                  type="text"
                  id="contact"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                  className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${
                    errorMessages.contact ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errorMessages.contact && <p className="mt-1 text-xs text-red-600">{errorMessages.contact[0]}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${
                    errorMessages.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errorMessages.email && <p className="mt-1 text-xs text-red-600">{errorMessages.email[0]}</p>}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Physical Address <span className="text-vermilion">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition resize-none ${
                    errorMessages.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errorMessages.address && <p className="mt-1 text-xs text-red-600">{errorMessages.address[0]}</p>}
              </div>

              {/* Registration Number */}
              <div>
                <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number <span className="text-vermilion">*</span>
                </label>
                <input
                  type="text"
                  id="registration_number"
                  name="registration_number"
                  value={formData.registration_number}
                  onChange={handleChange}
                  required
                  className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-vermilion/30 focus:border-vermilion transition ${
                    errorMessages.registration_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errorMessages.registration_number && (
                  <p className="mt-1 text-xs text-red-600">{errorMessages.registration_number[0]}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-vermilion text-white rounded-lg hover:bg-deep-red text-sm font-medium transition-colors"
                >
                  {editingProducerId ? 'Update Producer' : 'Add Producer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
