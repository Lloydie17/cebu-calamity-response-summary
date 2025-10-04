import React, { useState, useEffect } from 'react';
import EmergencySummary from './components/EmergencySummary/EmergencySummary';
import { fetchEmergencies } from './services/api';
import './App.css';

function App() {
  const [emergencies, setEmergencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getEmergencies = async () => {
      try {
        setIsLoading(true);
        const response = await fetchEmergencies();
        if (response.success) {
          setEmergencies(response.data);
        }
      } catch (error) {
        console.error('Error fetching emergencies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getEmergencies();
  }, []);

  return (
    <div className="App">
      <EmergencySummary data={emergencies} isLoading={isLoading} />
    </div>
  );
}

export default App;