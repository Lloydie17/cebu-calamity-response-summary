import React, { useState } from 'react';

const EmergencySummary = ({ data, isLoading = true }) => {
  const [expandedMunicipality, setExpandedMunicipality] = useState(null);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Fetching emergency reports...</p>
      </div>
    );
  }

  // Validation for data prop
  if (!Array.isArray(data)) {
    return <div className="error-message">No emergency data available</div>;
  }

  if (data.length === 0) {
    return <div className="empty-message">Fetching emergency reports...</div>;
  }

  const cleanLocationName = (name) => {
    return (name || '').toLowerCase().trim();
  };

  const groupedData = data.reduce((acc, emergency) => {
    // Validate emergency data
    if (!emergency?.placename) {
      console.warn('Emergency entry missing placename:', emergency);
      return acc;
    }

    const parts = emergency.placename.split(',').map(cleanLocationName);
    
    // Ensure we have enough parts in the address
    if (parts.length < 3) {
      console.warn('Invalid placename format:', emergency.placename);
      return acc;
    }

    const [brgy, mun, province] = parts;
    
    // Only process if it's in Cebu
    if (!province || !province.includes('cebu')) {
      return acc;
    }

    const municipality = mun;
    const barangay = brgy;
    
    // Initialize municipality if it doesn't exist
    if (!acc[municipality]) {
      acc[municipality] = {
        totalPeople: 0,
        needs: new Set(),
        pending: 0,
        resolved: 0,
        barangays: {},
        latestUpdate: new Date(0)
      };
    }
    
    // Initialize barangay if it doesn't exist
    if (!acc[municipality].barangays[barangay]) {
      acc[municipality].barangays[barangay] = {
        totalPeople: 0,
        needs: new Set(),
        pending: 0,
        resolved: 0,
        emergencies: [],
        location: {
          lat: emergency.latitude || 0,
          lng: emergency.longitude || 0
        },
        latestUpdate: new Date(0)
      };
    }

    try {
      // Update timestamps
      const emergencyDate = new Date(emergency.timestamp || Date.now());
      acc[municipality].latestUpdate = new Date(Math.max(
        acc[municipality].latestUpdate,
        emergencyDate
      ));
      acc[municipality].barangays[barangay].latestUpdate = new Date(Math.max(
        acc[municipality].barangays[barangay].latestUpdate,
        emergencyDate
      ));
      
      // Update municipality totals
      acc[municipality].totalPeople += emergency.numberOfPeople || 0;
      (emergency.needs || []).forEach(need => acc[municipality].needs.add(need));
      acc[municipality][emergency.status === 'pending' ? 'pending' : 'resolved']++;
      
      // Update barangay totals
      acc[municipality].barangays[barangay].totalPeople += emergency.numberOfPeople || 0;
      (emergency.needs || []).forEach(need => acc[municipality].barangays[barangay].needs.add(need));
      acc[municipality].barangays[barangay][emergency.status === 'pending' ? 'pending' : 'resolved']++;
      acc[municipality].barangays[barangay].emergencies.push(emergency);
    } catch (error) {
      console.error('Error processing emergency data:', error);
    }
    
    return acc;
  }, {});

  const getStatusColor = (pending, total) => {
    if (total === 0) return '#6c757d'; 
    const percentage = (pending / total) * 100;
    if (percentage > 70) return '#dc3545'; 
    if (percentage > 30) return '#ffc107';
    return '#28a745'; // Green
  };

  const openInGoogleMaps = (lat, lng, placename) => {
    if (!lat || !lng) {
      alert('Location coordinates not available');
      return;
    }

    // Get user's current position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const origin = `${position.coords.latitude},${position.coords.longitude}`;
          const destination = `${lat},${lng}`;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&destination_place_id=${encodeURIComponent(placename)}&travelmode=driving`;
          window.open(url, '_blank');
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fallback to just showing the destination if location access is denied
          const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(placename)}&travelmode=driving`;
          window.open(url, '_blank');
        }
      );
    } else {
      // Fallback for browsers that don't support geolocation
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(placename)}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  const formatDate = (date) => {
    try {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Sort municipalities by total affected people
  const sortedMunicipalities = Object.entries(groupedData)
    .sort(([, a], [, b]) => b.totalPeople - a.totalPeople);

  return (
    <div className="emergency-summary">
      <h2>Emergency Summary by Municipality</h2>
      {sortedMunicipalities.length === 0 ? (
        <div className="empty-message">No data available for Cebu region</div>
      ) : (
        <div className="municipality-list">
          {sortedMunicipalities.map(([municipality, data]) => (
            <div key={municipality} className="municipality-item">
              <div 
                className="municipality-header"
                onClick={() => setExpandedMunicipality(
                  expandedMunicipality === municipality ? null : municipality
                )}
              >
                <div className="header-main">
                  <h3>{municipality}</h3>
                  <span className="expand-icon">
                    {expandedMunicipality === municipality ? '−' : '+'}
                  </span>
                </div>
                <div className="municipality-summary">
                  <div className="stat-box">
                    <span className="stat-value">{data.totalPeople.toLocaleString()}</span>
                    <span className="stat-label">Affected</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Last Updated:</span>
                    <span className="stat-value">
                      {formatDate(data.latestUpdate)}
                    </span>
                  </div>
                  <div className="stat-box">
                    <div className="status-bars">
                      <div className="status-bar">
                        <div 
                          className="status-fill" 
                          style={{ 
                            width: `${(data.pending / (data.pending + data.resolved || 1)) * 100}%`,
                            backgroundColor: getStatusColor(data.pending, data.pending + data.resolved)
                          }}
                        />
                      </div>
                      <span className="status-text">
                        {data.pending} Pending / {data.resolved} Resolved
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {expandedMunicipality === municipality && (
                <div className="barangays-grid">
                  {Object.entries(data.barangays)
                    .sort(([, a], [, b]) => b.totalPeople - a.totalPeople)
                    .map(([barangay, brgyData]) => (
                      <div key={barangay} className="barangay-card">
                        <h4>{barangay}</h4>
                        <div className="brgy-stats">
                          <p>
                            <span className="stat-label">Location:</span>
                            <span 
                                className="stat-value location clickable"
                                onClick={() => openInGoogleMaps(
                                brgyData.location.lat, 
                                brgyData.location.lng,
                                `${barangay}, ${municipality}`
                                )}
                                title="Click to get directions in Google Maps"
                            >
                                {brgyData.location.lat.toFixed(4)}°N, {brgyData.location.lng.toFixed(4)}°E
                            </span>
                          </p>
                          <p>
                            <span className="stat-label">Affected:</span>
                            <span className="stat-value">{brgyData.totalPeople.toLocaleString()}</span>
                          </p>
                          <p>
                            <span className="stat-label">Needs:</span>
                            <span className="stat-value needs-list">
                              {Array.from(brgyData.needs).map(need => (
                                <span key={need} className="need-tag">{need}</span>
                              ))}
                            </span>
                          </p>
                          <p>
                            <span className="stat-label">Last Updated:</span>
                            <span className="stat-value">
                              {formatDate(brgyData.latestUpdate)}
                            </span>
                          </p>
                          <p>
                            <span className="stat-label">Status:</span>
                            <span className="status-text">
                              {brgyData.pending} Pending / {brgyData.resolved} Resolved
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmergencySummary;