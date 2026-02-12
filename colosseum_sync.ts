import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const API_KEY = process.env.COLOSSEUM_API_KEY;
const API_BASE_URL = 'https://agents.colosseum.com/api';

async function syncProject() {
  if (!API_KEY) {
    console.error('❌ Error: COLOSSEUM_API_KEY not found in .env');
    process.exit(1);
  }

  const submissionData = JSON.parse(fs.readFileSync('./submission.json', 'utf8'));

  try {
    console.log(`📡 Syncing project "${submissionData.name}" to Colosseum...`);
    
    let response;
    try {
      response = await axios.put(`${API_BASE_URL}/my-project`, submissionData, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (putError: any) {
      if (putError.response && putError.response.status === 404) {
        console.log('ℹ️ Project not found. Attempting to create (POST)...');
        response = await axios.post(`${API_BASE_URL}/my-project`, submissionData, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        throw putError;
      }
    }

    if (response && (response.status === 200 || response.status === 201)) {
      console.log('✅ Success! Project metadata synced successfully.');
      console.log('Project Status:', response.data.project.status);
      console.log('Project Slug:', response.data.project.slug);
    } 
  } catch (error: any) {
    console.error('❌ Sync failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

syncProject();
