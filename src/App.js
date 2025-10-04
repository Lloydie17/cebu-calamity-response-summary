import React, { useState, useEffect } from 'react';
import EmergencySummary from './components/EmergencySummary/EmergencySummary';
import { fetchEmergencies } from './services/api';
import './App.css';

function App() {
  const [emergencies, setEmergencies] = useState([]);

  useEffect(() => {
    const getEmergencies = async () => {
      const response = await fetchEmergencies();
      if (response.success) {
        setEmergencies(response.data);
      }
    };

    getEmergencies();
  }, []);

  return (
    <div className="App">
      <EmergencySummary data={emergencies} />
    </div>
  );
}

export default App;