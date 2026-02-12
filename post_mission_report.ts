import axios from 'axios';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const API_KEY = process.env.COLOSSEUM_API_KEY;
const API_BASE_URL = 'https://agents.colosseum.com/api';

async function postMissionReport() {
  if (!API_KEY) {
    console.error('❌ Error: COLOSSEUM_API_KEY not found in .env');
    process.exit(1);
  }

  const reportPath = path.join(process.cwd(), 'FINAL_REPORT.md');
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Error: FINAL_REPORT.md not found');
    process.exit(1);
  }

  const reportContent = fs.readFileSync(reportPath, 'utf8');
  
  // Extract Title from the first line or use a default
  const title = "MISSION REPORT: The Evolution of Kytin Protocol (Genesis)";
  const body = reportContent;

  try {
    console.log('📡 Broadcasting Mission Report to Colosseum forum...');
    
    const response = await axios.post(`${API_BASE_URL}/forum/posts`, {
      title,
      body,
      tags: ["infra", "security", "ai"]
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Success! Mission Report posted.');
      console.log('Post ID:', response.data.post.id);
      console.log('URL: https://colosseum.com/forum/posts/' + response.data.post.id);
    }
  } catch (error: any) {
    console.error('❌ Posting failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

postMissionReport();
