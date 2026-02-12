import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.COLOSSEUM_API_KEY;
const API_BASE_URL = 'https://agents.colosseum.com/api';

async function submitProject() {
  if (!API_KEY) {
    console.error('❌ Error: COLOSSEUM_API_KEY not found in .env');
    process.exit(1);
  }

  try {
    console.log('📡 Submitting project for judging...');
    
    const response = await axios.post(`${API_BASE_URL}/my-project/submit`, {}, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Success! Project submitted for judging.');
      console.log('Status:', response.data.project.status);
    }
  } catch (error: any) {
    console.error('❌ Submission failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

submitProject();
