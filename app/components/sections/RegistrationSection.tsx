'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useToast } from '../context/ToastContext';
import { businessRegistrationAPI } from '../../services/businessRegistration';
import { BusinessRegistrationRequest, Prefecture, BusinessCategory } from '../../types/business-registration';

const prefectures: Prefecture[] = [
  { value: '', label: 'Select Prefecture' },
  { value: 'hokkaido', label: 'Hokkaido' },
  { value: 'aomori', label: 'Aomori' },
  { value: 'iwate', label: 'Iwate' },
  { value: 'miyagi', label: 'Miyagi' },
  { value: 'akita', label: 'Akita' },
  { value: 'yamagata', label: 'Yamagata' },
  { value: 'fukushima', label: 'Fukushima' },
  { value: 'ibaraki', label: 'Ibaraki' },
  { value: 'tochigi', label: 'Tochigi' },
  { value: 'gunma', label: 'Gunma' },
  { value: 'saitama', label: 'Saitama' },
  { value: 'chiba', label: 'Chiba' },
  { value: 'tokyo', label: 'Tokyo' },
  { value: 'kanagawa', label: 'Kanagawa' },
  { value: 'niigata', label: 'Niigata' },
  { value: 'toyama', label: 'Toyama' },
  { value: 'ishikawa', label: 'Ishikawa' },
  { value: 'fukui', label: 'Fukui' },
  { value: 'yamanashi', label: 'Yamanashi' },
  { value: 'nagano', label: 'Nagano' },
  { value: 'gifu', label: 'Gifu' },
  { value: 'shizuoka', label: 'Shizuoka' },
  { value: 'aichi', label: 'Aichi' },
  { value: 'mie', label: 'Mie' },
  { value: 'shiga', label: 'Shiga' },
  { value: 'kyoto', label: 'Kyoto' },
  { value: 'osaka', label: 'Osaka' },
  { value: 'hyogo', label: 'Hyogo' },
  { value: 'nara', label: 'Nara' },
  { value: 'wakayama', label: 'Wakayama' },
  { value: 'tottori', label: 'Tottori' },
  { value: 'shimane', label: 'Shimane' },
  { value: 'okayama', label: 'Okayama' },
  { value: 'hiroshima', label: 'Hiroshima' },
  { value: 'yamaguchi', label: 'Yamaguchi' },
  { value: 'tokushima', label: 'Tokushima' },
  { value: 'kagawa', label: 'Kagawa' },
  { value: 'ehime', label: 'Ehime' },
  { value: 'kochi', label: 'Kochi' },
  { value: 'fukuoka', label: 'Fukuoka' },
  { value: 'saga', label: 'Saga' },
  { value: 'nagasaki', label: 'Nagasaki' },
  { value: 'kumamoto', label: 'Kumamoto' },
  { value: 'oita', label: 'Oita' },
  { value: 'miyazaki', label: 'Miyazaki' },
  { value: 'kagoshima', label: 'Kagoshima' },
  { value: 'okinawa', label: 'Okinawa' }
];

const businessCategories: BusinessCategory[] = [
  { value: '', label: 'Select Category' },
  { value: 'agriculture', label: 'Agricultural Products (Vegetables & Fruits)' },
  { value: 'livestock', label: 'Livestock Products (Meat & Dairy)' },
  { value: 'marine', label: 'Marine Products (Seafood)' },
  { value: 'processed_food', label: 'Processed Foods & Prepared Meals' },
  { value: 'rice_grains', label: 'Rice & Grains' },
  { value: 'beverages', label: 'Beverages & Alcohol' },
  { value: 'daily_goods', label: 'Daily Goods & General Merchandise' },
  { value: 'health_food', label: 'Health Foods & Supplements' },
  { value: 'other', label: 'Other' }
];

// Validation Schema
const schema = yup.object({
  username: yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup.string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  password2: yup.string()
    .required('Password confirmation is required')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  first_name: yup.string()
    .required('First name is required')
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters'),
  last_name: yup.string()
    .required('Last name is required')
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters'),
  phone_number: yup.string()
    .required('Phone number is required')
    .matches(/^[0-9\-\+\(\)\s]+$/, 'Please enter a valid phone number'),
  registered_business_name: yup.string()
    .required('Registered business name is required')
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name cannot exceed 100 characters'),
  corporate_number: yup.string()
    .transform(value => value === '' ? undefined : value)
    .matches(/^[0-9]{13}$/, 'Corporate number must be exactly 13 digits')
    .optional(),
  prefecture: yup.string()
    .required('Prefecture is required')
    .notOneOf([''], 'Please select a prefecture'),
  business_category: yup.string()
    .required('Business category is required')
    .notOneOf([''], 'Please select a business category'),
  invoice_registration_number: yup.string()
    .transform(value => value === '' ? undefined : value)
    .matches(/^T[0-9]{13}$/, 'Invoice registration number must be in format T followed by 13 digits')
    .optional(),
  business_overview: yup.string()
    .transform(value => value === '' ? undefined : value)
    .max(500, 'Business overview cannot exceed 500 characters')
    .optional(),
}).required();

type FormData = yup.InferType<typeof schema>;

const complianceItems = [
  'Food Hygiene Law & JAS Law compliant product management system',
  'Automatic generation of displays based on Specified Commercial Transactions Act',
  'Invoice System compliance (Qualified Invoice Issuer registration)',
  'Personal Information Protection Law & APPI compliant data management',
  'Automatic calculation & classification display of consumption tax (reduced tax rates)',
  'Electronic Bookkeeping Act compliant transaction records',
  'Ministry of Agriculture, Forestry and Fisheries guideline compliant origin labeling'
];

export default function RegistrationSection() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: {
      username: '',
      email: '',
      password: '',
      password2: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      registered_business_name: '',
      prefecture: '',
      business_category: '',
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);

    try {
      // Convert form data to API request format
      const apiData: BusinessRegistrationRequest = {
        username: data.username,
        email: data.email,
        password: data.password,
        password2: data.password2,
        first_name: data.first_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        registered_business_name: data.registered_business_name,
        prefecture: data.prefecture,
        business_category: data.business_category,
        // Only include optional fields if they have values
        ...(data.corporate_number && { corporate_number: data.corporate_number }),
        ...(data.invoice_registration_number && { invoice_registration_number: data.invoice_registration_number }),
        ...(data.business_overview && { business_overview: data.business_overview }),
      };

      const result = await businessRegistrationAPI.register(apiData);

      // Success handling
      showSuccess(
        'Registration Successful!',
        'Your business registration has been completed successfully. You should receive a confirmation email shortly.'
      );

      // Reset form
      reset();

      // Optional: Navigate to login or dashboard
      // setTimeout(() => {
      //   router.push('/login');
      // }, 2000);

    } catch (error: any) {
      // Error handling
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else {
          // Handle field-specific errors
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join('\n');
          
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError('Registration Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="bg-rice py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-8 lg:px-20" id="register">
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-ink leading-tight mb-4">
          Business Registration
        </h2>
        <p className="text-gray-600 leading-relaxed max-w-2xl text-sm sm:text-base mb-8 sm:mb-12">
          Join Ichiba Bazaar and connect with customers and buyers nationwide. 
          Registration is free of charge.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-start">
          {/* Left Side - Information */}
          <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl text-ink mb-3 sm:mb-4">
                Safe Platform<br/>
                Compliant with Japanese Laws
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
                Ichiba Bazaar is fully compliant with Japan's Food Sanitation Law, 
                Specified Commercial Transactions Act, and Personal Information Protection Law. 
                Both corporations and sole proprietorships can register.
              </p>
              
              <ul className="space-y-0">
                {complianceItems.map((item, index) => (
                  <li 
                    key={index}
                    className="flex items-start gap-3 py-3 border-b border-black/7 text-sm text-gray-700"
                  >
                    <span className="text-moss font-bold flex-shrink-0 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Right Side - Form */}
          <div className="bg-white p-4 sm:p-6 lg:p-8 xl:p-10 border border-black/8 shadow-xl order-1 lg:order-2">
            <h3 className="font-serif text-lg sm:text-xl text-ink mb-1">Register Business Information</h3>
            <span className="font-mono text-xs text-vermilion tracking-[0.15em] block mb-6 sm:mb-7">
              BUSINESS REGISTRATION FORM
            </span>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                  Username <span className="text-vermilion">*</span>
                </label>
                <input
                  type="text"
                  {...register('username')}
                  placeholder="e.g. yamada_farm"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none"
                />
                {errors.username && (
                  <p className="text-vermilion text-xs mt-1">{errors.username.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                  Email Address <span className="text-vermilion">*</span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="e.g. info@yamada-farm.co.jp"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none"
                />
                {errors.email && (
                  <p className="text-vermilion text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                    Password <span className="text-vermilion">*</span>
                  </label>
                  <input
                    type="password"
                    {...register('password')}
                    placeholder="Create a strong password"
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none"
                  />
                  {errors.password && (
                    <p className="text-vermilion text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                    Confirm Password <span className="text-vermilion">*</span>
                  </label>
                  <input
                    type="password"
                    {...register('password2')}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none"
                  />
                  {errors.password2 && (
                    <p className="text-vermilion text-xs mt-1">{errors.password2.message}</p>
                  )}
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                    First Name <span className="text-vermilion">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('first_name')}
                    placeholder="e.g. Taro"
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none"
                  />
                  {errors.first_name && (
                    <p className="text-vermilion text-xs mt-1">{errors.first_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                    Last Name <span className="text-vermilion">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('last_name')}
                    placeholder="e.g. Yamada"
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none"
                  />
                  {errors.last_name && (
                    <p className="text-vermilion text-xs mt-1">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                  Phone Number <span className="text-vermilion">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phone_number')}
                  placeholder="e.g. 03-1234-5678"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none"
                />
                {errors.phone_number && (
                  <p className="text-vermilion text-xs mt-1">{errors.phone_number.message}</p>
                )}
              </div>

              {/* Business Name & Corporate Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                    Registered Business Name <span className="text-vermilion">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('registered_business_name')}
                    placeholder="e.g. Yamada Farm"
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none"
                  />
                  {errors.registered_business_name && (
                    <p className="text-vermilion text-xs mt-1">{errors.registered_business_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                    Corporate Number
                  </label>
                  <input
                    type="text"
                    {...register('corporate_number')}
                    placeholder="1234567890123 (13 digits)"
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none"
                  />
                  {errors.corporate_number && (
                    <p className="text-vermilion text-xs mt-1">{errors.corporate_number.message}</p>
                  )}
                </div>
              </div>
              
              {/* Prefecture & Business Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                    Prefecture <span className="text-vermilion">*</span>
                  </label>
                  <select
                    {...register('prefecture')}
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none"
                  >
                    {prefectures.map((pref) => (
                      <option key={pref.value} value={pref.value}>
                        {pref.label}
                      </option>
                    ))}
                  </select>
                  {errors.prefecture && (
                    <p className="text-vermilion text-xs mt-1">{errors.prefecture.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                    Business Category <span className="text-vermilion">*</span>
                  </label>
                  <select
                    {...register('business_category')}
                    className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none"
                  >
                    {businessCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  {errors.business_category && (
                    <p className="text-vermilion text-xs mt-1">{errors.business_category.message}</p>
                  )}
                </div>
              </div>
              
              {/* Invoice Registration Number */}
              <div>
                <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                  Invoice Registration Number (Qualified Invoice Issuer)
                </label>
                <input
                  type="text"
                  {...register('invoice_registration_number')}
                  placeholder="T1234567890123 (T + 13 digits, optional)"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none"
                />
                {errors.invoice_registration_number && (
                  <p className="text-vermilion text-xs mt-1">{errors.invoice_registration_number.message}</p>
                )}
              </div>
              
              {/* Business Overview */}
              <div>
                <label className="block text-xs font-medium text-slate mb-1.5 tracking-wide">
                  Business Overview
                </label>
                <textarea
                  {...register('business_overview')}
                  placeholder="Please describe your products, specialties, and strengths (max 500 characters)"
                  className="w-full px-3 py-2.5 border border-gray-200 text-sm text-ink bg-gray-50 transition-colors focus:border-vermilion focus:bg-white outline-none resize-vertical min-h-[80px]"
                />
                {errors.business_overview && (
                  <p className="text-vermilion text-xs mt-1">{errors.business_overview.message}</p>
                )}
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-vermilion text-white px-4 py-3.5 text-base font-medium border-none cursor-pointer tracking-wide mt-6 transition-all duration-200 hover:bg-deep-red hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </span>
                ) : (
                  'Register for Free'
                )}
              </button>
              
              {/* Note */}
              <p className="text-xs text-gray-500 mt-3 text-center leading-relaxed">
                By registering, you agree to our{' '}
                <a href="#" className="text-vermilion">Terms of Service</a> and{' '}
                <a href="#" className="text-vermilion">Privacy Policy</a>.<br/>
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
