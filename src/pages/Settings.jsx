import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Save, IndianRupee, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const Settings = () => {
  const { settings, updateConstant } = useData();
  const [localSettings, setLocalSettings] = useState({
    hourly_rate: '',
    open_time: '06:00',
    close_time: '23:00'
  });
  const [loading, setLoading] = useState({});

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        hourly_rate: settings.hourly_rate || '',
        open_time: settings.open_time || '06:00',
        close_time: settings.close_time || '23:00',
        upi_id: settings.upi_id || '',
        whatsapp_number: settings.whatsapp_number || ''
      });
    }
  }, [settings]);

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    const { error } = await updateConstant(key, localSettings[key]);
    
    setLoading(prev => ({ ...prev, [key]: false }));
    
    if (!error) {
      toast.success(`${key.replace('_', ' ')} updated successfully!`);
    } else {
      toast.error(`Failed to save ${key}: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage application preferences and configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pricing Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-fit">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <IndianRupee className="text-alnassr-blue" />
              Pricing
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set the default hourly rate.</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hourly Rate (₹)
              </label>
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="text-gray-500" size={16} />
                  </div>
                  <input
                    type="number"
                    value={localSettings.hourly_rate}
                    onChange={(e) => handleChange('hourly_rate', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-alnassr-blue"
                    placeholder="150"
                  />
                </div>
                <button
                  onClick={() => handleSave('hourly_rate')}
                  disabled={loading.hourly_rate}
                  className="bg-alnassr-blue text-white p-2 rounded-lg hover:bg-alnassr-blue-dark transition-colors disabled:opacity-50"
                >
                  {loading.hourly_rate ? <Save size={20} className="animate-spin" /> : <Save size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Settings Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-fit">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <IndianRupee className="text-alnassr-blue" />
              Payment Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure payment details.</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                UPI ID (for QR Codes)
              </label>
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={localSettings.upi_id || ''}
                    onChange={(e) => handleChange('upi_id', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-alnassr-blue"
                    placeholder="merchant@upi"
                  />
                </div>
                <button
                  onClick={() => handleSave('upi_id')}
                  disabled={loading.upi_id}
                  className="bg-alnassr-blue text-white p-2 rounded-lg hover:bg-alnassr-blue-dark transition-colors disabled:opacity-50"
                >
                  {loading.upi_id ? <Save size={20} className="animate-spin" /> : <Save size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                WhatsApp Number (for Reports)
              </label>
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={localSettings.whatsapp_number || ''}
                    onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-alnassr-blue"
                    placeholder="919876543210"
                  />
                </div>
                <button
                  onClick={() => handleSave('whatsapp_number')}
                  disabled={loading.whatsapp_number}
                  className="bg-alnassr-blue text-white p-2 rounded-lg hover:bg-alnassr-blue-dark transition-colors disabled:opacity-50"
                >
                  {loading.whatsapp_number ? <Save size={20} className="animate-spin" /> : <Save size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-fit">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Clock className="text-alnassr-blue" />
              Operating Hours
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set the daily open and close times.</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Open Time
              </label>
              <div className="flex gap-4 items-center">
                <input
                  type="time"
                  value={localSettings.open_time}
                  onChange={(e) => handleChange('open_time', e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-alnassr-blue transition-all"
                />
                <button
                  onClick={() => handleSave('open_time')}
                  disabled={loading.open_time}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  {loading.open_time ? <Save size={18} className="animate-spin" /> : <Save size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Close Time
              </label>
              <div className="flex gap-4 items-center">
                <input
                  type="time"
                  value={localSettings.close_time}
                  onChange={(e) => handleChange('close_time', e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-alnassr-blue transition-all"
                />
                <button
                  onClick={() => handleSave('close_time')}
                  disabled={loading.close_time}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  {loading.close_time ? <Save size={18} className="animate-spin" /> : <Save size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
