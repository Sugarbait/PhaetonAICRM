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
import { patientIdService } from '@/services/patientIdService'

interface CalendarPageProps {
  user: any
}

interface AppointmentStats {
  total: number
  confirmed: number
  pending: number
  cancelled: number
}

interface Appointment {
  id: string
  title: string
  time: string
  date: Date
  status: 'confirmed' | 'pending' | 'cancelled'
  clientName: string
  type: string
  notes?: string
  email?: string
  phone?: string
  location?: string
  duration?: string
}

type ViewMode = 'day' | 'week' | 'month'

export const CalendarPage: React.FC<CalendarPageProps> = ({ user }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0
  })
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showDayView, setShowDayView] = useState(false)

  // Cal.com integration setup
  useEffect(() => {
    // Load Cal.com embed script
    const script = document.createElement('script')
    script.src = 'https://app.cal.com/embed/embed.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      const embedScript = document.querySelector('script[src="https://app.cal.com/embed/embed.js"]')
      if (embedScript) {
        document.body.removeChild(embedScript)
      }
    }
  }, [])

  // Load appointment statistics (mock data for now - replace with real Cal.com API)
  useEffect(() => {
    loadAppointmentStats()
  }, [currentDate, viewMode])

  const loadAppointmentStats = async () => {
    // TODO: Replace with actual Cal.com API integration
    // For now, using mock data
    setStats({
      total: 24,
      confirmed: 18,
      pending: 4,
      cancelled: 2
    })

    // Load mock appointments
    loadMockAppointments()
  }

  const loadMockAppointments = () => {
    // Generate mock appointments for demonstration
    const mockAppointments: Appointment[] = [
      {
        id: 'APP-463467',
        title: 'Client Consultation',
        time: '10:00 AM',
        date: new Date(2025, 9, 15), // October 15, 2025
        status: 'confirmed',
        clientName: 'John Smith',
        type: 'Initial Consultation',
        notes: 'First meeting to discuss project requirements',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567',
        location: '123 Main St, Suite 100',
        duration: '60 minutes'
      },
      {
        id: 'APP-463468',
        title: 'Follow-up Meeting',
        time: '2:00 PM',
        date: new Date(2025, 9, 15), // October 15, 2025
        status: 'confirmed',
        clientName: 'Jane Doe',
        type: 'Follow-up',
        notes: 'Review progress on ongoing project',
        email: 'jane.doe@company.com',
        phone: '(555) 234-5678',
        location: 'Virtual Meeting',
        duration: '45 minutes'
      },
      {
        id: 'APP-463469',
        title: 'Team Review',
        time: '11:00 AM',
        date: new Date(2025, 9, 18), // October 18, 2025
        status: 'pending',
        clientName: 'Marketing Team',
        type: 'Team Meeting',
        notes: 'Quarterly review and planning session',
        email: 'marketing@company.com',
        phone: '(555) 345-6789',
        location: 'Conference Room A',
        duration: '90 minutes'
      },
      {
        id: 'APP-463470',
        title: 'Product Demo',
        time: '3:30 PM',
        date: new Date(2025, 9, 20), // October 20, 2025
        status: 'confirmed',
        clientName: 'ABC Corp',
        type: 'Product Demonstration',
        notes: 'Showcase new features to potential client',
        email: 'contact@abccorp.com',
        phone: '(555) 456-7890',
        location: 'Client Office - Downtown',
        duration: '120 minutes'
      },
      {
        id: 'APP-463471',
        title: 'Strategy Session',
        time: '9:00 AM',
        date: new Date(2025, 9, 22), // October 22, 2025
        status: 'pending',
        clientName: 'Sarah Johnson',
        type: 'Strategy Planning',
        notes: 'Q4 business strategy discussion',
        email: 'sarah.j@business.com',
        phone: '(555) 567-8901',
        location: 'Virtual Meeting',
        duration: '75 minutes'
      },
      {
        id: 'APP-463472',
        title: 'Client Onboarding',
        time: '1:00 PM',
        date: new Date(2025, 9, 25), // October 25, 2025
        status: 'confirmed',
        clientName: 'Tech Startup Inc',
        type: 'Onboarding',
        notes: 'Welcome new client and setup process',
        email: 'hello@techstartup.io',
        phone: '(555) 678-9012',
        location: '456 Innovation Drive',
        duration: '90 minutes'
      }
    ]

    setAppointments(mockAppointments)
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt =>
      apt.date.getDate() === date.getDate() &&
      apt.date.getMonth() === date.getMonth() &&
      apt.date.getFullYear() === date.getFullYear()
    )
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedAppointment(null)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowDayView(true)
  }

  const backToCalendar = () => {
    setShowDayView(false)
    setSelectedDate(null)
  }

  const getAllAppointmentsForSelectedDate = () => {
    if (!selectedDate) return []

    return appointments.filter(apt => {
      const aptDate = apt.date
      return aptDate.getDate() === selectedDate.getDate() &&
             aptDate.getMonth() === selectedDate.getMonth() &&
             aptDate.getFullYear() === selectedDate.getFullYear()
    }).sort((a, b) => {
      // Sort by time
      const timeA = a.time.toLowerCase()
      const timeB = b.time.toLowerCase()
      return timeA.localeCompare(timeB)
    })
  }

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

  // Generate calendar days for month view
  const generateMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)
    const firstDayOfWeek = firstDay.getDay() // 0 = Sunday, 6 = Saturday

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()

    // Previous month overflow
    const prevMonthLastDay = new Date(year, month, 0)
    const prevMonthDays = prevMonthLastDay.getDate()

    const days: Array<{
      date: number
      isCurrentMonth: boolean
      isToday: boolean
      fullDate: Date
    }> = []

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

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        fullDate
      })
    }

    // Add next month overflow days to complete the grid
    const remainingDays = 42 - days.length // 6 rows × 7 days = 42
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

  const monthDays = generateMonthDays()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Calendar
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your appointments and schedule
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatDateRange()}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>

          <button
            onClick={() => navigateDate('next')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar and Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid - Left Side (2 columns) */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {/* Day Details View */}
            {showDayView && selectedDate && (
              <div>
                {/* Back to Calendar Button */}
                <button
                  onClick={backToCalendar}
                  className="flex items-center gap-2 mb-4 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Calendar
                </button>

                {/* Selected Date Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {getAllAppointmentsForSelectedDate().length} appointment{getAllAppointmentsForSelectedDate().length !== 1 ? 's' : ''} scheduled
                  </p>
                </div>

                {/* Appointments List */}
                <div className="space-y-3">
                  {getAllAppointmentsForSelectedDate().length > 0 ? (
                    getAllAppointmentsForSelectedDate().map((appointment) => (
                      <button
                        key={appointment.id}
                        onClick={() => handleAppointmentClick(appointment)}
                        className="w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {appointment.time}
                              </span>
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
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                              {appointment.title}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Users className="w-4 h-4" />
                              <span>{appointment.clientName}</span>
                              <span className="mx-2">•</span>
                              <span>{appointment.type}</span>
                            </div>
                            {appointment.notes && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No appointments scheduled for this date
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Month Calendar Grid */}
            {viewMode === 'month' && !showDayView && (
              <div>
                {/* Day Names Header */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {monthDays.map((day, index) => {
                    const dayAppointments = getAppointmentsForDate(day.fullDate)

                    return (
                      <div
                        key={index}
                        className={`
                          aspect-square rounded-lg transition-colors relative overflow-hidden
                          ${
                            day.isCurrentMonth
                              ? 'bg-white dark:bg-gray-800'
                              : 'bg-gray-50 dark:bg-gray-900'
                          }
                          ${
                            day.isToday
                              ? 'ring-2 ring-blue-600'
                              : ''
                          }
                          border ${
                            day.isToday
                              ? 'border-blue-600'
                              : 'border-gray-200 dark:border-gray-700'
                          }
                        `}
                      >
                        {/* Date number in top-left - Clickable */}
                        <button
                          onClick={() => handleDateClick(day.fullDate)}
                          className={`
                            absolute top-1 left-1 text-xs font-semibold cursor-pointer
                            hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1.5 py-0.5 transition-colors
                            ${
                              day.isCurrentMonth
                                ? day.isToday
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-gray-700 dark:text-gray-300'
                                : 'text-gray-400 dark:text-gray-600'
                            }
                          `}
                          title="Click to view all appointments for this day"
                        >
                          {day.date}
                        </button>

                        {/* Appointments list */}
                        <div className="pt-6 px-1 pb-1 h-full overflow-y-auto">
                          {dayAppointments.length > 0 ? (
                            <div className="space-y-1">
                              {dayAppointments.map((appointment) => (
                                <button
                                  key={appointment.id}
                                  onClick={() => handleAppointmentClick(appointment)}
                                  className={`
                                    w-full text-left px-1.5 py-1 rounded text-[10px] leading-tight
                                    transition-all hover:shadow-sm
                                    ${
                                      appointment.status === 'confirmed'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                                        : appointment.status === 'pending'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                                    }
                                  `}
                                >
                                  <div className="font-medium truncate">{appointment.time}</div>
                                  <div className="truncate">{appointment.title}</div>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Day View Placeholder */}
            {viewMode === 'day' && !showDayView && (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Day view - Coming soon
                </p>
              </div>
            )}

            {/* Week View Placeholder */}
            {viewMode === 'week' && !showDayView && (
              <div className="text-center py-12">
                <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Week view - Coming soon
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Right Sidebar - Upcoming Appointments and Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upcoming Appointments */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Upcoming Appointments
            </h3>
            <div className="space-y-3">
              {/* Placeholder for upcoming appointments list */}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No upcoming appointments in the selected date range.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Book New Appointment
              </button>
              <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                View All Bookings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {isModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop with Blur */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
              {/* Subtle accent bar at top */}
              <div className={`
                absolute top-0 left-0 right-0 h-1
                ${
                  selectedAppointment.status === 'confirmed'
                    ? 'bg-green-500'
                    : selectedAppointment.status === 'pending'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }
              `} />

              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Content */}
              <div className="relative p-8 space-y-6">
                {/* Header Section */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl">
                      <CalendarIcon className="w-7 h-7 text-gray-600 dark:text-gray-400" />
                    </div>

                    {/* Title and Status */}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {selectedAppointment.title}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className={`
                          inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
                          ${
                            selectedAppointment.status === 'confirmed'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : selectedAppointment.status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }
                        `}>
                          {selectedAppointment.status === 'confirmed' ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : selectedAppointment.status === 'pending' ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedAppointment.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date & Time */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Date & Time</span>
                    </div>
                    <div className="pl-6">
                      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {selectedAppointment.date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xl font-bold text-gray-700 dark:text-gray-300 mt-1">
                        {selectedAppointment.time}
                      </p>
                    </div>
                  </div>

                  {/* Duration */}
                  {selectedAppointment.duration && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                        <Timer className="w-4 h-4" />
                        <span>Duration</span>
                      </div>
                      <div className="pl-6">
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {selectedAppointment.duration}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Client */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>Client Name</span>
                    </div>
                    <div className="pl-6">
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {selectedAppointment.clientName}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  {selectedAppointment.email && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </div>
                      <div className="pl-6">
                        <a
                          href={`mailto:${selectedAppointment.email}`}
                          className="text-lg text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {selectedAppointment.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {selectedAppointment.phone && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>Phone</span>
                      </div>
                      <div className="pl-6">
                        <a
                          href={`tel:${selectedAppointment.phone}`}
                          className="text-lg text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {selectedAppointment.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  {selectedAppointment.location && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                        <MapPin className="w-4 h-4" />
                        <span>Location</span>
                      </div>
                      <div className="pl-6">
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {selectedAppointment.location}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Customer ID */}
                  {selectedAppointment.phone && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                        <CalendarDays className="w-4 h-4" />
                        <span>Customer ID</span>
                      </div>
                      <div className="pl-6">
                        <p className="text-base font-mono text-gray-600 dark:text-gray-400">
                          {patientIdService.getPatientId(selectedAppointment.phone)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Appointment ID */}
                  <div className={`${selectedAppointment.phone ? '' : 'md:col-span-2'} p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-2`}>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                      <CalendarDays className="w-4 h-4" />
                      <span>Appointment ID</span>
                    </div>
                    <div className="pl-6">
                      <p className="text-base font-mono text-gray-600 dark:text-gray-400">
                        {selectedAppointment.id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedAppointment.notes && (
                  <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Notes
                    </h3>
                    <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-xl font-medium transition-all"
                  >
                    Close
                  </button>
                  <button className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md">
                    Edit Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards - Below Calendar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Appointments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Appointments
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            In selected date range
          </p>
        </div>

        {/* Confirmed */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Confirmed
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.confirmed}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {stats.total > 0 ? `${Math.round((stats.confirmed / stats.total) * 100)}%` : '0%'} of total
          </p>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Awaiting confirmation
          </p>
        </div>

        {/* Cancelled */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Cancelled
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {stats.cancelled}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {stats.total > 0 ? `${Math.round((stats.cancelled / stats.total) * 100)}%` : '0%'} of total
          </p>
        </div>
      </div>
    </div>
  )
}
