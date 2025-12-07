import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { IndianRupee, Clock, Phone, User, Calendar, Check, X, Filter, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';

const BookingList = () => {
  const { bookings, updateBooking, addPayment, settings } = useData();
  const [filter, setFilter] = useState('today'); // today, yesterday, week, month, all
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'cash' or 'upi'

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return bookings.filter(booking => {
      const bookingDate = new Date(booking.booking_time);
      const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
      
      // Date Filter
      let dateMatch = false;
      if (filter === 'today') {
        dateMatch = bookingDay.getTime() === today.getTime();
      } else if (filter === 'yesterday') {
        dateMatch = bookingDay.getTime() === yesterday.getTime();
      } else if (filter === 'week') {
        dateMatch = bookingDate >= startOfWeek;
      } else if (filter === 'month') {
        dateMatch = bookingDate >= startOfMonth;
      } else {
        dateMatch = true;
      }

      // Search Filter
      const searchLower = searchTerm.toLowerCase();
      const searchMatch = 
        booking.customer_name.toLowerCase().includes(searchLower) ||
        booking.phone_number.includes(searchLower);

      return dateMatch && searchMatch;
    }).sort((a, b) => new Date(b.booking_time) - new Date(a.booking_time));
  }, [bookings, filter, searchTerm]);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePaymentClick = (booking) => {
    setSelectedBooking(booking);
    setIsPaymentModalOpen(true);
    setPaymentMethod(null);
  };

  const handleConfirmPayment = async () => {
    if (!selectedBooking) return;

    // 1. Update booking status
    const { error: updateError } = await updateBooking(selectedBooking.id, { payment_status: 'paid' });
    
    if (updateError) {
      toast.error('Failed to update booking status');
      return;
    }

    // 2. Add payment record
    const { error: paymentError } = await addPayment({
      booking_id: selectedBooking.id,
      amount_paid: selectedBooking.total_amount,
      payment_method: paymentMethod
    });

    if (paymentError) {
      console.error('Failed to record payment:', paymentError);
      toast.error('Booking updated but failed to record payment details');
    } else {
      toast.success('Payment received successfully!');
    }

    setIsPaymentModalOpen(false);
    setSelectedBooking(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Booking List</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage all bookings.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-alnassr-blue w-full sm:w-64"
            />
          </div>

          {/* Filter */}
          <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            {['today', 'yesterday', 'week', 'month', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  filter === f 
                    ? 'bg-alnassr-blue text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-alnassr-blue/10 text-alnassr-blue flex items-center justify-center font-bold text-xs">
                          {booking.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{booking.customer_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Phone size={10} /> {booking.phone_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{formatDate(booking.booking_time)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {formatTime(booking.booking_time)} - {formatTime(booking.end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {booking.duration_hours} hr{booking.duration_hours > 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-bold text-gray-900 dark:text-white">
                        <IndianRupee size={14} />
                        {booking.total_amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${booking.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' 
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
                        }`}
                      >
                        {booking.payment_status === 'paid' ? 'PAID' : 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {booking.payment_status !== 'paid' && (
                        <button 
                          onClick={() => handlePaymentClick(booking)}
                          className="text-alnassr-blue hover:text-alnassr-blue-dark font-medium text-sm flex items-center justify-end gap-1 ml-auto"
                        >
                          <IndianRupee size={14} />
                          Receive Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Calendar size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="font-medium">No bookings found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-alnassr-blue p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Receive Payment</h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-white/80 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {!paymentMethod ? (
                  <div className="space-y-4">
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
                      Select payment method for <strong>{selectedBooking.customer_name}</strong> (₹{selectedBooking.total_amount})
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setPaymentMethod('cash')}
                        className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-center group"
                      >
                        <IndianRupee className="mx-auto mb-2 text-green-500" size={32} />
                        <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-green-600">Cash</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('upi')}
                        className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-center group"
                      >
                        <div className="mx-auto mb-2 w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded font-bold text-xs">UPI</div>
                        <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-600">UPI / QR</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 text-center">
                    <div className="text-3xl font-bold text-gray-800 dark:text-white">
                      ₹{selectedBooking.total_amount}
                    </div>
                    
                    {paymentMethod === 'upi' && (
                      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner border border-gray-200">
                        {settings?.upi_id ? (
                          <>
                            <QRCodeCanvas 
                              value={`upi://pay?pa=${settings.upi_id}&pn=DSA&am=${selectedBooking.total_amount}&cu=INR`}
                              size={200}
                              level={"H"}
                              includeMargin={true}
                            />
                            <p className="text-xs text-gray-400 mt-2">Scan with any UPI app</p>
                            <p className="text-xs text-gray-500 font-mono mt-1">{settings.upi_id}</p>
                          </>
                        ) : (
                          <div className="text-red-500 text-sm p-4">
                            UPI ID not configured in settings.
                          </div>
                        )}
                      </div>
                    )}

                    {paymentMethod === 'cash' && (
                      <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                        <p className="text-green-800 dark:text-green-200 font-medium">
                          Confirm cash receipt from customer.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleConfirmPayment}
                      className="w-full py-3 bg-alnassr-blue text-white rounded-xl font-bold hover:bg-alnassr-blue-dark transition-colors shadow-lg shadow-alnassr-blue/30"
                    >
                      Confirm Payment Received
                    </button>
                    
                    <button 
                      onClick={() => setPaymentMethod(null)}
                      className="w-full text-gray-500 hover:text-gray-700 text-sm"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingList;
