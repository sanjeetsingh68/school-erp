import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Bell, 
  X, 
  Search, 
  Check, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  ClipboardCheck, 
  GraduationCap, 
  BookOpen, 
  RefreshCw, 
  BarChart2, 
  Settings, 
  ShieldAlert, 
  UserCheck, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { SystemNotification } from '../types';

interface NotificationCenterProps {
  notifications: SystemNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDeleteNotification: (id: string) => void;
  onReviewLeave: (id: string, status: 'Approved' | 'Rejected', comment: string) => Promise<void>;
  onNavigate: (tabId: string) => void;
  onClose: () => void;
  darkTheme: boolean;
}

type TabType = 'All' | 'Unread' | 'Pending Requests' | 'Attendance' | 'Teachers' | 'Academics' | 'System';

export default function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onReviewLeave,
  onNavigate,
  onClose,
  darkTheme
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  // Filter & Search Logic
  const filteredNotifications = notifications.filter(n => {
    // 1. Tab Filter
    if (activeTab === 'Unread' && n.read) return false;
    if (activeTab === 'Pending Requests') {
      const isPendingLeave = n.category === 'leave' && n.message.toLowerCase().includes('pending');
      const isSubRequired = n.category === 'substitute' && n.message.toLowerCase().includes('required');
      if (!isPendingLeave && !isSubRequired && !n.title.toLowerCase().includes('pending')) {
        return false;
      }
    }
    if (activeTab === 'Attendance' && n.category !== 'attendance') return false;
    if (activeTab === 'Teachers') {
      // Teachers tab includes leave requests or substitutions
      if (n.category !== 'leave' && n.category !== 'substitute') return false;
    }
    if (activeTab === 'Academics' && n.category !== 'academic') return false;
    if (activeTab === 'System' && n.category !== 'system') return false;

    // 2. Search Box Filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const titleMatch = n.title.toLowerCase().includes(query);
      const msgMatch = n.message.toLowerCase().includes(query);
      const catMatch = (n.category || '').toLowerCase().includes(query);
      
      // Check metadata names
      const teacherMatch = n.meta?.teacherName?.toLowerCase().includes(query);
      const dateMatch = n.meta?.date?.toLowerCase().includes(query) || n.createdAt.toLowerCase().includes(query);

      return titleMatch || msgMatch || catMatch || teacherMatch || dateMatch;
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleReviewAction = async (notificationId: string, leaveRequestId: string, status: 'Approved' | 'Rejected') => {
    setLoadingActionId(notificationId);
    try {
      await onReviewLeave(leaveRequestId, status, `${status} directly via interactive Notification Center.`);
      // After reviewing leave, also mark this notification as read or dismiss it
      onMarkRead(notificationId);
    } catch (err) {
      console.error('Failed to review leave from notification panel', err);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleNotificationClick = (n: SystemNotification) => {
    if (!n.read) {
      onMarkRead(n.id);
    }
    
    // Auto navigation depending on category
    if (n.category === 'leave') {
      onNavigate('leaves');
    } else if (n.category === 'attendance') {
      onNavigate('attendance');
    } else if (n.category === 'substitute') {
      onNavigate('substitute');
    } else if (n.category === 'reports') {
      onNavigate('reports');
    } else if (n.category === 'academic') {
      onNavigate('timetable');
    } else {
      onNavigate('dashboard');
    }
    onClose();
  };

  // Get icons and badge styles for category
  const getCategoryDetails = (category?: string) => {
    switch (category) {
      case 'leave':
        return {
          icon: <Calendar className="h-4 w-4" />,
          color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
          label: 'Leave Request'
        };
      case 'attendance':
        return {
          icon: <ClipboardCheck className="h-4 w-4" />,
          color: 'text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400',
          label: 'Attendance Alert'
        };
      case 'student':
        return {
          icon: <GraduationCap className="h-4 w-4" />,
          color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400',
          label: 'Student Request'
        };
      case 'academic':
        return {
          icon: <BookOpen className="h-4 w-4" />,
          color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400',
          label: 'Academic alert'
        };
      case 'substitute':
        return {
          icon: <RefreshCw className="h-4 w-4" />,
          color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400',
          label: 'Substitute alert'
        };
      case 'reports':
        return {
          icon: <BarChart2 className="h-4 w-4" />,
          color: 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-950/30 dark:text-fuchsia-400',
          label: 'Reports & Analytics'
        };
      case 'system':
      default:
        return {
          icon: <Settings className="h-4 w-4" />,
          color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-350',
          label: 'System Notification'
        };
    }
  };

  // Formatter for relative timestamps
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      // Fallback format if invalid date
      if (isNaN(date.getTime())) return 'Today';
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      
      return `${day} ${month} • ${hours}:${minutes}`;
    } catch {
      return 'Today';
    }
  };

  const tabs: TabType[] = [
    'All', 
    'Unread', 
    'Pending Requests', 
    'Attendance', 
    'Teachers', 
    'Academics', 
    'System'
  ];

  return (
    <>
      {/* Backdrop for click outside */}
      <div 
        id="notification-backdrop" 
        className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20" 
        onClick={onClose} 
      />

      {/* Main Dropdown Panel */}
      <motion.div
        id="notification-panel"
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.98 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className={`absolute right-0 mt-3 w-[26rem] max-w-[calc(100vw-2rem)] z-50 rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
          darkTheme 
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-slate-950/80' 
            : 'bg-white border-slate-150 text-slate-800 shadow-slate-200/60'
        }`}
        style={{ transformOrigin: 'top right' }}
      >
        {/* Header Block */}
        <div className="px-5 py-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
          <div>
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500 animate-pulse" />
              Notification Center
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                id="btn-mark-all-read"
                onClick={onMarkAllRead}
                className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 dark:text-blue-400 cursor-pointer transition-colors"
              >
                Mark All as Read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search Bar Block */}
        <div className="px-4 py-2 border-b dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10 flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            id="search-notifications-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications, teachers, student ID..."
            className="w-full bg-transparent border-none text-[11px] font-medium placeholder-slate-400 focus:outline-none focus:ring-0 py-1"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Horizontal Category Tab Filter */}
        <div className="border-b dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto px-3.5 py-2 scrollbar-none scroll-smooth">
          {tabs.map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : darkTheme
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Notification Scrollable Content Area */}
        <div className="flex-1 max-h-[25rem] overflow-y-auto divide-y dark:divide-slate-800 select-none">
          <AnimatePresence initial={false}>
            {filteredNotifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 px-6 text-center flex flex-col items-center justify-center space-y-2"
              >
                <div className="text-3xl">✅</div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">You're all caught up!</h4>
                <p className="text-[11px] text-slate-400 font-semibold max-w-[16rem]">
                  {searchQuery ? 'No matching notifications found.' : 'No new notifications at the moment.'}
                </p>
              </motion.div>
            ) : (
              filteredNotifications.map(n => {
                const cat = getCategoryDetails(n.category);
                const isUnread = !n.read;
                
                // Priority color maps
                const priorityStyles = {
                  high: 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/30',
                  medium: 'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30',
                  low: 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30'
                };
                const priorityText = {
                  high: '🔴 High',
                  medium: '🟠 Medium',
                  low: '🟢 Low'
                };

                // Check if this is a pending leave approval
                const isPendingLeave = n.category === 'leave' && n.relatedRecordId && n.message.toLowerCase().includes('requested');

                return (
                  <motion.div
                    key={n.id}
                    layoutId={`notif-card-${n.id}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className={`p-4 relative transition-all border-l-4 ${
                      isUnread 
                        ? 'border-l-blue-600 bg-blue-50/15 dark:bg-blue-950/10' 
                        : 'border-l-transparent bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-950/10'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Left category icon */}
                      <div className={`p-2 rounded-xl h-fit shrink-0 ${cat.color}`}>
                        {cat.icon}
                      </div>

                      {/* Content middle */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                            {cat.label}
                          </span>
                          
                          {/* Priority Badge */}
                          {n.priority && (
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${priorityStyles[n.priority]}`}>
                              {priorityText[n.priority]}
                            </span>
                          )}

                          {isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>

                        {/* Title & Description */}
                        <h4 className={`text-[11.5px] font-bold mt-1 text-slate-900 dark:text-white leading-tight`}>
                          {n.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                          {n.message}
                        </p>

                        {/* Leave details drilldown */}
                        {isPendingLeave && n.meta && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border dark:border-slate-800 text-[10px] space-y-1 text-slate-600 dark:text-slate-400">
                            <p><span className="font-bold">Applicant:</span> {n.meta.teacherName || 'Faculty Member'}</p>
                            <p><span className="font-bold">Leave:</span> {n.meta.reason || 'Medical Leave'}</p>
                            <p><span className="font-bold">Timeline:</span> {n.meta.date || 'Pending'}</p>
                            <p className="flex items-center gap-1.5 mt-1 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Status: Pending Approval
                            </p>
                          </div>
                        )}

                        {/* Action buttons bar */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {/* Pending Leave Approval Controls */}
                          {isPendingLeave && n.relatedRecordId ? (
                            <>
                              <button
                                disabled={loadingActionId === n.id}
                                onClick={() => handleReviewAction(n.id, n.relatedRecordId!, 'Approved')}
                                className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer transition-all disabled:opacity-50"
                              >
                                {loadingActionId === n.id ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                disabled={loadingActionId === n.id}
                                onClick={() => handleReviewAction(n.id, n.relatedRecordId!, 'Rejected')}
                                className="px-2.5 py-1 text-[10px] font-extrabold bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg cursor-pointer transition-all disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleNotificationClick(n)}
                              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View Details
                            </button>
                          )}

                          {isUnread && (
                            <button
                              onClick={() => onMarkRead(n.id)}
                              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                              Mark as Read
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right top date & dismiss trash */}
                      <div className="absolute right-3.5 top-3.5 flex flex-col items-end gap-1.5">
                        <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">
                          {formatTime(n.createdAt)}
                        </span>
                        <button
                          onClick={() => onDeleteNotification(n.id)}
                          className="p-1 rounded text-slate-350 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
                          title="Dismiss notification"
                          style={{ transition: 'opacity 0.2s, color 0.2s' }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Footer Area */}
        <div className="px-4 py-3 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-center shrink-0">
          <button
            onClick={() => {
              onNavigate('dashboard');
              onClose();
            }}
            className="text-[10px] font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          >
            Go to Main Dashboard
          </button>
          
          <span className="text-[9px] text-slate-400 font-black tracking-wider uppercase">
            XYZ School ERP v4.2.0
          </span>
        </div>
      </motion.div>
    </>
  );
}
