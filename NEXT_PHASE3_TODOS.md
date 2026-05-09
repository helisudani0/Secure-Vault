# Phase 3 Remaining Todos - Detailed Execution Plan

**Progress**: 3/8 complete (40%) → 5/8 remaining (60%)

---

## TODO 1: Accessibility Features (ESTIMATED: 8-10 hours)

### Goals
- Add ARIA labels to all interactive elements
- Implement keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Focus management and visible focus indicators
- Semantic HTML throughout
- Color contrast verification
- Screen reader compatibility

### Implementation Steps

#### 1.1 Update Form Components (Form.jsx)
```jsx
// Add to FormInput:
- aria-label="[field label]"
- aria-describedby="[error-id]" when error present
- aria-invalid="true/false"
- aria-required="true" when required
- onKeyDown handlers for special keys

// Add to FormSelect:
- Role attributes
- ARIA-expanded, ARIA-haspopup
- Arrow key support for dropdown

// Add to all form components:
- Tab order using tabIndex
- Visible focus outlines (not just :focus-visible)
```

#### 1.2 Create AccessibleModal Component
```jsx
// Features:
- Focus trap (tab stays within modal)
- Escape key to close
- aria-modal="true"
- aria-labelledby="[title-id]"
- Role="dialog"
- Return focus to trigger on close
```

#### 1.3 Update ResponsiveLayout Components
```jsx
// Add semantic HTML:
- Use <nav>, <main>, <section>, <article>
- Use <button> instead of <div> with click
- Use <header>, <footer>, <aside>
- Proper heading hierarchy (h1, h2, h3, etc.)

// Add skip links:
- Skip to main content link
- Skip to navigation link
```

#### 1.4 Create AccessibilityChecker Utility
```jsx
// Helper functions:
- ensureContrast(color1, color2) - Check WCAG AA/AAA
- getLuminance(color) - Calculate relative luminance
- getContrastRatio(fg, bg) - Calculate contrast ratio
- validateAriaLabels() - Runtime validation
```

#### 1.5 Update LoadingStates for Accessibility
```jsx
// Spinner:
- aria-busy="true" on container
- aria-label="Loading..."
- Role="status"

// Skeleton:
- aria-hidden="true" (placeholder, not actual content)

// ProgressBar:
- Role="progressbar"
- aria-valuenow
- aria-valuemin="0"
- aria-valuemax="100"
```

#### 1.6 Update ErrorBoundary for Accessibility
```jsx
// ErrorMessage:
- Role="alert"
- aria-live="assertive"
- aria-atomic="true"

// FieldError:
- Clear id for aria-describedby
- aria-role="alert"
```

#### 1.7 Keyboard Navigation Map
```
Global:
- Alt+H: Help/Shortcuts
- Alt+D: Dashboard
- Alt+S: Settings
- Alt+L: Logout

Form:
- Tab: Next field
- Shift+Tab: Previous field
- Enter: Submit (on button)
- Escape: Cancel

File List:
- Arrow Up/Down: Navigate files
- Enter: Open file details
- Delete: Delete file
- Spacebar: Select/toggle
- Ctrl+A: Select all
```

#### 1.8 Add Focus Management
```jsx
// Create useKeyboardNavigation hook
- Track focused element
- Handle ArrowUp/ArrowDown on lists
- Handle Home/End for first/last
- Prevent default scrolling with arrow keys

// Create useFocusTrap hook
- Keep focus within element
- Circular tab (last → first)
- Release on unmount
```

#### 1.9 Testing Checklist
```
- [ ] Tab through entire app (should hit all interactive elements)
- [ ] All form fields have labels (visual + screen reader)
- [ ] All buttons have text or aria-label
- [ ] All images have alt text (if visible)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators visible on all interactive elements
- [ ] Test with screen reader (NVDA on Windows, VoiceOver on Mac)
- [ ] Test keyboard-only navigation (no mouse)
- [ ] No keyboard traps (can escape any focus state)
- [ ] Logical tab order (left-to-right, top-to-bottom)
```

---

## TODO 2: Dark Mode Support (ESTIMATED: 6-8 hours)

### Goals
- Theme context provider with dark/light modes
- CSS variables for dynamic color switching
- Persistent theme preference (localStorage)
- Toggle button in header
- Beautiful dark color scheme

### Implementation Steps

#### 2.1 Create ThemeContext (NEW FILE)
```jsx
// Context:
- theme: 'light' | 'dark'
- toggleTheme(): void
- setTheme(theme): void

// Provider:
- Read localStorage on mount
- Save to localStorage on change
- Apply theme to document.documentElement

// Hook:
- useTheme() hook for consuming theme
```

#### 2.2 Create Dark Mode CSS Variables
```css
/* Update index.css with CSS variables:

Light Mode (default):
--color-bg-primary: #ffffff
--color-bg-secondary: #f9fafb
--color-text-primary: #1f2937
--color-text-secondary: #6b7280
--color-border: #e5e7eb
--color-input-bg: #f3f4f6

Dark Mode:
--color-bg-primary: #1f2937
--color-bg-secondary: #111827
--color-text-primary: #f9fafb
--color-text-secondary: #d1d5db
--color-border: #374151
--color-input-bg: #374151
*/

/* All components use variables:
body { background: var(--color-bg-primary); }
.input { background: var(--color-input-bg); }
.card { border-color: var(--color-border); }
```

#### 2.3 Create ThemeToggle Component
```jsx
// Component:
- Show sun/moon icon
- Position in header (top-right)
- Smooth transition on click
- Label: "Dark Mode" / "Light Mode"

// Styling:
- 30×30px button
- Rounded corners
- Hover effect
- Icon animation
```

#### 2.4 Update All Components for Dark Mode
```jsx
// Affected Components:
1. ResponsiveLayout.jsx - Header, Card, etc.
2. Form.jsx - Inputs, labels
3. LoadingStates.jsx - Spinners, overlays
4. ErrorBoundary.jsx - Error messages
5. ToastContext.jsx - Toast backgrounds

// Pattern:
- Use CSS variables only
- No hardcoded colors (except brand)
- Test on actual dark mode
```

#### 2.5 Define Color Scheme

**Light Mode:**
- Primary Background: #ffffff
- Secondary Background: #f9fafb (grays-50)
- Tertiary Background: #f3f4f6 (grays-100)
- Text Primary: #1f2937 (grays-800)
- Text Secondary: #6b7280 (grays-500)
- Border Color: #e5e7eb (grays-200)
- Input Background: #f3f4f6 (grays-100)

**Dark Mode:**
- Primary Background: #1f2937 (grays-800)
- Secondary Background: #111827 (grays-900)
- Tertiary Background: #374151 (grays-700)
- Text Primary: #f9fafb (grays-50)
- Text Secondary: #d1d5db (grays-300)
- Border Color: #374151 (grays-700)
- Input Background: #374151 (grays-700)

**Brand Colors (unchanged):**
- Primary: #6366f1 (Indigo)
- Success: #10b981 (Emerald)
- Danger: #ef4444 (Red)
- Warning: #f59e0b (Amber)

#### 2.6 Create Theme Transition Effect
```css
/* Smooth color transitions:
* {
  transition: background-color 200ms ease, color 200ms ease;
}

/* Disable transitions on page load:
html.no-transition * {
  transition: none !important;
}
```

#### 2.7 Handle System Theme Preference
```jsx
// On initial load:
1. Check localStorage for saved theme
2. If not found, check system preference
3. Use matchMedia('(prefers-color-scheme: dark)')
4. Apply theme without animation

// On toggle:
1. Save new theme to localStorage
2. Apply with smooth transition
```

#### 2.8 Testing Checklist
```
- [ ] Toggle dark mode on/off
- [ ] Check all components look good in both themes
- [ ] Check color contrast in both themes (WCAG AA)
- [ ] Verify persistence across page refresh
- [ ] Test system theme detection on first visit
- [ ] Check images/logos visible in both themes
- [ ] Verify smooth transition animation
- [ ] Test on mobile (reduced motion preference)
- [ ] Check form inputs, buttons, cards
- [ ] Verify toasts/modals in both themes
```

---

## TODO 3: File Management UI (ESTIMATED: 10-15 hours)

### Goals
- Drag-and-drop file upload
- File list UI improvements
- Share modals and controls
- Delete/restore UI
- File expiration/limit UI

### Implementation Steps

#### 3.1 Create DragDropUpload Component
```jsx
// Features:
- Drag-and-drop zone on page
- Visual feedback on drag-over
- Multiple file selection
- File validation (type, size)
- Progress indication per file
- Error handling

// Usage:
<DragDropUpload
  onFilesSelected={(files) => handleUpload(files)}
  acceptedTypes=".pdf,.doc,.docx,.zip"
  maxSize={100 * 1024 * 1024} // 100MB
  onError={(error) => showToast('error', error.message)}
/>
```

#### 3.2 Create FileListItem Component
```jsx
// Displays:
- File name and icon
- File size
- Upload date
- Last modified
- Shared status (icon badge)
- Action menu (share, delete, download)

// Interactions:
- Click to select
- Ctrl+Click for multi-select
- Right-click context menu
- Hover to show actions
```

#### 3.3 Create ShareModal Component
```jsx
// Features:
- List of people file is shared with
- Search/select users to share with
- Remove sharing button per person
- Expiration date picker
- Download limit selector
- Copy share link button

// Usage:
<ShareModal
  fileId={fileId}
  fileName={fileName}
  onShare={(userId, expiry) => handleShare(userId, expiry)}
  onRemoveShare={(userId) => handleRemoveShare(userId)}
/>
```

#### 3.4 Create FileActions Component
```jsx
// Action Items:
- Download (with progress)
- Share (opens ShareModal)
- Rename
- Move to trash
- Set expiration
- Set download limit
- View details

// Usage:
<FileActions
  fileId={fileId}
  fileName={fileName}
  onAction={(action, data) => handleAction(action, data)}
/>
```

#### 3.5 Create TrashUI Component
```jsx
// Features:
- List deleted files
- Show deletion date
- Restore button
- Permanent delete button
- Empty trash button
- Auto-delete after 30 days

// Display:
- Files sorted by deletion date (newest first)
- Empty state if no files
- Confirm before permanent delete
```

#### 3.6 Create FileDetailsModal
```jsx
// Displays:
- File name
- File size
- Upload date
- Last accessed
- Owner
- Shared with (list)
- Expiration date (if set)
- Download limit (if set)
- Edit button for metadata
```

#### 3.7 Create UploadProgressOverlay
```jsx
// Shows:
- List of uploading files
- Progress bar per file
- Percentage complete
- Speed and ETA
- Cancel button per file
- Overall progress

// Features:
- Positions bottom-right
- Minimizable
- Auto-dismisses on completion
- Shows errors inline
```

#### 3.8 Update FileListView (Dashboard)
```jsx
// Layout:
- Header with "My Files" and filters
- Drag-drop zone above list
- Upload button
- Sort/Filter controls
- File list (sorted, paginated)

// Responsive:
- Desktop: Table view
- Tablet: Card grid (2-3 columns)
- Mobile: List view (stacked)

// Features:
- Multi-select with checkboxes
- Bulk actions (delete, share, move)
- Empty state with upload prompt
```

#### 3.9 Create FileUploadService
```jsx
// Functions:
- uploadFile(file, onProgress)
- uploadMultiple(files[], onProgress)
- validateFile(file)
- encryptAndUpload(file, masterPassword)

// Handles:
- File validation
- Encryption
- Progress tracking
- Error recovery
- Retry logic
```

#### 3.10 Testing Checklist
```
- [ ] Drag-drop single file
- [ ] Drag-drop multiple files
- [ ] Upload progress updates
- [ ] Cancel upload mid-way
- [ ] File appears in list after upload
- [ ] Share modal opens and closes
- [ ] Add user to share and verify
- [ ] Remove user from share
- [ ] Set expiration date
- [ ] Set download limit
- [ ] Delete file (soft delete)
- [ ] Restore from trash
- [ ] Permanent delete
- [ ] Empty trash
- [ ] Download file
- [ ] Multi-select files
- [ ] Bulk delete
- [ ] Responsive on mobile
- [ ] Loading states during operations
- [ ] Error messages display correctly
```

---

## TODO 4: Settings Page (ESTIMATED: 8-10 hours)

### Goals
- User profile management
- Account preferences
- Security settings
- Email verification
- Password change
- Activity logs

### Implementation Steps

#### 4.1 Create SettingsLayout Component
```jsx
// Structure:
- Left sidebar with sections
- Main content area
- Sections:
  * Profile
  * Security
  * Preferences
  * Activity
  * Storage
  * Logout
```

#### 4.2 Create ProfileSection Component
```jsx
// Fields:
- Display name (editable)
- Email (with verification status)
- Profile picture (upload)
- Bio (optional)
- Save/Cancel buttons

// Features:
- Avatar placeholder (initials)
- Image cropper
- Validation on save
- Success message on update
```

#### 4.3 Create SecuritySection Component
```jsx
// Features:
- Password change form
  * Current password
  * New password (with strength)
  * Confirm password
  * Change button

- Email verification
  * Current email
  * Verification status (verified/pending)
  * Request re-send button
  * Pending message with timer

- 2FA Setup (skeleton)
  * Enable/Disable toggle
  * Setup instructions
  * Backup codes

- Active sessions
  * List current sessions
  * Logout other sessions button
  * Device info (browser, OS, IP)
```

#### 4.4 Create PreferencesSection Component
```jsx
// Settings:
- Theme (Light/Dark/Auto)
- Notifications (Email, In-app)
- Language (English, others)
- Privacy (File sharing visibility)
- Default storage organization
- Auto-backup options
```

#### 4.5 Create ActivitySection Component
```jsx
// Displays:
- Login activity
  * Date, time, location, device
  * IP address

- File activity
  * Recent uploads
  * Recent downloads
  * Recent shares

- Account activity
  * Password changes
  * Email verification
  * Settings changes

// Features:
- Filterable by date range
- Export activity log
- Clear history option
```

#### 4.6 Create StorageSection Component
```jsx
// Displays:
- Used storage (visual bar)
- Total quota
- Percentage used
- Upgrade button (if quota exceeded)

// Breakdown:
- By file type (documents, photos, etc.)
- By date (this month, last month, etc.)
- By size (largest files)

// Actions:
- Free up space button
- View large files
- Empty trash
- Download activity report
```

#### 4.7 Create SettingsPage Component
```jsx
// Main page:
- Route: /settings
- Integrates all section components
- Tab navigation
- Mobile-responsive sidebar
- Save state management

// Features:
- Auto-save or manual save
- Unsaved changes warning
- Validation on all forms
- Success/error toasts
```

#### 4.8 Update ProfileMenu
```jsx
// Currently in header:
- User name/email
- Settings link
- Logout link

// New:
- Profile picture/avatar
- Quick access to settings
- Theme toggle (from here too)
```

#### 4.9 Testing Checklist
```
- [ ] Navigate to /settings
- [ ] View profile section
- [ ] Edit display name
- [ ] Upload profile picture
- [ ] Test email verification flow
- [ ] Change password
- [ ] Verify password change works on login
- [ ] Enable/disable notifications
- [ ] Switch theme
- [ ] View activity logs
- [ ] View storage usage
- [ ] Logout all sessions
- [ ] Mobile responsiveness
- [ ] Form validation
- [ ] Error handling
- [ ] Success messages
- [ ] Unsaved changes warning
```

---

## TODO 5: UI Polish & Animations (ESTIMATED: 8-10 hours)

### Goals
- Smooth transitions between pages
- Loading animations
- Success animations
- Hover effects
- Micro-interactions
- Visual feedback

### Implementation Steps

#### 5.1 Create Animation Utilities
```css
/* In index.css:

@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideOutDown {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(20px);
    opacity: 0;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

/* Utility classes */
.animate-slide-in-up { animation: slideInUp 300ms ease-out; }
.animate-slide-out-down { animation: slideOutDown 300ms ease-in; }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
.animate-bounce { animation: bounce 1s infinite; }
```

#### 5.2 Add Page Transition Animations
```jsx
// In App.jsx or route handler:
- Fade out on navigation
- Fade in on route change
- Slide effect for back/forward
- Disable on first load

// Use React Router with <Outlet /> and CSS transitions
```

#### 5.3 Create Button Animations
```css
/* Hover effects:
button {
  transition: all 200ms ease;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

button:active {
  transform: translateY(0);
}

/* Loading state:
button.loading {
  pointer-events: none;
  opacity: 0.7;
}

button.loading::after {
  content: '';
  animation: spin 1s linear infinite;
}
```

#### 5.4 Add Form Input Animations
```css
/* Focus animation:
input:focus {
  transform: scale(1.02);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Error shake:
.form-error input {
  animation: shake 300ms ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
```

#### 5.5 Add Card/Modal Animations
```css
/* Modal slide in:
.modal {
  animation: slideInUp 300ms ease-out;
}

.modal.exit {
  animation: slideOutDown 200ms ease-in;
}

/* Card hover:
.card {
  transition: all 200ms ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}
```

#### 5.6 Add Loading Animations
```css
/* Spinner:
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}

/* Skeleton shimmer:
.skeleton {
  animation: shimmer 1.5s infinite;
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary),
    var(--color-bg-secondary),
    var(--color-bg-secondary)
  );
  background-size: 1000px 100%;
}
```

#### 5.7 Add Toast Animations
```css
/* Slide in from bottom-right:
.toast {
  animation: slideInBottomRight 300ms ease-out;
}

.toast.exit {
  animation: slideOutBottomRight 200ms ease-in;
}

@keyframes slideInBottomRight {
  from {
    transform: translate(400px, 400px);
    opacity: 0;
  }
  to {
    transform: translate(0, 0);
    opacity: 1;
  }
}

@keyframes slideOutBottomRight {
  to {
    transform: translate(400px, 400px);
    opacity: 0;
  }
}
```

#### 5.8 Add Success/Error Animations
```css
/* Checkmark animation:
@keyframes checkmark {
  0% { transform: scale(0) rotate(-45deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.success-icon {
  animation: checkmark 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Error X animation:
@keyframes errorX {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.error-icon {
  animation: errorX 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

#### 5.9 Add Ripple Effect Component
```jsx
// Ripple effect on buttons/clickables
<button>
  Click me
  <Ripple />
</button>

// CSS:
.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  transform: scale(0);
  animation: ripple-animation 600ms ease-out;
  pointer-events: none;
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
```

#### 5.10 Testing Checklist
```
- [ ] Page transitions smooth
- [ ] Button hover effects work
- [ ] Button active effects work
- [ ] Loading animations visible
- [ ] Modal animations smooth
- [ ] Toast animations on enter/exit
- [ ] Form input focus animations
- [ ] Error shake animation works
- [ ] Success animations display
- [ ] No jank or stuttering
- [ ] Animations respect prefers-reduced-motion
- [ ] Mobile performance acceptable
- [ ] Page Performance (Lighthouse >90)
```

---

## Execution Strategy

### Sequential Approach (Recommended)
1. **Accessibility First** (foundational for all else)
2. **Dark Mode** (CSS-only, affects all components)
3. **File Management UI** (core user feature)
4. **Settings Page** (account management)
5. **UI Polish** (refinement across everything)

### Parallel Where Possible
- Accessibility + Dark Mode can overlap (both CSS-heavy)
- File UI development can happen while Settings page is designed
- Animations can be added as last step after features

### Testing Strategy
- Test each todo immediately after completion
- Run responsive tests on each todo
- Check accessibility after completing
- Verify dark mode on each new component

---

## Success Criteria for Phase 3 Completion

✅ **Accessibility**
- Full keyboard navigation (Tab, Enter, Escape, Arrows)
- All form fields have labels
- Color contrast ≥ 4.5:1 (WCAG AA)
- Screen reader compatible
- Focus management clear

✅ **Dark Mode**
- Smooth toggle
- All components styled
- Persists across sessions
- Respects system preference

✅ **File Management UI**
- Drag-drop upload works
- File list renders with images
- Share modal functional
- Delete/restore UI complete
- Responsive on mobile

✅ **Settings Page**
- All sections render
- Form validation works
- Persistence on save
- Responsive layout

✅ **UI Polish**
- Smooth transitions
- Loading animations visible
- Hover effects work
- Professional appearance

---

## Estimated Timeline

- **Accessibility**: 2 full days
- **Dark Mode**: 1-1.5 days
- **File Management UI**: 2-3 days (most complex)
- **Settings Page**: 1.5-2 days
- **UI Polish**: 1-1.5 days
- **Testing & Fixes**: 1 day

**Total: 9-11 full days (72-88 hours)**

**If working part-time**: 2-3 weeks
**If working full-time**: 1-1.5 weeks

---

## Phase 3 Completion Checklist

- [ ] Accessibility todo complete
- [ ] Dark mode todo complete
- [ ] File management UI todo complete
- [ ] Settings page todo complete
- [ ] UI polish todo complete
- [ ] All components tested
- [ ] Mobile responsive verified
- [ ] No console errors
- [ ] All forms validated
- [ ] Loading states working
- [ ] Error states handled
- [ ] Toasts functional
- [ ] Accessibility audit passed
- [ ] Dark/light mode verified
- [ ] Performance acceptable

**When all ✅: Phase 3 = 100% Complete → Ready for Phase 4**

---

## Quick Reference: Most Important Files to Modify

1. **src/components/Form.jsx** - Add aria-* attributes
2. **src/index.css** - Add CSS variables for dark mode
3. **src/components/ResponsiveLayout.jsx** - Add semantic HTML
4. **secure-vault-frontend/src/App.jsx** - Wrap with ThemeProvider
5. **src/pages/Dashboard.jsx** - Add file UI components (to be created)
6. **src/pages/Settings.jsx** - Create new file for settings
7. All component files - Update CSS for dark mode variables

---

**Ready to start? Continue from TODO 1: Accessibility Features**
