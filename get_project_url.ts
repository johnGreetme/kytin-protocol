import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.COLOSSEUM_API_KEY;
const API_BASE_URL = 'https://agents.colosseum.com/api';

async function getProjectDetails() {
  if (!API_KEY) {
    console.error('❌ Error: COLOSSEUM_API_KEY not found in .env');
    process.exit(1);
  }

  try {
    console.log('📡 Fetching project details...');
    
    const response = await axios.get(`${API_BASE_URL}/my-project`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Success!');
    console.log('Project Name:', response.data.project.name);
    console.log('Project Slug:', response.data.project.slug);
    console.log('Project Status:', response.data.project.status);
    console.log('Project URL:', `https://colosseum.com/projects/${response.data.project.slug}`);
  } catch (error: any) {
    console.error('❌ Failed to fetch project details:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

getProjectDetails();
