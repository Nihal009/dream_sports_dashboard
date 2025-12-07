import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { DollarSign, Calendar, TrendingUp, Users, IndianRupee } from 'lucide-react';

const DashboardHome = () => {
  const { bookings } = useData();
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month'

  // Calculate Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Filter bookings
    const todayBookings = bookings.filter(b => {
      const d = new Date(b.booking_time);
      return d >= today && d < new Date(today.getTime() + 86400000);
    });

    const monthBookings = bookings.filter(b => new Date(b.booking_time) >= startOfMonth);

    // Calculate totals
    const totalIncome = bookings.reduce((sum, b) => sum + (b.payment_status === 'paid' ? parseFloat(b.total_amount) : 0), 0);
    const totalBookingsCount = bookings.length;
    
    // Unique customers (approximate by phone number)
    const uniqueCustomers = new Set(bookings.map(b => b.phone_number)).size;

    // Calculate growth (dummy logic for now, comparing to previous month would be ideal but complex without historical data context)
    // Let's just show month-over-month if possible, or just static for now.
    
    return {
      totalIncome,
      totalBookings: totalBookingsCount,
      uniqueCustomers,
      todayIncome: todayBookings.reduce((sum, b) => sum + (b.payment_status === 'paid' ? parseFloat(b.total_amount) : 0), 0),
      todayCount: todayBookings.length,
      monthIncome: monthBookings.reduce((sum, b) => sum + (b.payment_status === 'paid' ? parseFloat(b.total_amount) : 0), 0),
      monthCount: monthBookings.length
    };
  }, [bookings]);

  // Prepare Chart Data
  const chartData = useMemo(() => {
    const now = new Date();
    const data = [];

    if (timeRange === 'day') {
      // Hourly breakdown for today
      for (let i = 6; i <= 23; i++) {
        const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i);
        const hourEnd = new Date(hourStart.getTime() + 3600000);
        
        const hourIncome = bookings
          .filter(b => {
            const d = new Date(b.booking_time);
            return d >= hourStart && d < hourEnd && b.payment_status === 'paid';
          })
          .reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
        
        data.push({
          name: `${i}:00`,
          income: hourIncome
        });
      }
    } else if (timeRange === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayEnd = new Date(dayStart.getTime() + 86400000);

        const dayIncome = bookings
          .filter(b => {
            const bookingDate = new Date(b.booking_time);
            return bookingDate >= dayStart && bookingDate < dayEnd && b.payment_status === 'paid';
          })
          .reduce((sum, b) => sum + parseFloat(b.total_amount), 0);

        data.push({
          name: d.toLocaleDateString('en-US', { weekday: 'short' }),
          income: dayIncome
        });
      }
    } else if (timeRange === 'month') {
        // Last 30 days or weeks? Let's do weeks of current month
        // Actually, let's do last 4 weeks for simplicity
        // Or just days of month?
        // Let's do days of current month
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for(let i=1; i<=daysInMonth; i++) {
             const dayStart = new Date(now.getFullYear(), now.getMonth(), i);
             const dayEnd = new Date(dayStart.getTime() + 86400000);
             
             const dayIncome = bookings
              .filter(b => {
                const bookingDate = new Date(b.booking_time);
                return bookingDate >= dayStart && bookingDate < dayEnd && b.payment_status === 'paid';
              })
              .reduce((sum, b) => sum + parseFloat(b.total_amount), 0);
              
             data.push({
                 name: i.toString(),
                 income: dayIncome
             })
        }
    }

    return data;
  }, [bookings, timeRange]);

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
      <div className={`p-4 rounded-xl ${color} bg-opacity-20`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h1>
        <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-100 dark:border-gray-700">
          {['day', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                timeRange === range
                  ? 'bg-alnassr-yellow text-alnassr-blue shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${metrics.totalIncome.toLocaleString()}`} 
          icon={IndianRupee} 
          color="bg-green-500 text-green-600"
          subtext={`₹${metrics.monthIncome.toLocaleString()} this month`}
        />
        <StatCard 
          title="Total Bookings" 
          value={metrics.totalBookings} 
          icon={Calendar} 
          color="bg-blue-500 text-blue-600" 
          subtext={`${metrics.monthCount} this month`}
        />
        <StatCard 
          title="Today's Revenue" 
          value={`₹${metrics.todayIncome.toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-purple-500 text-purple-600" 
          subtext={`${metrics.todayCount} bookings today`}
        />
        <StatCard 
          title="Unique Customers" 
          value={metrics.uniqueCustomers} 
          icon={Users} 
          color="bg-orange-500 text-orange-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Income Analytics ({timeRange})</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FCC910" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FCC910" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }} 
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                  }}
                  formatter={(value) => [`₹${value}`, 'Income']}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#FCC910" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bookings Chart (Reusing same data for now, but could be count) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Revenue Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                  }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Bar 
                  dataKey="income" 
                  fill="#003775" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
