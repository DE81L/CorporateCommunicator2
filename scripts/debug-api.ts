import fetch, { Headers } from 'node-fetch';

async function debugApiUser() {
  try {
    const response = await fetch('http://localhost:5173/api/user', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Response Status:', response.status);

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    console.log('Response Headers:', headers);

    const body = await response.text();
    console.log('Response Body:', body);
  } catch (error) {
    console.error('Fetch Error:', error.message);
  }
}

debugApiUser();