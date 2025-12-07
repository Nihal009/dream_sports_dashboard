// Bookings Page
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Check, IndianRupee, User, Phone, Clock, Plus, Info, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateBookingsReport } from '../utils/pdfGenerator';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';

const Bookings = () => {
  const { bookings, addBookings, updateBooking, deleteBooking, addPayment, settings } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null); // For details modal
  const [hourlyRate, setHourlyRate] = useState(150);
  const [openTime, setOpenTime] = useState(6); // Default 6 AM
  const [closeTime, setCloseTime] = useState(23); // Default 11 PM
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState('choice'); // choice, method, verify
  const [paymentMethod, setPaymentMethod] = useState(null); // cash, upi
  const [pendingBookingId, setPendingBookingId] = useState(null);
  const [pendingBookingAmount, setPendingBookingAmount] = useState(0);

  // Modal Form State
  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    date: '',
    startTime: '10:00',
    duration: 1,
    total_amount: 150,
    payment_status: 'pending'
  });

  useEffect(() => {
    if (settings) {
      if (settings.hourly_rate) setHourlyRate(parseInt(settings.hourly_rate));
      if (settings.open_time) setOpenTime(parseInt(settings.open_time.split(':')[0]));
      if (settings.close_time) setCloseTime(parseInt(settings.close_time.split(':')[0]));
    }
  }, [settings]);

  // Update amount when duration or hourly rate changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      total_amount: hourlyRate * prev.duration
    }));
  }, [formData.duration, hourlyRate]);

  const handleNewBooking = () => {
    const now = new Date();
    const currentHours = now.getHours().toString().padStart(2, '0');
    const currentMinutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${currentHours}:${currentMinutes}`;
    
    // Format date as YYYY-MM-DD for input type="date"
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    setFormData({ 
      customer_name: '', 
      phone_number: '', 
      date: dateStr,
      startTime: currentTime, 
      duration: 1, 
      total_amount: hourlyRate, 
      payment_status: 'pending' 
    });
    setIsModalOpen(true);
  };

  const getBookingDateTime = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return d;
  };

  const checkAvailability = (newStart, newEnd) => {
    const now = new Date();
    
    // Check for past time
    if (newStart < now) {
        return { valid: false, message: "Cannot book for a past time." };
    }

    // Check if within open hours
    const startHour = newStart.getHours();
    const endHour = newEnd.getHours();
    const endMinutes = newEnd.getMinutes();
    
    if (startHour < openTime || (endHour > closeTime) || (endHour === closeTime && endMinutes > 0)) {
        return { valid: false, message: `Booking must be between ${openTime}:00 and ${closeTime}:00.` };
    }

    // Filter bookings for the selected date
    const bookingDateStr = newStart.toDateString();
    const dayBookings = bookings.filter(b => 
      new Date(b.booking_time).toDateString() === bookingDateStr
    );

    for (const booking of dayBookings) {
      const existingStart = new Date(booking.booking_time);
      const existingEnd = new Date(booking.end_time);

      // Check overlap: (StartA < EndB) && (EndA > StartB)
      if (newStart < existingEnd && newEnd > existingStart) {
        return { valid: false, message: "Selected time overlaps with an existing booking." };
      }
    }
    return { valid: true };
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    
    const startDateTime = getBookingDateTime(formData.date, formData.startTime);
    const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60 * 60 * 1000);

    const availability = checkAvailability(startDateTime, endDateTime);
    if (!availability.valid) {
      toast.error(availability.message);
      return;
    }

    const bookingData = {
      customer_name: formData.customer_name,
      phone_number: formData.phone_number,
      booking_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      total_amount: formData.total_amount,
      payment_status: 'pending', // Always start as pending
      duration: formData.duration,
      booking_status: 'confirmed'
    };

    const { data, error } = await addBookings([bookingData]);
    
    if (!error && data) {
      toast.success('Booking created! Proceed to payment.');
      setIsModalOpen(false);
      
      // Initialize Payment Flow
      setPendingBookingId(data[0].id);
      setPendingBookingAmount(formData.total_amount);
      setPaymentStep('choice');
      setIsPaymentModalOpen(true);

      // Update selected date to the booking date so user can see it
      setSelectedDate(new Date(startDateTime));
    } else if (error) {
      toast.error("Failed to save booking: " + error.message);
    }
  };

  const handlePaymentComplete = async () => {
    if (!pendingBookingId) return;

    // 1. Update booking status
    const { error: updateError } = await updateBooking(pendingBookingId, { payment_status: 'paid' });
    
    if (updateError) {
      toast.error('Failed to update booking status');
      return;
    }

    // 2. Add payment record
    const { error: paymentError } = await addPayment({
      booking_id: pendingBookingId,
      amount_paid: pendingBookingAmount,
      payment_method: paymentMethod
    });

    if (paymentError) {
      console.error('Failed to record payment:', paymentError);
      toast.error('Booking updated but failed to record payment details');
    } else {
      toast.success('Payment confirmed and recorded!');
    }

    setIsPaymentModalOpen(false);
    setPendingBookingId(null);
    setPendingBookingAmount(0);
  };

  const handleUpdateStatus = async (booking, field, value) => {
    const { error } = await updateBooking(booking.id, { [field]: value });
    if (!error) {
        toast.success(`Booking ${field.replace('_', ' ')} updated!`);
        setSelectedBooking(prev => ({ ...prev, [field]: value }));
    } else {
        toast.error("Failed to update booking.");
    }
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
        const { error } = await deleteBooking(id);
        if (!error) {
            toast.success("Booking deleted successfully!");
            setSelectedBooking(null);
        } else {
            toast.error("Failed to delete booking.");
        }
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  // Filter and sort bookings for the selected date
  const dayBookings = bookings
    .filter(b => new Date(b.booking_time).toDateString() === selectedDate.toDateString())
    .sort((a, b) => new Date(a.booking_time) - new Date(b.booking_time));

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate Time Frame for Modal
  const calculateTimeFrame = () => {
    if (!formData.date || !formData.startTime) return '';
    const start = getBookingDateTime(formData.date, formData.startTime);
    const end = new Date(start.getTime() + formData.duration * 60 * 60 * 1000);
    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Grid Calculation
  const totalHours = closeTime - openTime;
  const hoursArray = Array.from({ length: totalHours + 1 }, (_, i) => openTime + i);

  return (
    <div className="space-y-6 w-full h-[calc(100vh-100px)] flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Daily Court Schedule</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Open: {openTime}:00 - {closeTime}:00
          </p>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <button onClick={handlePrevDay} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            <div className="flex items-center gap-2 px-2 font-medium text-gray-800 dark:text-white min-w-[200px] justify-center">
                <CalendarIcon size={18} className="text-alnassr-blue dark:text-alnassr-yellow" />
                {formatDate(selectedDate)}
            </div>
            <button onClick={handleNextDay} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
            </div>
            
            <button 
                onClick={handleNewBooking}
                className="bg-alnassr-blue hover:bg-alnassr-blue-dark text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all transform hover:scale-105 border border-transparent hover:border-alnassr-yellow"
            >
                <Plus size={20} />
                New Booking
            </button>
        </div>
      </div>

      {/* Legends */}
      <div className="flex items-center gap-4 px-1 text-sm">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Paid</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Unpaid</span>
        </div>
      </div>

      {/* Horizontal Timeline View (Full Width) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col flex-1">
        
        {/* Timeline Container */}
        <div className="relative w-full h-full p-4 flex flex-col">
            
            {/* Time Labels */}
            <div className="flex w-full h-8 border-b border-gray-100 dark:border-gray-700">
              {hoursArray.map((hour) => (
                <div key={hour} className="flex-1 text-xs text-gray-400 border-l border-gray-100 dark:border-gray-700/50 pl-1">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
              ))}
            </div>

            {/* Booking Area */}
            <div className="relative flex-1 w-full mt-2">
                {/* Grid Lines (Background) */}
                <div className="absolute inset-0 flex pointer-events-none">
                    {hoursArray.map((_, i) => (
                        <div key={i} className="flex-1 border-l border-gray-50 dark:border-gray-800/50 h-full"></div>
                    ))}
                </div>

                {/* Current Time Indicator */}
                {selectedDate.toDateString() === new Date().toDateString() && (
                (() => {
                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    const startMinutes = openTime * 60;
                    const totalMinutes = totalHours * 60;
                    const percentage = ((currentMinutes - startMinutes) / totalMinutes) * 100;
                    
                    if (percentage >= 0 && percentage <= 100) {
                    return (
                        <div 
                        className="absolute top-0 bottom-0 border-l-2 border-red-500 z-20 pointer-events-none"
                        style={{ left: `${percentage}%` }}
                        >
                        <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1.5"></div>
                        </div>
                    );
                    }
                    return null;
                })()
                )}

                {/* Booking Blocks */}
                {dayBookings.map((booking) => {
                    const start = new Date(booking.booking_time);
                    const end = new Date(booking.end_time);
                    
                    const startMinutes = start.getHours() * 60 + start.getMinutes();
                    const endMinutes = end.getHours() * 60 + end.getMinutes();
                    const gridStartMinutes = openTime * 60;
                    const totalMinutes = totalHours * 60;
                    
                    const leftPercent = ((startMinutes - gridStartMinutes) / totalMinutes) * 100;
                    const widthPercent = ((endMinutes - startMinutes) / totalMinutes) * 100;

                    // Skip if out of bounds (shouldn't happen with validation, but safe to check)
                    if (widthPercent <= 0) return null;

                    return (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`absolute top-2 bottom-2 rounded-xl border-l-4 p-3 overflow-visible shadow-md cursor-pointer hover:shadow-xl transition-all z-10 group
                                ${booking.payment_status === 'paid'
                                ? 'bg-green-50 border-green-500 text-green-900 dark:bg-green-900/20 dark:text-green-100' 
                                : 'bg-red-50 border-red-500 text-red-900 dark:bg-red-900/20 dark:text-red-100'
                                }
                            `}
                            style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                            onClick={() => setSelectedBooking(booking)}
                        >
                            <div className="font-bold text-sm md:text-base truncate">{booking.customer_name}</div>
                            <div className="truncate opacity-80 text-xs mt-0.5">
                                {formatTime(booking.booking_time)} - {formatTime(booking.end_time)}
                            </div>
                            
                            {/* Hover Tooltip Popup */}
                            <div className={`absolute top-0 w-48 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 ${leftPercent > 50 ? 'right-full mr-2' : 'left-full ml-2'}`}>
                                <div className="font-bold text-sm mb-1">{booking.customer_name}</div>
                                <div className="flex items-center gap-1 opacity-80 mb-0.5">
                                    <Clock size={10} />
                                    {formatTime(booking.booking_time)} - {formatTime(booking.end_time)}
                                </div>
                                <div className="flex items-center gap-1 opacity-80 mb-1">
                                    <Phone size={10} />
                                    {booking.phone_number}
                                </div>
                                <div className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${booking.payment_status === 'paid' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                    {booking.payment_status === 'paid' ? 'PAID' : 'UNPAID'}
                                </div>
                                {/* Arrow */}
                                <div className={`absolute top-4 border-4 border-transparent ${leftPercent > 50 ? 'left-full border-l-gray-900' : 'right-full border-r-gray-900'}`}></div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* New Booking Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div onClick={(e) => {setIsModalOpen(false)}} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={e=>e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-alnassr-blue p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">New Booking</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="text-gray-400" size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.customer_name}
                      onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-alnassr-blue"
                      placeholder="Enter customer name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="text-gray-400" size={18} />
                    </div>
                    <input
                      type="tel"
                      required
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-alnassr-blue"
                      placeholder="+91 ..."
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                    <div className="relative">
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-alnassr-blue"
                        />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                    <div className="relative">
                        <input
                            type="time"
                            required
                            min={`${openTime < 10 ? '0' + openTime : openTime}:00`}
                            max={`${closeTime < 10 ? '0' + closeTime : closeTime}:00`}
                            value={formData.startTime}
                            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-alnassr-blue"
                        />
                    </div>
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (Hrs)</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-alnassr-blue"
                    />
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Frame</label>
                    <input
                        type="text"
                        readOnly
                        value={calculateTimeFrame()}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-medium cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Amount</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <IndianRupee className="text-gray-400" size={16} />
                        </div>
                        <input
                        type="number"
                        readOnly
                        value={formData.total_amount}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-bold cursor-not-allowed"
                        />
                    </div>
                </div>



                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium hover:border-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-alnassr-blue text-white rounded-lg hover:bg-alnassr-blue-dark transition-colors font-medium border border-transparent hover:border-alnassr-yellow"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-alnassr-blue p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {paymentStep === 'choice' && 'Payment Option'}
                  {paymentStep === 'method' && 'Select Payment Method'}
                  {paymentStep === 'verify' && 'Verify Payment'}
                </h3>
                <button onClick={() => setIsPaymentModalOpen(false)} className="text-white/80 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {/* Step 1: Pay Now or Later */}
                {paymentStep === 'choice' && (
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
                      Booking created successfully! Do you want to complete the payment now?
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setIsPaymentModalOpen(false)}
                        className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-center group"
                      >
                        <Clock className="mx-auto mb-2 text-gray-400 group-hover:text-gray-600" size={32} />
                        <span className="font-bold text-gray-600 dark:text-gray-300">Pay Later</span>
                      </button>
                      <button
                        onClick={() => setPaymentStep('method')}
                        className="p-4 border-2 border-alnassr-blue bg-alnassr-blue/5 rounded-xl hover:bg-alnassr-blue/10 transition-all text-center group"
                      >
                        <IndianRupee className="mx-auto mb-2 text-alnassr-blue" size={32} />
                        <span className="font-bold text-alnassr-blue">Pay Now</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Select Method */}
                {paymentStep === 'method' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          setPaymentMethod('cash');
                          setPaymentStep('verify');
                        }}
                        className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all text-center group"
                      >
                        <IndianRupee className="mx-auto mb-2 text-green-500" size={32} />
                        <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-green-600">Cash</span>
                      </button>
                      <button
                        onClick={() => {
                          setPaymentMethod('upi');
                          setPaymentStep('verify');
                        }}
                        className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-center group"
                      >
                        <div className="mx-auto mb-2 w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded font-bold text-xs">UPI</div>
                        <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-600">UPI / QR</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => setPaymentStep('choice')}
                      className="w-full text-gray-500 hover:text-gray-700 text-sm mt-4"
                    >
                      Back
                    </button>
                  </div>
                )}

                {/* Step 3: Verify & Confirm */}
                {paymentStep === 'verify' && (
                  <div className="space-y-6 text-center">
                    <div className="text-3xl font-bold text-gray-800 dark:text-white">
                      ₹{pendingBookingAmount}
                    </div>
                    
                    {paymentMethod === 'upi' && (
                      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner border border-gray-200">
                        {settings?.upi_id ? (
                          <>
                            <QRCodeCanvas 
                              value={`upi://pay?pa=${settings.upi_id}&pn=DSA&am=${pendingBookingAmount}&cu=INR`}
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
                          Please collect cash from the customer.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handlePaymentComplete}
                      className="w-full py-3 bg-alnassr-blue text-white rounded-xl font-bold hover:bg-alnassr-blue-dark transition-colors shadow-lg shadow-alnassr-blue/30"
                    >
                      Confirm Payment Received
                    </button>
                    
                    <button 
                      onClick={() => setPaymentStep('method')}
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

      {/* Booking Details Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={e=>e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
                <div className="bg-gray-50 dark:bg-gray-700 p-6 border-b border-gray-100 dark:border-gray-600 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedBooking.customer_name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(new Date(selectedBooking.booking_time))}</p>
                    </div>
                    <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <Clock className="text-alnassr-blue" size={20} />
                        <div>
                            <p className="text-xs text-gray-500">Time</p>
                            <p className="font-medium">{formatTime(selectedBooking.booking_time)} - {formatTime(selectedBooking.end_time)}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <Phone className="text-alnassr-blue" size={20} />
                        <div>
                            <p className="text-xs text-gray-500">Phone</p>
                            <p className="font-medium">{selectedBooking.phone_number}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <IndianRupee className="text-alnassr-blue" size={20} />
                        <div>
                            <p className="text-xs text-gray-500">Amount</p>
                            <p className="font-medium">₹{selectedBooking.total_amount}</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                        {/* Payment Status Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</span>
                            <button
                                onClick={() => handleUpdateStatus(selectedBooking, 'payment_status', selectedBooking.payment_status === 'paid' ? 'pending' : 'paid')}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                                    selectedBooking.payment_status === 'paid' 
                                    ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                                }`}
                            >
                                {selectedBooking.payment_status === 'paid' ? 'PAID' : 'UNPAID'}
                            </button>
                        </div>

                        {/* Delete Button */}
                        <button 
                            onClick={() => handleDeleteBooking(selectedBooking.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors font-medium mt-2"
                        >
                            <Trash2 size={18} />
                            Delete Booking
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

export default Bookings;
