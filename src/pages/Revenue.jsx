import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { IndianRupee, Calendar, Download, Share2, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

const Revenue = () => {
  const { bookings, settings } = useData();
  const [dateRange, setDateRange] = useState('today'); // today, week, month, year, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filter Bookings based on Range
  const filteredBookings = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (dateRange === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start.getTime() + 86400000);
    } else if (dateRange === 'week') {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
    } else if (dateRange === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      start = new Date(customStartDate);
      end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
    }

    return bookings.filter(b => {
      const d = new Date(b.booking_time);
      return d >= start && d <= end && b.payment_status === 'paid';
    }).sort((a, b) => new Date(b.booking_time) - new Date(a.booking_time));
  }, [bookings, dateRange, customStartDate, customEndDate]);

  // Calculate Summary
  const summary = useMemo(() => {
    const total = filteredBookings.reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
    const cash = filteredBookings
      .filter(b => {
        // Assuming we track payment method in 'payments' table, but for now we might need to join or assume from booking context if stored.
        // Wait, we added 'payments' table but didn't link it back to booking object in 'useData' fetch yet?
        // 'bookings' from useData is just the bookings table.
        // We need to fetch payments or store payment method in bookings for easier access.
        // For now, let's assume all are 'cash' or 'upi' if we can find it.
        // Actually, we didn't add 'payment_method' column to bookings table, only to payments table.
        // So 'bookings' object doesn't have payment method directly unless we join.
        // To avoid complex join logic right now, I'll skip method breakdown or fetch it.
        // Let's just show Total for now, or try to infer if we can.
        return true; 
      })
      .reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
      
    return { total, count: filteredBookings.length };
  }, [filteredBookings]);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 55, 117); // Al-Nassr Blue
    doc.text("Dream Sports Academy", 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Revenue Report", 14, 32);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 38);
    doc.text(`Period: ${dateRange.toUpperCase()}`, 14, 44);

    // Summary
    doc.setFillColor(252, 201, 16); // Al-Nassr Yellow
    doc.rect(14, 50, 182, 24, 'F');
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Total Revenue: Rs. ${summary.total.toLocaleString()}`, 20, 65);
    doc.text(`Total Bookings: ${summary.count}`, 120, 65);

    // Table
    const tableColumn = ["Date", "Customer", "Phone", "Amount"];
    const tableRows = [];

    filteredBookings.forEach(booking => {
      const bookingData = [
        new Date(booking.booking_time).toLocaleDateString(),
        booking.customer_name,
        booking.phone_number,
        `Rs. ${booking.total_amount}`,
      ];
      tableRows.push(bookingData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      theme: 'grid',
      headStyles: { fillColor: [0, 55, 117] },
    });

    doc.save(`revenue_report_${dateRange}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF Report downloaded!');
  };



  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Revenue Analysis</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track earnings and generate reports.</p>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={generatePDF}
             className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
           >
             <Download size={18} />
             <span className="hidden sm:inline">Download PDF</span>
           </button>

        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-4">
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          {['today', 'week', 'month', 'year', 'custom'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                dateRange === range
                  ? 'bg-white dark:bg-gray-600 text-alnassr-blue shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-alnassr-blue to-blue-900 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center gap-3 mb-2 opacity-80">
            <IndianRupee size={20} />
            <span className="font-medium">Total Revenue</span>
          </div>
          <div className="text-3xl font-bold">₹{summary.total.toLocaleString()}</div>
          <div className="text-sm mt-2 opacity-70">For selected period</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
           <div className="flex items-center gap-3 mb-2 text-gray-500 dark:text-gray-400">
            <FileText size={20} />
            <span className="font-medium">Total Bookings</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white">{summary.count}</div>
          <div className="text-sm mt-2 text-gray-400">Paid bookings</div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-white">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(booking.booking_time).toLocaleDateString()}
                    <div className="text-xs text-gray-400">{new Date(booking.booking_time).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.customer_name}</div>
                    <div className="text-xs text-gray-500">{booking.phone_number}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                    ₹{booking.total_amount}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No transactions found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Revenue;
