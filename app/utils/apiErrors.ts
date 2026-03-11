export interface ApiError {
  message: string;
  statusCode?: number;
  fieldErrors?: Record<string, string[]>;
}

export const handleApiError = (error: any): ApiError => {
  if (error.response?.data) {
    const { data, status } = error.response;
    
    // If it's a string message
    if (typeof data === 'string') {
      return {
        message: data,
        statusCode: status,
      };
    }
    
    // If it has a message property
    if (data.message) {
      return {
        message: data.message,
        statusCode: status,
        fieldErrors: data.errors || undefined,
      };
    }
    
    // If it has field-specific errors (Django REST Framework format)
    if (data.non_field_errors || Object.keys(data).some(key => key !== 'detail')) {
      const fieldErrors: Record<string, string[]> = {};
      let message = 'Validation errors occurred.';
      
      Object.entries(data).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          fieldErrors[field] = messages;
        } else if (typeof messages === 'string') {
          fieldErrors[field] = [messages];
        }
      });
      
      return {
        message,
        statusCode: status,
        fieldErrors,
      };
    }
    
    // If it has a detail property (Django default)
    if (data.detail) {
      return {
        message: data.detail,
        statusCode: status,
      };
    }
  }
  
  // Fallback for network errors or other issues
  return {
    message: error.message || 'An unexpected error occurred. Please try again.',
    statusCode: error.code === 'NETWORK_ERROR' ? 0 : undefined,
  };
};

export const formatFieldErrors = (fieldErrors: Record<string, string[]>): string => {
  return Object.entries(fieldErrors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
};