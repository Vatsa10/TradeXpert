import React, { useState } from "react";
import "../styles/LearnYard.css";

function LearnYard() {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const handleStart = (course) => {
    setSelectedCourse(course);
    setShowPopup(true);
  };

  const handleClose = () => {
    setShowPopup(false);
    setSelectedCourse(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>Stock Market Learning, Made Simple & Rewarding!</h1>
      <h3>Watch videos. Earn points. Build skills. Join thousands of Z-gen investors unlocking financial freedom.</h3>
      <div className="learn-cards-container">
        <div className="learn-card">
          <span className="learn-card-icon" role="img" aria-label="stock-up">📈</span>
          <h4>Why You Need This</h4>
          <p>Because your money should work harder than you. Understanding stocks = better decisions, less risk, more financial freedom.</p>
        </div>
        <div className="learn-card">
          <span className="learn-card-icon" role="img" aria-label="shield-money">💹</span>
          <h4>Nervous About Risk?</h4>
          <p>Fear comes from not knowing. Most beginners hesitate due to uncertainty. With the right knowledge, you can minimize risks and invest with confidence.</p>
        </div>
        <div className="learn-card">
          <span className="learn-card-icon" role="img" aria-label="money-bag">💰</span>
          <h4>Your Gains After This</h4>
          <p>Clarity. Confidence. Control. You'll spot opportunities, avoid costly mistakes, and build wealth for your future—on your own terms.</p>
        </div>
      </div>
      <h1>Choose Your Learning Path</h1>
      <h3>Stack your knowledge from beginner to pro. Each level unlocks deeper insights and advanced strategies.</h3>
      <div className="learning-path-cards-container">
        <div className="learning-path-card beginner">
          <h4>Beginner Course</h4>
          <p>Start with the basics: stock market concepts, terminology, and how to make your first investment.</p>
          <button className="learning-path-start-btn" onClick={() => handleStart('beginner')}>Start</button>
        </div>
        <div className="learning-path-card intermediate">
          <h4>Intermediate Course</h4>
          <p>Level up: technical analysis, chart reading, and risk management for smarter trading.</p>
          <button className="learning-path-start-btn" onClick={() => handleStart('intermediate')}>Start</button>
        </div>
        <div className="learning-path-card advanced">
          <h4>Advanced Course</h4>
          <p>Master the market: advanced strategies, AI-driven insights, and portfolio optimization.</p>
          <button className="learning-path-start-btn" onClick={() => handleStart('advanced')}>Start</button>
        </div>
      </div>
      {showPopup && (
        <div className="course-popup-overlay">
          <div className="course-popup course-popup-large">
            <button className="course-popup-close" onClick={handleClose}>&times;</button>
            <div className="course-popup-content">
              <div className="course-popup-video-section">
                <h2 className="course-popup-title">
                  {selectedCourse === 'beginner' ? 'Beginner Course' : selectedCourse === 'intermediate' ? 'Intermediate Course' : 'Advanced Course'}
                </h2>
                {selectedCourse === 'beginner' ? (
                  <iframe
                    width="100%"
                    height="360"
                    src="https://www.youtube.com/embed/A-LmEw6fsTg"
                    title="Beginner Lesson 1"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <video className="course-popup-video" controls autoPlay poster="/feature_light.png">
                    <source src={`/${selectedCourse}-course.mp4`} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
              <div className="course-popup-sidebar">
                <h3>Course Progress</h3>
                <ul className="course-popup-chapters">
                  <li>Introduction</li>
                  <li>Key Concepts</li>
                  <li>Live Demo</li>
                  <li>Quiz & Practice</li>
                  <li>Summary</li>
                </ul>
                <div className="course-popup-actions">
                  <button className="course-popup-action-btn">Mark as Complete</button>
                  <button className="course-popup-action-btn">Download Notes</button>
                </div>
                <div className="course-popup-desc">
                  {selectedCourse === 'beginner' && <p>Welcome to the Beginner Course! Learn the basics of stock markets, investing, and more.</p>}
                  {selectedCourse === 'intermediate' && <p>Welcome to the Intermediate Course! Dive deeper into technical analysis and trading strategies.</p>}
                  {selectedCourse === 'advanced' && <p>Welcome to the Advanced Course! Master advanced strategies and portfolio management.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LearnYard;