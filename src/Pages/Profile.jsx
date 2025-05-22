import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { FiMail, FiPhone, FiEdit3, FiSave, FiGithub, FiLinkedin, FiDollarSign, FiBriefcase } from 'react-icons/fi';
import '../styles/Profile.css';

function Profile() {
  const { theme } = useTheme();
  const { userDetails, updateUserDetails } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState({});
  const [tempImage, setTempImage] = useState(null);

  // Add useEffect to sync userDetails with editedDetails
  useEffect(() => {
    setEditedDetails(userDetails);
  }, [userDetails]);

  if (!userDetails) {
    return <div>Loading...</div>;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setTempImage(imageUrl);
      setEditedDetails(prev => ({
        ...prev,
        profilePhoto: imageUrl
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUserDetails(editedDetails);
    setIsEditing(false);
    setTempImage(null);
  };

  const portfolioStats = {
    totalInvestments: "₹50,000",
    activePortfolios: 3,
    returns: "+12.5%",
    joinedDate: "Jan 2025"
  };

  return (
    <div className={`profile-container ${theme}`}>
      <div className="profile-content">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="profile-card"
        >
          <div className="profile-layout">
            <div className="profile-left">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="profile-photo-container"
              >
                <img
                  src={tempImage || editedDetails.profilePhoto}
                  alt="Profile"
                  className="profile-photo"
                />
                {isEditing && (
                  <label className="photo-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="photo-input"
                    />
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="change-photo-btn"
                    >
                      Change Photo
                    </motion.span>
                  </label>
                )}
              </motion.div>

              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={editedDetails.username}
                  onChange={handleInputChange}
                  className={`username-input ${theme}`}
                />
              ) : (
                <motion.h2 
                  className="username-display"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {editedDetails.username}
                </motion.h2>
              )}

              <div className="social-links">
                <a href="#" className={`social-link ${theme}`}>
                  <FiGithub />
                </a>
                <a href="#" className={`social-link ${theme}`}>
                  <FiLinkedin />
                </a>
              </div>
              <div className="join-date">
                Member since: {portfolioStats.joinedDate}
              </div>
            </div>

            <div className="profile-right">
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <div className="input-icon-group">
                    <FiMail className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      value={editedDetails.email || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`${theme} ${isEditing ? 'editable' : ''}`}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="input-icon-group">
                    <FiPhone className="input-icon" />
                    <input
                      type="tel"
                      name="mobile"
                      value={editedDetails.mobile || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`${theme} ${isEditing ? 'editable' : ''}`}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type={isEditing ? "submit" : "button"}
                  className={`action-button ${theme}`}
                  onClick={() => !isEditing && setIsEditing(true)}
                >
                  {isEditing ? (
                    <>
                      <FiSave /> Save Changes
                    </>
                  ) : (
                    <>
                      <FiEdit3 /> Edit Profile
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stats-container"
        >
          <div className="stats-grid">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={`stat-card ${theme}`}
            >
              <div className="stat-header">
                <FiDollarSign className="stat-icon" />
                <h3>Total Investments</h3>
              </div>
              <div className="stat-content">
                <p className="stat-value">{portfolioStats.totalInvestments}</p>
                <span className="stat-label">Current Balance</span>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={`stat-card ${theme}`}
            >
              <div className="stat-header">
                <FiBriefcase className="stat-icon" />
                <h3>Active Portfolios</h3>
              </div>
              <div className="stat-content">
                <p className="stat-value">{portfolioStats.activePortfolios}</p>
                <span className="stat-label">Running Investments</span>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={`stat-card ${theme}`}
            >
              <div className="stat-header">
                <FiDollarSign className="stat-icon" />
                <h3>Total Returns</h3>
              </div>
              <div className="stat-content">
                <p className="stat-value returns-positive">{portfolioStats.returns}</p>
                <span className="stat-label">Overall Growth</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Profile;
