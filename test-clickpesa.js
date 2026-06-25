const axios = require('axios');

const API_KEY = 'SKPrJGIC1B1lyfngw7cgzIIJDXFCDXOpKbi6BKwH5m';
const CLIENT_ID = 'IDRyxV7piack8NxXwX7bi1RQLhjBQRnV';

const BASE_URL = 'https://api.clickpesa.com';
const TOKEN_ENDPOINT = '/third-parties/generate-token';

async function test() {
    try {
        console.log('🔑 Generating token...');
        console.log(`📤 URL: ${BASE_URL}${TOKEN_ENDPOINT}`);
        console.log(`📤 Headers: api-key=${API_KEY}, client-id=${CLIENT_ID}`);

        const response = await axios.post(
            `${BASE_URL}${TOKEN_ENDPOINT}`,
            {}, // Empty body
            {
                headers: {
                    'api-key': API_KEY,
                    'client-id': CLIENT_ID,
                },
            }
        );

        console.log('✅ Token generated successfully!');
        console.log('📦 Full Response:', JSON.stringify(response.data, null, 2));

        const token = response.data.token || response.data.access_token || response.data.authorizationToken;
        if (token) {
            console.log(`🔑 Token: ${token}`);
        } else {
            console.log('⚠️ No token field found – check the response structure.');
        }
    } catch (error) {
        console.error('❌ Error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

test();