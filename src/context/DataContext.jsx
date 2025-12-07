import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../utils/supabase';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Settings Logic ---
  const fetchConstants = async () => {
    try {
      const { data, error } = await supabase
        .from('constants')
        .select('*');

      if (error) throw error;
    // console.log(data)
      const settingsMap = {};
      data.forEach(item => {
        settingsMap[item.name] = item.value;
      });
      setSettings(settingsMap);
      return settingsMap;
    } catch (error) {
      console.error('Error fetching constants:', error);
      return {};
    }
  };

  const checkAndCreateDefaults = async (currentSettings) => {
    if (currentSettings['hourly_rate'] === undefined) {
      try {
        const { data, error } = await supabase
          .from('constants')
          .insert([{ name: 'hourly_rate', value: '0' }])
          .select();

        if (error) throw error;
        
        if (data) {
             setSettings(prev => ({ ...prev, hourly_rate: data[0].value }));
        }
      } catch (error) {
        console.error('Error creating default constant:', error);
      }
    }
  };

  const updateConstant = async (name, value) => {
    try {
      // Use upsert to ensure the row exists and is updated
      const { data, error } = await supabase
        .from('constants')
        .upsert({ name, value }, { onConflict: 'name' })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setSettings(prev => ({ ...prev, [name]: data[0].value }));
        return { data, error: null };
      }
      return { data: null, error: new Error("No data returned from update") };
    } catch (error) {
      console.error('Error updating constant:', error);
      return { data: null, error };
    }
  };

  // --- Bookings Logic ---
  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*');

      if (error) throw error;
      setBookings(data || []);
      return data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Fallback to empty array if table doesn't exist yet to avoid crashing
      setBookings([]); 
      return [];
    }
  };

  const addBooking = async (bookingData) => {
    try {
      const payload = {
        ...bookingData,
        created_by: user.id // Ensure created_by is set
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([payload])
        .select();

      if (error) throw error;

      if (data) {
        setBookings(prev => [...prev, ...data]);
        return { data, error: null };
      }
    } catch (error) {
      console.error('Error adding booking:', error);
      return { data: null, error };
    }
  };
  
  // Helper for adding multiple bookings (for multi-hour slots)
  const addBookings = async (bookingsData) => {
      try {
        const payload = bookingsData.map(b => ({
            ...b,
            created_by: user.id
        }));

        const { data, error } = await supabase
          .from('bookings')
          .insert(payload)
          .select();
  
        if (error) throw error;
  
        if (data) {
          setBookings(prev => [...prev, ...data]);
          return { data, error: null };
        }
      } catch (error) {
        console.error('Error adding bookings:', error);
        return { data: null, error };
      }
    };

  const updateBooking = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (data) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
        return { data, error: null };
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      return { data: null, error };
    }
  };

  const deleteBooking = async (id) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBookings(prev => prev.filter(booking => booking.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error deleting booking:', error);
      return { error };
    }
  };

  const addPayment = async (paymentData) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error adding payment:', error);
      return { error };
    }
  };
  // --- Initialization ---
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchConstants(), 
        fetchBookings()
    ]).then(([settingsData]) => {
        checkAndCreateDefaults(settingsData);
        setLoading(false);
      });
    } else {
        setLoading(false);
    }
  }, [user]);

  const value = {
    settings,
    updateConstant,
    bookings,
    addBooking,
    addBookings,
    updateBooking,
    deleteBooking,
    addPayment,
    loading
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  return useContext(DataContext);
};
