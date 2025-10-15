# Calendar Implementation Guide
## Complete Technical Documentation for Replicating the Calendar Feature

**Last Updated:** October 15, 2025
**Version:** 1.0
**Author:** Claude Code Implementation

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture & Design](#architecture--design)
3. [Component Structure](#component-structure)
4. [Features Implemented](#features-implemented)
5. [Data Models](#data-models)
6. [UI Components](#ui-components)
7. [Step-by-Step Implementation](#step-by-step-implementation)
8. [Code Snippets](#code-snippets)
9. [Styling & Theming](#styling--theming)
10. [Future Enhancements](#future-enhancements)

---

## Overview

The calendar implementation is a custom-built, full-featured appointment management system designed for business CRMs. It provides month, week, and day views with appointment tracking, status management, and detailed appointment modals.

**Technology Stack:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Cal.com integration ready (script loader included)

**File Location:** `src/pages/CalendarPage.tsx` (1000 lines)

---

## Architecture & Design

### Core Design Principles
1. **Responsive Layout:** Mobile-first design with grid-based layout
2. **Dark Mode Support:** Full dark mode implementation with Tailwind dark: classes
3. **State Management:** React hooks (useState, useEffect)
4. **Modular Components:** Separate modals, views, and stat cards
5. **Mock Data Ready:** Prepared for API integration with mock data structure

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│ Header: Title + View Mode Toggle                │
├─────────────────────────────────────────────────┤
│ Calendar Navigation: Prev/Today/Next            │
├──────────────────────┬──────────────────────────┤
│                      │                          │
│  Calendar Grid       │  Right Sidebar           │
│  (Month/Week/Day)    │  - Upcoming Appointments │
│                      │  - Quick Actions         │
│  (2 columns)         │  (1 column)              │
│                      │                          │
├──────────────────────┴──────────────────────────┤
│ Stats Cards: Total, Confirmed, Pending, Cancel  │
└─────────────────────────────────────────────────┘
```

---

## Component Structure

### Main Component: CalendarPage
**Props:**
```typescript
interface CalendarPageProps {
  user: any  // User object with authentication data
}
```

### Internal Components
1. **Header Section** - Title and view mode toggle
2. **Calendar Navigation** - Date navigation controls
3. **Month Calendar Grid** - 6x7 grid of days
4. **Day Details View** - Full-day appointment list
5. **Appointment Modal** - Detailed appointment information
6. **Stats Cards** - Appointment statistics
7. **Right Sidebar** - Upcoming appointments and quick actions

---

## Features Implemented

### ✅ Completed Features

#### 1. **Multi-View Support**
- **Month View:** 6-week calendar grid with appointments
- **Week View:** Placeholder (ready for implementation)
- **Day View:** Placeholder (ready for implementation)

#### 2. **Calendar Navigation**
- Previous/Next navigation
- "Today" quick jump button
- Smart date range formatting
- Handles month, week, and day transitions

#### 3. **Appointment Management**
- Color-coded status badges (Confirmed/Pending/Cancelled)
- Click on date to view all appointments
- Click on appointment for detailed modal
- Mock appointment data with 6 sample entries

#### 4. **Interactive Features**
- Clickable dates open day detail view
- Clickable appointments open detail modal
- "Back to Calendar" navigation from day view
- Responsive hover states

#### 5. **Statistics Dashboard**
- Total appointments count
- Confirmed appointments with percentage
- Pending appointments count
- Cancelled appointments with percentage

#### 6. **Dark Mode Support**
- Complete dark mode implementation
- All components styled for both light and dark themes
- Smooth transitions between themes

#### 7. **Responsive Design**
- Mobile: Single column layout
- Tablet: 2-column layout
- Desktop: 3-column layout (calendar + sidebar)

---

## Data Models

### Appointment Interface
```typescript
interface Appointment {
  id: string              // Unique identifier (e.g., "APP-463467")
  title: string           // Appointment title
  time: string            // Time in "10:00 AM" format
  date: Date              // JavaScript Date object
  status: 'confirmed' | 'pending' | 'cancelled'
  clientName: string      // Client/customer name
  type: string            // Appointment type (e.g., "Initial Consultation")
  notes?: string          // Optional notes
  email?: string          // Optional email
  phone?: string          // Optional phone number
  location?: string       // Optional location
  duration?: string       // Optional duration (e.g., "60 minutes")
}
```

### Stats Interface
```typescript
interface AppointmentStats {
  total: number
  confirmed: number
  pending: number
  cancelled: number
}
```

### View Mode Type
```typescript
type ViewMode = 'day' | 'week' | 'month'
```

---

## UI Components

### 1. Header Component
**Location:** Lines 354-399

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <div>
    <h1 className="text-2xl font-bold">Calendar</h1>
    <p className="text-sm text-gray-600 dark:text-gray-400">
      Manage your appointments and schedule
    </p>
  </div>

  {/* View Mode Toggle */}
  <div className="inline-flex rounded-lg border p-1">
    <button onClick={() => setViewMode('day')}>Day</button>
    <button onClick={() => setViewMode('week')}>Week</button>
    <button onClick={() => setViewMode('month')}>Month</button>
  </div>
</div>
```

**Key Features:**
- Responsive flex layout
- View mode buttons with active state styling
- Blue background for active view

### 2. Calendar Navigation
**Location:** Lines 402-430

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
  <div className="flex items-center justify-between">
    <button onClick={() => navigateDate('prev')}>
      <ChevronLeft className="w-5 h-5" />
    </button>

    <div className="flex items-center gap-4">
      <h2>{formatDateRange()}</h2>
      <button onClick={goToToday}>Today</button>
    </div>

    <button onClick={() => navigateDate('next')}>
      <ChevronRight className="w-5 h-5" />
    </button>
  </div>
</div>
```

**Key Features:**
- Previous/Next navigation arrows
- Dynamic date range display
- "Today" quick jump button
- Responsive hover states

### 3. Month Calendar Grid
**Location:** Lines 525-617

**Grid Structure:**
```tsx
{/* Day Names Header */}
<div className="grid grid-cols-7 gap-2">
  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
    <div key={day}>{day}</div>
  ))}
</div>

{/* Calendar Days Grid */}
<div className="grid grid-cols-7 gap-2">
  {monthDays.map((day, index) => (
    <div key={index} className="aspect-square rounded-lg">
      {/* Date number - clickable */}
      <button onClick={() => handleDateClick(day.fullDate)}>
        {day.date}
      </button>

      {/* Appointments list */}
      <div className="pt-6 px-1 pb-1 h-full overflow-y-auto">
        {dayAppointments.map((appointment) => (
          <button
            onClick={() => handleAppointmentClick(appointment)}
            className="w-full text-left px-1.5 py-1 rounded"
          >
            <div>{appointment.time}</div>
            <div>{appointment.title}</div>
          </button>
        ))}
      </div>
    </div>
  ))}
</div>
```

**Key Features:**
- 7x6 grid (42 days total)
- Includes previous/next month overflow days
- Today highlighting with blue ring
- Color-coded appointments by status
- Clickable dates and appointments
- Responsive hover effects

### 4. Day Details View
**Location:** Lines 438-522

```tsx
{showDayView && selectedDate && (
  <div>
    {/* Back Button */}
    <button onClick={backToCalendar}>
      <ArrowLeft className="w-4 h-4" />
      Back to Calendar
    </button>

    {/* Selected Date Header */}
    <h3>{selectedDate.toLocaleDateString('en-US', {...})}</h3>

    {/* Appointments List */}
    {getAllAppointmentsForSelectedDate().map((appointment) => (
      <button onClick={() => handleAppointmentClick(appointment)}>
        {/* Appointment details */}
      </button>
    ))}
  </div>
)}
```

**Key Features:**
- Full-width appointment cards
- Time-sorted list
- Status badges
- Empty state message
- Back to calendar navigation

### 5. Appointment Detail Modal
**Location:** Lines 677-913

**Modal Structure:**
```tsx
<div className="fixed inset-0 z-50 overflow-y-auto">
  {/* Backdrop with blur */}
  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />

  {/* Modal content */}
  <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-3xl">
    {/* Status accent bar */}
    <div className="absolute top-0 h-1 bg-green-500" />

    {/* Close button */}
    <button onClick={closeModal}>X</button>

    {/* Header section */}
    <div className="p-8">
      <h2>{selectedAppointment.title}</h2>
      <span>{status badge}</span>
    </div>

    {/* Details grid (2 columns) */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Date & Time */}
      {/* Duration */}
      {/* Client Name */}
      {/* Email (clickable mailto:) */}
      {/* Phone (clickable tel:) */}
      {/* Location */}
      {/* Customer ID (generated from phone) */}
      {/* Appointment ID */}
    </div>

    {/* Notes section */}
    {selectedAppointment.notes && (
      <div className="p-5 bg-blue-50 dark:bg-blue-900/20">
        <h3>Notes</h3>
        <p>{selectedAppointment.notes}</p>
      </div>
    )}

    {/* Action buttons */}
    <div className="flex gap-3">
      <button onClick={closeModal}>Close</button>
      <button>Edit Appointment</button>
    </div>
  </div>
</div>
```

**Key Features:**
- Full-screen overlay with blur backdrop
- Status-colored accent bar at top
- 2-column responsive grid for details
- Clickable email and phone links
- Customer ID generation from phone number
- Notes section with formatted text
- Action buttons at bottom

### 6. Stats Cards
**Location:** Lines 916-996

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Total Appointments Card */}
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
    <div className="flex items-center justify-between">
      <div>
        <p>Total Appointments</p>
        <p className="text-2xl font-bold">{stats.total}</p>
      </div>
      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
        <CalendarDays className="w-6 h-6" />
      </div>
    </div>
    <p className="text-xs">In selected date range</p>
  </div>

  {/* Similar structure for Confirmed, Pending, Cancelled */}
</div>
```

**Key Features:**
- Responsive grid (1/2/4 columns)
- Color-coded icons and values
- Percentage calculations
- Icon backgrounds with opacity

---

## Step-by-Step Implementation

### Step 1: Set Up Dependencies
```bash
npm install lucide-react
```

**Required Imports:**
```typescript
import React, { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  CalendarDays,
  TrendingUp,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Timer
} from 'lucide-react'
```

### Step 2: Create TypeScript Interfaces
Copy the interfaces from lines 24-46 in CalendarPage.tsx

### Step 3: Set Up Component State
```typescript
const [viewMode, setViewMode] = useState<ViewMode>('month')
const [currentDate, setCurrentDate] = useState(new Date())
const [stats, setStats] = useState<AppointmentStats>({
  total: 0, confirmed: 0, pending: 0, cancelled: 0
})
const [appointments, setAppointments] = useState<Appointment[]>([])
const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
const [isModalOpen, setIsModalOpen] = useState(false)
const [selectedDate, setSelectedDate] = useState<Date | null>(null)
const [showDayView, setShowDayView] = useState(false)
```

### Step 4: Implement Calendar Grid Algorithm
The `generateMonthDays()` function (lines 284-347) generates a 6x7 grid:

```typescript
const generateMonthDays = () => {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // First day of the month
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay() // 0-6 (Sun-Sat)

  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Previous month overflow
  const prevMonthLastDay = new Date(year, month, 0)
  const prevMonthDays = prevMonthLastDay.getDate()

  const days = []

  // Add previous month overflow days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = prevMonthDays - i
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      fullDate: new Date(year, month - 1, date)
    })
  }

  // Add current month days
  const today = new Date()
  for (let date = 1; date <= daysInMonth; date++) {
    const fullDate = new Date(year, month, date)
    const isToday =
      fullDate.getDate() === today.getDate() &&
      fullDate.getMonth() === today.getMonth() &&
      fullDate.getFullYear() === today.getFullYear()

    days.push({ date, isCurrentMonth: true, isToday, fullDate })
  }

  // Add next month overflow to complete 42-day grid
  const remainingDays = 42 - days.length
  for (let date = 1; date <= remainingDays; date++) {
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      fullDate: new Date(year, month + 1, date)
    })
  }

  return days
}
```

**Algorithm Explanation:**
1. Calculate first day of month and its day of week
2. Add overflow days from previous month to start on Sunday
3. Add all days of current month with "today" highlighting
4. Add overflow days from next month to complete 6 weeks
5. Total: Always 42 days (6 rows × 7 columns)

### Step 5: Implement Navigation Functions

**Date Navigation:**
```typescript
const navigateDate = (direction: 'prev' | 'next') => {
  const newDate = new Date(currentDate)

  switch (viewMode) {
    case 'day':
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
      break
    case 'week':
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
      break
    case 'month':
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
      break
  }

  setCurrentDate(newDate)
}

const goToToday = () => {
  setCurrentDate(new Date())
}
```

### Step 6: Implement Appointment Functions

**Get Appointments for Date:**
```typescript
const getAppointmentsForDate = (date: Date) => {
  return appointments.filter(apt =>
    apt.date.getDate() === date.getDate() &&
    apt.date.getMonth() === date.getMonth() &&
    apt.date.getFullYear() === date.getFullYear()
  )
}
```

**Handle Appointment Click:**
```typescript
const handleAppointmentClick = (appointment: Appointment) => {
  setSelectedAppointment(appointment)
  setIsModalOpen(true)
}

const closeModal = () => {
  setIsModalOpen(false)
  setSelectedAppointment(null)
}
```

**Handle Date Click:**
```typescript
const handleDateClick = (date: Date) => {
  setSelectedDate(date)
  setShowDayView(true)
}

const backToCalendar = () => {
  setShowDayView(false)
  setSelectedDate(null)
}
```

### Step 7: Format Date Ranges

```typescript
const formatDateRange = () => {
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    year: 'numeric'
  }

  switch (viewMode) {
    case 'day':
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    case 'week':
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    case 'month':
    default:
      return currentDate.toLocaleDateString('en-US', options)
  }
}
```

### Step 8: Load Mock Data (or Connect to API)

```typescript
const loadMockAppointments = () => {
  const mockAppointments: Appointment[] = [
    {
      id: 'APP-463467',
      title: 'Client Consultation',
      time: '10:00 AM',
      date: new Date(2025, 9, 15),
      status: 'confirmed',
      clientName: 'John Smith',
      type: 'Initial Consultation',
      notes: 'First meeting to discuss project requirements',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      location: '123 Main St, Suite 100',
      duration: '60 minutes'
    },
    // Add more appointments...
  ]

  setAppointments(mockAppointments)
}
```

### Step 9: Add Cal.com Integration (Optional)

```typescript
useEffect(() => {
  // Load Cal.com embed script
  const script = document.createElement('script')
  script.src = 'https://app.cal.com/embed/embed.js'
  script.async = true
  document.body.appendChild(script)

  return () => {
    // Cleanup on unmount
    const embedScript = document.querySelector('script[src="https://app.cal.com/embed/embed.js"]')
    if (embedScript) {
      document.body.removeChild(embedScript)
    }
  }
}, [])
```

---

## Code Snippets

### Status Badge Component
```tsx
<span className={`
  px-2 py-1 rounded-full text-xs font-medium
  ${
    appointment.status === 'confirmed'
      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      : appointment.status === 'pending'
      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  }
`}>
  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
</span>
```

### Appointment Card (Mini)
```tsx
<button
  onClick={() => handleAppointmentClick(appointment)}
  className={`
    w-full text-left px-1.5 py-1 rounded text-[10px] leading-tight
    transition-all hover:shadow-sm
    ${
      appointment.status === 'confirmed'
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 hover:bg-green-200'
        : appointment.status === 'pending'
        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 hover:bg-yellow-200'
        : 'bg-red-100 dark:bg-red-900/30 text-red-700 hover:bg-red-200'
    }
  `}
>
  <div className="font-medium truncate">{appointment.time}</div>
  <div className="truncate">{appointment.title}</div>
</button>
```

### Today Highlighting
```tsx
className={`
  aspect-square rounded-lg transition-colors relative overflow-hidden
  ${day.isToday ? 'ring-2 ring-blue-600' : ''}
  border ${day.isToday ? 'border-blue-600' : 'border-gray-200 dark:border-gray-700'}
`}
```

---

## Styling & Theming

### Tailwind CSS Classes Used

**Background Colors:**
- Light mode: `bg-white`, `bg-gray-50`, `bg-gray-100`
- Dark mode: `dark:bg-gray-800`, `dark:bg-gray-900`, `dark:bg-gray-700`

**Text Colors:**
- Light mode: `text-gray-900`, `text-gray-600`, `text-gray-500`
- Dark mode: `dark:text-gray-100`, `dark:text-gray-400`, `dark:text-gray-600`

**Status Colors:**
- Confirmed: `bg-green-100`, `text-green-700`, `dark:bg-green-900/30`, `dark:text-green-300`
- Pending: `bg-yellow-100`, `text-yellow-700`, `dark:bg-yellow-900/30`, `dark:text-yellow-300`
- Cancelled: `bg-red-100`, `text-red-700`, `dark:bg-red-900/30`, `dark:text-red-300`

**Interactive States:**
- Hover: `hover:bg-gray-100`, `hover:bg-blue-50`, `hover:shadow-md`
- Active: `bg-blue-600`, `text-white`
- Focus: Tailwind default focus rings

**Layout:**
- Grid: `grid grid-cols-7 gap-2` (calendar), `grid grid-cols-1 md:grid-cols-2 gap-4` (modal)
- Flex: `flex items-center justify-between`, `flex-col sm:flex-row`
- Spacing: `p-4`, `p-6`, `p-8`, `gap-2`, `gap-4`, `gap-6`

**Borders & Shadows:**
- Borders: `border border-gray-200 dark:border-gray-700`
- Shadows: `shadow-sm`, `shadow-md`, `shadow-2xl`
- Rounded: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full`

---

## Future Enhancements

### Ready for Implementation

1. **Week View:**
   - Time slots (8 AM - 6 PM)
   - Horizontal day columns
   - Drag-and-drop appointments

2. **Day View:**
   - Hour-by-hour timeline
   - Multi-column for overlapping appointments
   - Current time indicator

3. **API Integration:**
   - Replace mock data with real API calls
   - Cal.com API integration (script already loaded)
   - Supabase database sync

4. **Appointment CRUD:**
   - Create new appointments
   - Edit existing appointments
   - Delete/cancel appointments
   - Reschedule via drag-and-drop

5. **Advanced Features:**
   - Recurring appointments
   - Email/SMS reminders
   - Calendar sync (Google, Outlook)
   - Multi-user calendars
   - Appointment conflicts detection
   - Waitlist management

6. **Search & Filters:**
   - Search by client name
   - Filter by status
   - Filter by appointment type
   - Date range selection

7. **Export & Reporting:**
   - Export to PDF
   - Export to CSV
   - Monthly appointment reports
   - Revenue tracking

---

## Integration Points

### Cal.com Integration
The component already includes the Cal.com embed script loader:

```typescript
// Lines 64-78
useEffect(() => {
  const script = document.createElement('script')
  script.src = 'https://app.cal.com/embed/embed.js'
  script.async = true
  document.body.appendChild(script)

  return () => {
    const embedScript = document.querySelector('script[src="https://app.cal.com/embed/embed.js"]')
    if (embedScript) {
      document.body.removeChild(embedScript)
    }
  }
}, [])
```

**To activate Cal.com:**
1. Create Cal.com account
2. Get your booking page URL
3. Add Cal.com booking button to "Book New Appointment" action
4. Configure Cal.com webhook to sync appointments back

### Customer ID Generation
The component uses `patientIdService.getPatientId(phone)` to generate consistent customer IDs from phone numbers:

```typescript
// Line 865
<p className="text-base font-mono">
  {patientIdService.getPatientId(selectedAppointment.phone)}
</p>
```

**Service Implementation:**
```typescript
// Assumed implementation
export const patientIdService = {
  getPatientId: (phone: string): string => {
    // Generate consistent hash from phone number
    return `CUS-${hashFunction(phone)}`
  }
}
```

---

## Performance Considerations

### Optimizations Implemented

1. **Memoization Ready:**
   - `generateMonthDays()` can be wrapped in `useMemo`
   - Appointment filtering can be memoized

2. **Efficient Rendering:**
   - Only active view renders (month/week/day)
   - Modal renders conditionally
   - Day view replaces month view (no duplicate rendering)

3. **State Management:**
   - Minimal re-renders with focused state updates
   - Modal state separate from calendar state
   - View state separate from data state

### Recommended Optimizations

```typescript
// Memoize expensive calculations
const monthDays = useMemo(() => generateMonthDays(), [currentDate])

const filteredAppointments = useMemo(() =>
  getAppointmentsForDate(selectedDate),
  [appointments, selectedDate]
)

// Callback memoization
const handleDateClick = useCallback((date: Date) => {
  setSelectedDate(date)
  setShowDayView(true)
}, [])
```

---

## Testing Checklist

### Manual Testing
- [ ] Month view displays correctly
- [ ] Navigation (prev/next/today) works
- [ ] View mode toggle switches views
- [ ] Clicking date opens day view
- [ ] Clicking appointment opens modal
- [ ] Back to calendar closes day view
- [ ] Modal close button works
- [ ] Modal backdrop click closes modal
- [ ] Status colors display correctly
- [ ] Dark mode works on all components
- [ ] Responsive layout works (mobile/tablet/desktop)
- [ ] Today highlighting appears correctly
- [ ] Stats cards calculate correctly
- [ ] Email/phone links work in modal

### Edge Cases
- [ ] First day of month is Sunday
- [ ] First day of month is Saturday
- [ ] Month with 28 days (February)
- [ ] Month with 31 days
- [ ] Leap year February
- [ ] No appointments for selected date
- [ ] Multiple appointments same time
- [ ] Long appointment titles
- [ ] Missing optional fields (email, phone, notes)

---

## Deployment Checklist

1. **Install Dependencies:**
   ```bash
   npm install lucide-react
   ```

2. **Add Tailwind Config:**
   Ensure Tailwind is configured for dark mode:
   ```js
   module.exports = {
     darkMode: 'class',
     // ... rest of config
   }
   ```

3. **Create Component File:**
   Copy `CalendarPage.tsx` to your project

4. **Add to Routing:**
   ```tsx
   <Route path="/calendar" element={<CalendarPage user={user} />} />
   ```

5. **Add Navigation Link:**
   ```tsx
   <Link to="/calendar">
     <CalendarIcon /> Calendar
   </Link>
   ```

6. **Configure API:**
   Replace mock data functions with real API calls

7. **Test All Features:**
   Follow the testing checklist above

---

## Troubleshooting

### Common Issues

**Issue: Calendar grid doesn't show 6 weeks**
- Check `generateMonthDays()` returns exactly 42 days
- Verify remainder calculation: `42 - days.length`

**Issue: Today not highlighting**
- Check date comparison logic includes year, month, and day
- Ensure time component is zeroed out for comparison

**Issue: Appointments not appearing**
- Verify date filtering logic matches Date objects exactly
- Check time zone handling in Date objects

**Issue: Modal not opening**
- Verify `isModalOpen` state updates
- Check `selectedAppointment` is set before opening
- Ensure z-index is high enough (`z-50`)

**Issue: Dark mode not working**
- Verify Tailwind dark mode is configured
- Check all components have `dark:` classes
- Ensure HTML has `dark` class when dark mode enabled

---

## API Integration Template

### Replace Mock Data with Real API

```typescript
// Replace loadMockAppointments() with:
const loadAppointments = async () => {
  try {
    const response = await fetch('/api/appointments', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    // Transform API data to Appointment interface
    const appointments: Appointment[] = data.map((apt: any) => ({
      id: apt.id,
      title: apt.title,
      time: apt.start_time,
      date: new Date(apt.date),
      status: apt.status,
      clientName: apt.client.name,
      type: apt.appointment_type,
      notes: apt.notes,
      email: apt.client.email,
      phone: apt.client.phone,
      location: apt.location,
      duration: apt.duration_minutes + ' minutes'
    }))

    setAppointments(appointments)
  } catch (error) {
    console.error('Failed to load appointments:', error)
  }
}
```

### Create Appointment API Call

```typescript
const createAppointment = async (appointmentData: Partial<Appointment>) => {
  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    })

    const newAppointment = await response.json()
    setAppointments([...appointments, newAppointment])

    return { success: true, data: newAppointment }
  } catch (error) {
    console.error('Failed to create appointment:', error)
    return { success: false, error }
  }
}
```

---

## License & Credits

**Implementation:** Custom-built for Phaeton AI CRM
**Icons:** Lucide React (https://lucide.dev)
**Styling:** Tailwind CSS (https://tailwindcss.com)
**Calendar Integration Ready:** Cal.com (https://cal.com)

---

## Contact & Support

For questions about this implementation:
- Review the source code: `src/pages/CalendarPage.tsx`
- Check the mock data structure for API design
- Refer to Tailwind docs for styling customization
- See Lucide React docs for icon usage

---

**End of Documentation**
