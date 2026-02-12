import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.COLOSSEUM_API_KEY;
const API_BASE_URL = 'https://agents.colosseum.com/api';

async function checkStatus() {
  if (!API_KEY) {
    console.error('❌ Error: COLOSSEUM_API_KEY not found in .env');
    process.exit(1);
  }

  try {
    console.log('📡 Fetching agent status...');
    
    const response = await axios.get(`${API_BASE_URL}/agents/status`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success!');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('❌ Status fetch failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

checkStatus();
