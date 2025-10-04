import axios from 'axios';

const baseUrl = 'https://calamity-response-app.onrender.com/api/emergencies';

export const fetchEmergencies = async () => {
    try {
        const response = await axios.get(baseUrl);
        return response.data;
    } catch (error) {
        console.error('Error fetching emergencies:', error);
        throw error;
    }
};