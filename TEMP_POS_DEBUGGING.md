# Temporary POS Routing - Debugging Guide

## Issue: POSRouter aa raha hai instead of TempPOSRouter

### Step 1: Check Backend API Response
Login API se yeh response aana chahiye:
```json
{
  "message": "Login successful",
  "user": {
    "id": 123,
    "username": "temp_user",
    "user_type": "temp_pos",  // ← Yeh EXACTLY "temp_pos" hona chahiye
    "branch": 1
  },
  "tokens": {
    "access": "...",
    "refresh": "..."
  }
}
```

**Important:** `user_type` field must be exactly `"temp_pos"` (lowercase, with underscore)

### Step 2: Check Browser Console Logs
Login karne ke baad browser console mein yeh logs dikhne chahiye:

```
Login successful, API response: {...}
User type from API: temp_pos
User data being passed to onLogin: {...}
handleLogin called with: {...}
Rendering app for user: {...}
User type detected: temp_pos
Rendering TempPOSRouter for temp_pos user
TempPOSRouter mounted with user: {...}
User type in TempPOSRouter: temp_pos
```

### Step 3: Check localStorage
Browser DevTools → Application → Local Storage mein check karo:
- `access_token` - Should exist
- `refresh_token` - Should exist
- `user_type` - Should be "temp_pos"

### Step 4: Common Issues & Solutions

#### Issue 1: user_type is "pos" instead of "temp_pos"
**Solution:** Backend mein user_type field ko "temp_pos" set karo

#### Issue 2: user_type is null or undefined
**Solution:** Backend API response mein user_type field add karo

#### Issue 3: Still showing POSRouter
**Solution:** 
1. Logout karo
2. localStorage clear karo
3. Fresh login karo with temp_pos user

#### Issue 4: Case sensitivity issue
**Solution:** Ensure backend sends exactly "temp_pos" (lowercase)

### Step 5: Test URL
After login, manually navigate to:
- `http://localhost:3000/test` - Should show TempPOSTestPage with user info

### Step 6: Force Refresh
1. Clear browser cache
2. Hard refresh (Ctrl + Shift + R)
3. Try in incognito mode

### Backend User Creation Example
```python
# Django example
user = User.objects.create(
    username='temp_user',
    user_type='temp_pos',  # ← Important
    branch_id=1
)
```

### Quick Test
Run this in browser console after login:
```javascript
console.log('User:', JSON.parse(localStorage.getItem('user_type')))
console.log('Should be: temp_pos')
```

### Expected Behavior
✅ Login with temp_pos user → TempPOSRouter loads
✅ Only Temporary POS page accessible
✅ No sidebar, no other routes
✅ Clean header with logout button

### If Still Not Working
1. Check `app/page.jsx` - temp_pos condition should be FIRST
2. Check `components/LoginPage.jsx` - user_type should be stored
3. Check backend API - user_type field in response
4. Clear all localStorage and try fresh login
