import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  LogOut, 
  Menu, 
  X,
  User,
  Settings,
  IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const location = useLocation();

  const { user, updateProfile, logout } = useAuth();
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');

  // ... (useEffect for display name)

  // ... (handleDisplayNameSubmit)

  // ... (resize effect)

  // ... (mobile sidebar effect)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
    navigate('/login');
    setShowLogoutConfirm(false);
  };

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/bookings', icon: CalendarDays, label: 'Bookings' },
    { path: '/admin/booking-list', icon: Menu, label: 'Booking List' },
    { path: '/admin/revenue', icon: IndianRupee, label: 'Revenue' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden relative">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Display Name Modal */}
      <AnimatePresence>
        {showDisplayNameModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="w-16 h-16 bg-alnassr-yellow/20 text-alnassr-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <User size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 text-center">Welcome!</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-center">Please enter your display name to continue.</p>
                
                <form onSubmit={handleDisplayNameSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                    <input
                      type="text"
                      required
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-alnassr-blue"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-3 bg-alnassr-blue text-white rounded-xl hover:bg-alnassr-blue-dark transition-colors font-bold shadow-lg shadow-alnassr-blue/30"
                  >
                    Save & Continue
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Confirm Logout</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to log out of your account?</p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium shadow-lg shadow-red-500/30"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isMobile ? 280 : (isSidebarOpen ? 260 : 80),
          x: isMobile && !isSidebarOpen ? -280 : 0
        }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 100, damping: 20 }}
        className={`bg-alnassr-blue text-white shadow-xl flex flex-col z-30 
          ${isMobile ? 'fixed h-full left-0 top-0' : 'relative'}
        `}
      >
        <div className="p-6 flex items-center justify-between">
          {(isSidebarOpen || isMobile) && (
            <h1 className="text-2xl font-bold text-alnassr-yellow tracking-wider">DSA</h1>
          ) 
          // : (
            // <h1 className="text-xl font-bold text-alnassr-yellow">AN</h1>
          // )
          }
          
          {!isMobile && (
            <button onClick={toggleSidebar} className="p-1 rounded hover:bg-alnassr-blue-dark transition-colors">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded hover:bg-alnassr-blue-dark transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-alnassr-yellow text-alnassr-blue font-bold shadow-lg'
                    : 'text-gray-300 hover:bg-alnassr-blue-dark hover:text-white'
                }`
              }
            >
              <item.icon size={22} />
              {(isSidebarOpen || isMobile) && (
                <span className="whitespace-nowrap">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-alnassr-blue-dark">
          <button
            onClick={handleLogoutClick}
            className={`flex items-center gap-4 px-4 py-3 w-full rounded-xl transition-all duration-200 border border-transparent
              ${(isSidebarOpen || isMobile) 
                ? 'text-red-300 hover:bg-red-500/10 hover:text-red-200 hover:border-red-500/30' 
                : 'justify-center text-red-300 hover:text-red-200'
              }
            `}
          >
            <LogOut size={22} />
            {(isSidebarOpen || isMobile) && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center justify-between px-4 md:px-8 z-10">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                <Menu size={24} />
              </button>
            )}
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white truncate">
              Admin Panel
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 dark:bg-gray-700 rounded-full">
              <div className="w-8 h-8 rounded-full bg-alnassr-yellow flex items-center justify-center text-alnassr-blue font-bold text-sm">
                {user?.user_metadata?.display_name ? user.user_metadata.display_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:block">
                {user?.user_metadata?.display_name || 'Admin User'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900 w-full">
          <Outlet />
        </main>
      </div>
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Confirm Logout</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Are you sure you want to log out of the admin panel?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLayout;
