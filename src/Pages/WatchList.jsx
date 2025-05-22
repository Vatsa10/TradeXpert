import React, { useState } from "react";
import { useTheme } from '../context/ThemeContext';
import "../styles/WatchList.css";

function WatchList() {
  const { theme } = useTheme();
  const [watchlist, setWatchlist] = useState([
    { id: 1, symbol: "AAPL", name: "Apple Inc.", price: 150.25, change: 2.5 },
    { id: 2, symbol: "GOOGL", name: "Alphabet Inc.", price: 2750.80, change: -1.2 },
    { id: 3, symbol: "MSFT", name: "Microsoft Corp.", price: 285.30, change: 1.8 },
  ]);

  const [alerts, setAlerts] = useState([
    { id: 1, symbol: "AAPL", targetPrice: 160, type: "above", status: "active" },
    { id: 2, symbol: "GOOGL", targetPrice: 2800, type: "below", status: "active" },
  ]);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  const handleSetAlert = (stock) => {
    setSelectedStock(stock);
    setShowAlertModal(true);
  };

  const handleRemoveFromWatchlist = (id) => {
    setWatchlist(watchlist.filter(stock => stock.id !== id));
  };

  return (
    <div className={`watchlist ${theme}`}>
      <div className="section-container">
        <div className="section-header">
          <div className="section-title">
            <i className="fas fa-star"></i>
            <span>Watchlist</span>
          </div>
          <button className="add-button">
            <i className="fas fa-plus"></i>
            Add to Watchlist
          </button>
        </div>
        
        <div className="scroll-container">
          <div className="stock-grid">
            {watchlist.map((stock) => (
              <div key={stock.id} className="stock-card">
                <div className="stock-info">
                  <h3>{stock.symbol}</h3>
                  <p>{stock.name}</p>
                  <h4>${stock.price.toFixed(2)}</h4>
                  <span className={stock.change >= 0 ? 'positive-change' : 'negative-change'}>
                    {stock.change > 0 ? '+' : ''}{stock.change}%
                  </span>
                </div>
                <div className="stock-actions">
                  <button 
                    className="add-button"
                    onClick={() => handleSetAlert(stock)}
                  >
                    <i className="fas fa-bell"></i>
                    Set Alert
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleRemoveFromWatchlist(stock.id)}
                  >
                    <i className="fas fa-trash"></i>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-container">
        <div className="section-header">
          <div className="section-title">
            <i className="fas fa-bell"></i>
            <span>Price Alerts</span>
          </div>
          <button className="add-button">
            <i className="fas fa-plus"></i>
            Create Alert
          </button>
        </div>

        <div className="scroll-container">
          <div className="alerts-grid">
            {alerts.map((alert) => (
              <div key={alert.id} className="alert-card">
                <div className="alert-info">
                  <h4>{alert.symbol}</h4>
                  <span className="alert-status">{alert.status}</span>
                </div>
                <p>Target: ${alert.targetPrice}</p>
                <p>Trigger when price goes {alert.type}</p>
                <button 
                  className="delete-alert-btn"
                  onClick={() => {/* Handle alert deletion */}}
                >
                  <i className="fas fa-trash-alt"></i>
                  Delete Alert
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAlertModal && (
        <AlertModal 
          stock={selectedStock}
          onClose={() => setShowAlertModal(false)}
        />
      )}
    </div>
  );
}

function AlertModal({ stock, onClose }) {
  const [alertPrice, setAlertPrice] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle alert creation logic here
    onClose();
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="alert-modal">
        <h2>Set Price Alert for {stock.symbol}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Alert Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              className="form-control"
              required
            />
          </div>
          <div className="mt-3">
            <button type="submit" className="btn btn-primary">
              Set Alert
            </button>
            <button 
              type="button" 
              className="btn btn-secondary ml-2"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default WatchList;
