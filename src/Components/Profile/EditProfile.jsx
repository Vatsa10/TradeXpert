import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { FiMail, FiPhone, FiSave, FiArrowLeft } from 'react-icons/fi';
import "./EditProfile.css";

function EditProfile() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { userDetails, updateUserDetails } = useUser();
  const [editedDetails, setEditedDetails] = useState(userDetails || {});
  const [tempImage, setTempImage] = useState(null);

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
    navigate('/profile');
  };

  if (!userDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`edit-profile-container ${theme}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="edit-profile-card"
      >
        <div className="edit-header">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="back-button"
            onClick={() => navigate('/profile')}
          >
            <FiArrowLeft /> Back
          </motion.button>
          <h2>Edit Profile</h2>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="photo-section">
            <div className="profile-photo-container">
              <img
                src={tempImage || editedDetails.profilePhoto}
                alt="Profile"
                className="profile-photo"
              />
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
            </div>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="username"
              value={editedDetails.username}
              onChange={handleInputChange}
              className={theme}
              placeholder="Enter your name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className="input-icon-group">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                value={editedDetails.email}
                onChange={handleInputChange}
                className={theme}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Mobile</label>
            <div className="input-icon-group">
              <FiPhone className="input-icon" />
              <input
                type="tel"
                name="mobile"
                value={editedDetails.mobile}
                onChange={handleInputChange}
                className={theme}
                placeholder="Enter your mobile number"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className={`save-button ${theme}`}
          >
            <FiSave /> Save Changes
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default EditProfile;
