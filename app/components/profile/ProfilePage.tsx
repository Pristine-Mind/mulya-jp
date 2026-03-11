'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  ArrowLeft,
  Loader2,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Tag,
  FileText,
  Hash,
  Receipt,
  Calendar,
  Pencil,
  Save,
  X,
} from 'lucide-react';

const apiBase = process.env.NEXT_PUBLIC_API_URL;
function authHeaders() {
  return { Authorization: `Token ${localStorage.getItem('token')}` };
}

interface UserProfile {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  registered_business_name: string;
  corporate_number: string | null;
  prefecture: string;
  business_category: string;
  invoice_registration_number: string | null;
  business_overview: string;
  created_at: string;
  updated_at: string;
}

type EditableFields = Pick<
  UserProfile,
  | 'first_name'
  | 'last_name'
  | 'phone_number'
  | 'registered_business_name'
  | 'corporate_number'
  | 'prefecture'
  | 'business_category'
  | 'invoice_registration_number'
  | 'business_overview'
>;

function fmt(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [form, setForm] = useState<EditableFields>({
    first_name: '',
    last_name: '',
    phone_number: '',
    registered_business_name: '',
    corporate_number: '',
    prefecture: '',
    business_category: '',
    invoice_registration_number: '',
    business_overview: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/'); return; }

    axios
      .get<UserProfile>(`${apiBase}/api/v1/profile/`, { headers: authHeaders() })
      .then(res => {
        setProfile(res.data);
        setForm({
          first_name: res.data.first_name,
          last_name: res.data.last_name,
          phone_number: res.data.phone_number,
          registered_business_name: res.data.registered_business_name,
          corporate_number: res.data.corporate_number ?? '',
          prefecture: res.data.prefecture,
          business_category: res.data.business_category,
          invoice_registration_number: res.data.invoice_registration_number ?? '',
          business_overview: res.data.business_overview,
        });
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await axios.patch<UserProfile>(
        `${apiBase}/api/v1/profile/`,
        {
          ...form,
          corporate_number: form.corporate_number || null,
          invoice_registration_number: form.invoice_registration_number || null,
        },
        { headers: authHeaders() }
      );
      setProfile(res.data);
      setEditing(false);
    } catch {
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!profile) return;
    setForm({
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone_number: profile.phone_number,
      registered_business_name: profile.registered_business_name,
      corporate_number: profile.corporate_number ?? '',
      prefecture: profile.prefecture,
      business_category: profile.business_category,
      invoice_registration_number: profile.invoice_registration_number ?? '',
      business_overview: profile.business_overview,
    });
    setSaveError('');
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rice flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vermilion" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-rice flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : 'U';

  return (
    <div className="min-h-screen bg-rice">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push('/home')}
          className="flex items-center gap-2 text-gray-500 hover:text-ink transition"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>
        <h1 className="font-serif text-xl font-bold text-ink">My Profile</h1>
        <div className="w-32" />
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Avatar card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-vermilion to-deep-red flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink">
              {profile?.full_name || `${profile?.first_name} ${profile?.last_name}`}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">{profile?.email}</p>
            {profile?.business_category && (
              <span className="inline-block mt-2 text-xs bg-vermilion/10 text-vermilion px-2.5 py-0.5 rounded-full font-medium capitalize">
                {profile.business_category}
              </span>
            )}
          </div>
          <div className="ml-auto">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 bg-vermilion text-white text-sm px-4 py-2 rounded-lg hover:bg-deep-red transition"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-vermilion text-white text-sm px-4 py-2 rounded-lg hover:bg-deep-red transition disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gray-100 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {saveError}
          </p>
        )}

        {/* Personal Info */}
        <Section title="Personal Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field icon={<User className="h-4 w-4" />} label="First Name">
              {editing ? (
                <input
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  className="input-style"
                />
              ) : (
                profile?.first_name || '—'
              )}
            </Field>
            <Field icon={<User className="h-4 w-4" />} label="Last Name">
              {editing ? (
                <input
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  className="input-style"
                />
              ) : (
                profile?.last_name || '—'
              )}
            </Field>
            <Field icon={<Mail className="h-4 w-4" />} label="Email">
              <span className="text-gray-400">{profile?.email}</span>
            </Field>
            <Field icon={<Phone className="h-4 w-4" />} label="Phone Number">
              {editing ? (
                <input
                  value={form.phone_number}
                  onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                  className="input-style"
                />
              ) : (
                profile?.phone_number || '—'
              )}
            </Field>
          </div>
        </Section>

        {/* Business Info */}
        <Section title="Business Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field icon={<Building2 className="h-4 w-4" />} label="Registered Business Name" span>
              {editing ? (
                <input
                  value={form.registered_business_name}
                  onChange={e => setForm(f => ({ ...f, registered_business_name: e.target.value }))}
                  className="input-style"
                />
              ) : (
                profile?.registered_business_name || '—'
              )}
            </Field>
            <Field icon={<Hash className="h-4 w-4" />} label="Corporate Number">
              {editing ? (
                <input
                  value={form.corporate_number ?? ''}
                  onChange={e => setForm(f => ({ ...f, corporate_number: e.target.value }))}
                  className="input-style"
                />
              ) : (
                profile?.corporate_number || '—'
              )}
            </Field>
            <Field icon={<MapPin className="h-4 w-4" />} label="Prefecture">
              {editing ? (
                <input
                  value={form.prefecture}
                  onChange={e => setForm(f => ({ ...f, prefecture: e.target.value }))}
                  className="input-style"
                />
              ) : (
                profile?.prefecture || '—'
              )}
            </Field>
            <Field icon={<Tag className="h-4 w-4" />} label="Business Category">
              {editing ? (
                <input
                  value={form.business_category}
                  onChange={e => setForm(f => ({ ...f, business_category: e.target.value }))}
                  className="input-style"
                />
              ) : (
                profile?.business_category || '—'
              )}
            </Field>
            <Field icon={<Receipt className="h-4 w-4" />} label="Invoice Registration Number">
              {editing ? (
                <input
                  value={form.invoice_registration_number ?? ''}
                  onChange={e => setForm(f => ({ ...f, invoice_registration_number: e.target.value }))}
                  className="input-style"
                />
              ) : (
                profile?.invoice_registration_number || '—'
              )}
            </Field>
            <Field icon={<FileText className="h-4 w-4" />} label="Business Overview" span>
              {editing ? (
                <textarea
                  value={form.business_overview}
                  onChange={e => setForm(f => ({ ...f, business_overview: e.target.value }))}
                  rows={3}
                  className="input-style resize-none"
                />
              ) : (
                profile?.business_overview || '—'
              )}
            </Field>
          </div>
        </Section>

        {/* Account Meta */}
        <Section title="Account Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field icon={<User className="h-4 w-4" />} label="Username">
              <span className="text-gray-400">{profile?.username}</span>
            </Field>
            <Field icon={<Calendar className="h-4 w-4" />} label="Member Since">
              {fmt(profile?.created_at ?? '')}
            </Field>
            <Field icon={<Calendar className="h-4 w-4" />} label="Last Updated">
              {fmt(profile?.updated_at ?? '')}
            </Field>
          </div>
        </Section>
      </main>

      <style jsx>{`
        .input-style {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.375rem 0.625rem;
          font-size: 0.875rem;
          color: #1f2937;
          outline: none;
          transition: border-color 0.15s;
        }
        .input-style:focus {
          border-color: #e03c31;
          box-shadow: 0 0 0 2px rgba(224,60,49,0.15);
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-serif text-base font-bold text-ink mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  icon,
  label,
  span,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  span?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={span ? 'sm:col-span-2' : ''}>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-400 mb-1.5">
        {icon}
        {label}
      </label>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}
