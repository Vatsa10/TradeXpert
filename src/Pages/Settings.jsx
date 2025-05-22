import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from '../context/ThemeContext';
import '../styles/Settings.css';

function Settings() {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    email: '',
    twoFactorAuth: false,
    profileVisibility: 'public',
    dataSharing: false,
    adPreferences: 'personalized',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add form submission logic here
    console.log('Form data submitted:', formData);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const sections = [
    {
      title: "Account Settings",
      description: "Manage your account details and preferences.",
      content: (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="New Password"
              className="medium-input"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm Password"
              className="medium-input"
            />
          </div>
          <div className="form-group">
            <label>Update Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="New Email"
              className="medium-input"
            />
          </div>
          <div className="form-group toggle-group">
            <label>Two-Factor Authentication</label>
            <label className="switch">
              <input
                type="checkbox"
                name="twoFactorAuth"
                checked={formData.twoFactorAuth}
                onChange={handleInputChange}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className={`settings-button ${theme}`}
          >
            Save Changes
          </motion.button>
        </form>
      )
    },
    {
      title: "Privacy Settings",
      description: "Control your privacy and data settings.",
      content: (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Profile Visibility</label>
            <select
              name="profileVisibility"
              value={formData.profileVisibility}
              onChange={handleInputChange}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="form-group toggle-group">
            <label>Data Sharing</label>
            <label className="switch">
              <input
                type="checkbox"
                name="dataSharing"
                checked={formData.dataSharing}
                onChange={handleInputChange}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="form-group">
            <label>Ad Preferences</label>
            <select
              name="adPreferences"
              value={formData.adPreferences}
              onChange={handleInputChange}
            >
              <option value="personalized">Personalized Ads</option>
              <option value="non-personalized">Non-Personalized Ads</option>
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className={`settings-button ${theme}`}
          >
            Save Changes
          </motion.button>
        </form>
      )
    },
    {
      title: "Notification Settings",
      description: "Customize your notification preferences.",
      content: (
        <form onSubmit={handleSubmit}>
          <div className="form-group toggle-group">
            <label>Email Notifications</label>
            <label className="switch">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={formData.emailNotifications}
                onChange={handleInputChange}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="form-group toggle-group">
            <label>SMS Notifications</label>
            <label className="switch">
              <input
                type="checkbox"
                name="smsNotifications"
                checked={formData.smsNotifications}
                onChange={handleInputChange}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="form-group toggle-group">
            <label>Push Notifications</label>
            <label className="switch">
              <input
                type="checkbox"
                name="pushNotifications"
                checked={formData.pushNotifications}
                onChange={handleInputChange}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className={`settings-button ${theme}`}
          >
            Save Changes
          </motion.button>
        </form>
      )
    }
  ];

  return (
    <motion.div 
      className={`settings-container ${theme}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <h1>Settings</h1>
      <p>Customize your experience.</p>
      {sections.map((section, index) => (
        <motion.div
          key={index}
          variants={sectionVariants}
          className={`settings-section ${theme}`}
        >
          <h2>{section.title}</h2>
          <p>{section.description}</p>
          {section.content}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default Settings;
