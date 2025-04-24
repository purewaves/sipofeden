import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const UltraBasicDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [notificationEnabled, setNotificationEnabled] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin");
    }
    
    // Check notification permission
    if ('Notification' in window) {
      setNotificationEnabled(Notification.permission === 'granted');
    }
  }, [isAuthenticated, navigate]);

  const requestNotification = () => {
    if (!('Notification' in window)) {
      alert("This browser does not support notifications");
      return;
    }
    
    if (Notification.permission === 'granted') {
      new Notification("Test Notification", {
        body: "Your notification system is working!"
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setNotificationEnabled(true);
          new Notification("Test Notification", {
            body: "Your notification system is working!"
          });
        }
      });
    }
  };

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Admin Dashboard</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={requestNotification}
          style={{
            backgroundColor: '#f97316',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            width: '100%',
            marginBottom: '16px'
          }}
        >
          {notificationEnabled ? 'Send Test Notification' : 'Enable Notifications'}
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '4px' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Orders</div>
          <div style={{ fontWeight: 'bold' }}>0</div>
        </div>
        <div style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '4px' }}>
          <div style={{ fontSize: '14px', color: '#666' }}>Products</div>
          <div style={{ fontWeight: 'bold' }}>7</div>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Navigation</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => navigate('/admin/products')}
            style={{
              backgroundColor: '#f1f5f9',
              border: 'none',
              padding: '10px',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            Manage Products
          </button>
          <button
            onClick={() => navigate('/admin/orders')}
            style={{
              backgroundColor: '#f1f5f9',
              border: 'none',
              padding: '10px',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            Manage Orders
          </button>
          <button
            onClick={() => navigate('/admin/profile')}
            style={{
              backgroundColor: '#f1f5f9',
              border: 'none',
              padding: '10px',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            Profile Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default UltraBasicDashboard;