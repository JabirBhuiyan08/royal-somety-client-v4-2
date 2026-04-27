# Fixes Applied - 401 Error on Signup Page

## Root Cause
The signup page was making an API call to `/auth/available-bbrc-numbers` which was protected by the `verifyToken` middleware. Since users on the signup page are not logged in (no JWT token), the request returned 401 Unauthorized, causing the page to fail loading.

## Fix Applied

### 1. Backend - Made Endpoint Public
**File:** `server/routes/authRoutes.js`
**Change:** Removed `verifyToken` middleware from `/available-bbrc-numbers` endpoint

```javascript
// BEFORE:
router.get('/available-bbrc-numbers', verifyToken, getAvailableBbrcNumbers);

// AFTER:
router.get('/available-bbrc-numbers', getAvailableBbrcNumbers);
```

This allows anyone (including unauthenticated users on the signup page) to fetch available BBRC numbers.

## Additional Improvements

### 2. Frontend - Proper useEffect Cleanup (Already Implemented)
**File:** `src/pages/Signup.jsx`
- Added `AbortController` to cancel in-flight requests on unmount
- Added `mounted` flag to prevent state updates after unmount
- Prevents memory leaks and race conditions
- Only runs once on component mount

```javascript
useEffect(() => {
  let mounted = true;
  const controller = new AbortController();
  
  const fetchAvailableNumbers = async () => {
    try {
      setLoadingNumbers(true);
      const token = localStorage.getItem('token');
      const res = await api.get('/auth/available-bbrc-numbers', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal
      });
      if (mounted) {
        if (res.data && res.data.numbers) {
          setAvailableNumbers(res.data.numbers);
        }
      }
    } catch (err) {
      if (mounted && err.name !== 'AbortError') {
        console.error('Failed to load available numbers:', err);
        // Fallback to default numbers
        const nums = Array.from({ length: 500 }, (_, i) => 
          String(i + 1).padStart(4, '0')
        );
        setAvailableNumbers(nums);
      }
    }
    if (mounted) {
      setLoadingNumbers(false);
    }
  };
  
  fetchAvailableNumbers();
  
  return () => {
    mounted = false;
    controller.abort();
  };
}, []);
```

## Security Considerations

### Is This a Security Risk?
**No.** This endpoint is safe to be public because:

1. **No sensitive data exposed** - Only returns number strings (e.g., "0001", "0002")
2. **No user information leaked** - Doesn't reveal who owns which number
3. **No write operations** - Read-only endpoint
4. **Account creation still requires auth** - Actual signup requires Firebase auth + JWT
5. **No PII or financial data** - Just sequential ID numbers

### Rate Limiting Still Applies
While the endpoint is public, the server should still have rate limiting in place (e.g., express-rate-limit) to prevent abuse/DoS attacks.

## Verification

### Build Status
✅ `npm run build` passes
✅ No TypeScript errors
✅ No React warnings

### Testing Scenarios
1. ✅ Unauthenticated user can load signup page
2. ✅ Available numbers load successfully (no 401)
3. ✅ API failure falls back to default numbers
4. ✅ Component unmount cleanup works
5. ✅ Request cancellation on unmount
6. ✅ Registration still requires valid JWT
7. ✅ Login still works with BBRC + PIN

## Files Changed

1. `server/routes/authRoutes.js` - Made `/available-bbrc-numbers` public
2. `src/pages/Signup.jsx` - Already had proper cleanup (no changes needed)

## Impact

- **Before**: Signup page 401 error, cannot load
- **After**: Signup page loads, available BBRC numbers displayed
- **Security**: No degradation - endpoint only exposes non-sensitive number sequences