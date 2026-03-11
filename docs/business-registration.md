# Business Registration System Documentation

## Overview
The business registration system provides a comprehensive form for businesses to register on the marketplace platform. It includes validation, API integration, and error handling for a complete user experience.

## Architecture

### Components
- **RegistrationSection.tsx**: Main registration form component with validation
- **ToastContext.tsx**: Global notification system for success/error messages
- **LocationPicker.tsx**: Prefecture selection component

### Services
- **businessRegistrationAPI**: API service for business registration endpoints
- **apiErrors**: Utility functions for standardized error handling

### Types
- **business-registration.ts**: TypeScript interfaces for API requests and responses

## Form Fields
The registration form collects the following business information:

```json
{
  "username": "yamada_farm",
  "email": "info@yamada-farm.co.jp",
  "password": "securepassword123",
  "password2": "securepassword123",
  "first_name": "Taro",
  "last_name": "Yamada",
  "phone_number": "03-1234-5678",
  "registered_business_name": "Yamada Farm",
  "corporate_number": "1234567890123",
  "prefecture": "tokyo",
  "business_category": "agriculture",
  "invoice_registration_number": "T1234567890123",
  "business_overview": "We specialize in organic vegetables."
}
```

## Validation Rules

### Required Fields
- Username (3-30 characters, alphanumeric and underscores)
- Email (valid email format)
- Password (8+ characters, complexity requirements)
- Password confirmation (must match password)
- First name (1-50 characters)
- Last name (1-50 characters)
- Phone number (valid format)
- Registered business name (2-100 characters)
- Prefecture (must be selected)
- Business category (must be selected)

### Optional Fields
- Corporate number (13 digits if provided)
- Invoice registration number (T + 13 digits if provided)
- Business overview (max 500 characters)

## API Integration

### Endpoints
- `POST /api/register/business/` - Register new business
- `GET /api/check-username/` - Check username availability
- `GET /api/check-email/` - Check email availability

### Environment Configuration
Set the API base URL in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Error Handling
The system provides comprehensive error handling:
- Network errors
- Validation errors (field-specific)
- Server errors
- Custom error messages via toast notifications

## Usage

1. User fills out the registration form
2. Client-side validation occurs in real-time
3. On submission, data is sent to the API
4. Success/error messages are displayed via toast notifications
5. Form is reset on successful registration

## Development

### Running the Application
```bash
npm run dev
```

### Testing Registration
1. Start the Next.js development server
2. Navigate to the registration section
3. Fill out the form with valid data
4. Submit and observe console logs for API calls

### Backend Requirements
The backend should implement:
- Business registration endpoint
- User authentication
- Field validation
- Proper error responses in JSON format

## Future Enhancements
- Real-time username/email availability checking
- File upload for business documents
- Multi-step form wizard
- Business verification process
- Email confirmation workflow