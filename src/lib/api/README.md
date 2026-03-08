# API Client Documentation

## CSRF Protection

This application implements Cross-Site Request Forgery (CSRF) protection for all non-GET requests to the backend API.

### How CSRF Protection Works

1. The backend sets an `XSRF-TOKEN` cookie when you visit the site or make a GET request to `/auth/csrf-token`.
2. For any non-GET request (POST, PUT, DELETE, etc.), the frontend must include this token in the `X-CSRF-TOKEN` header.
3. The backend verifies that the token in the header matches the one in the cookie.
4. If they don't match, the request is rejected with a 403 Forbidden error.

### Implementation Details

The CSRF protection is implemented in several layers:

1. **Axios Client Interceptors** (`axios-client.ts`):
   - Automatically adds the CSRF token from cookies to the `X-CSRF-TOKEN` header for all non-GET requests
   - If no token is found, it attempts to fetch one from the server
   - Implements retry with exponential backoff for CSRF token failures
   - Handles 403 errors related to CSRF token validation

2. **CSRF Context** (`contexts/CsrfContext.tsx`):
   - Provides application-wide CSRF token management
   - Offers a `withCsrfProtection` function to wrap sensitive operations
   - Maintains token freshness with automatic token refresh
   - Tracks token age to minimize unnecessary refreshes

3. **CsrfProtectedForm Component** (`components/form/CsrfProtectedForm.tsx`):
   - Wraps form submissions with CSRF protection
   - Automatically refreshes the token before form submission
   - Provides error handling and prevents multiple submissions

### Usage

#### For Regular API Calls

No special handling is needed - the axios interceptors automatically add the CSRF token.

```typescript
// This automatically includes CSRF protection
await axiosClient.post('/api/v1/some/endpoint', data);
```

#### For Forms

Wrap your forms with the `CsrfProtectedForm` component:

```tsx
import { CsrfProtectedForm } from '@/components/form/CsrfProtectedForm';

function MyForm() {
  const handleSubmit = async (e) => {
    // Form submission logic
  };

  return (
    <CsrfProtectedForm onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Submit</button>
    </CsrfProtectedForm>
  );
}
```

#### For Custom Operations

Use the `useCsrf` hook:

```tsx
import { useCsrf } from '@/contexts/CsrfContext';

function MyComponent() {
  const { withCsrfProtection } = useCsrf();

  const handleSensitiveOperation = async () => {
    await withCsrfProtection(async () => {
      // Your protected operation
      await apiClient.someOperation();
    });
  };

  return <button onClick={handleSensitiveOperation}>Perform Action</button>;
}
```

### Error Handling

CSRF-related errors are handled at multiple levels:

1. The axios interceptor automatically retries failed requests with a fresh token
2. The CsrfContext provides error state that can be displayed to users
3. The CsrfProtectedForm displays CSRF-specific errors automatically

## API Services

The application uses separate API service modules for different entity types:

- `auth-api.ts` - Authentication and user management
- `products-api.ts` - Product management
- `categories-api.ts` - Category management
- etc.

Each service encapsulates the API calls related to its domain and provides strongly typed interfaces for request and response data. 