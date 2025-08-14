import { Client, Databases } from 'node-appwrite';
import fetch from 'node-fetch';

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  DATABASE_ID,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN_COLLECTION_ID,
  GOOGLE_DRIVE_TOKEN_DOC_ID,
  GOOGLE_REFRESH_TOKEN,
} = process.env;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

async function refreshAccessToken(log) {
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const params = new URLSearchParams();
  params.append('client_id', GOOGLE_CLIENT_ID);
  params.append('client_secret', GOOGLE_CLIENT_SECRET);
  params.append('refresh_token', GOOGLE_REFRESH_TOKEN);
  params.append('grant_type', 'refresh_token');

  const res = await fetch(tokenUrl, { method: 'POST', body: params });

  // Read body only once
  const data = await res.json();
  log('Data = ', data);
  if (!res.ok) {
    throw new Error(
      `Failed to refresh token: ${res.status} ${res.statusText} - ${JSON.stringify(data)}`
    );
  }

  return data; // { access_token, expires_in, scope, token_type }
}

async function updateTokenInDB(tokenData, log) {
const expiresAt = (Date.now() + tokenData.expires_in * 1000).toString();

  log('Token Data passed to DB = ', tokenData);
  await databases.updateDocument(
    DATABASE_ID,
    GOOGLE_REFRESH_TOKEN_COLLECTION_ID,
    GOOGLE_DRIVE_TOKEN_DOC_ID,
    {
      access_token: tokenData.access_token,
      expires_at: expiresAt,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      last_updated: new Date().toISOString(),
    }
  );
}

// Export a function that Appwrite can execute
export default async function ({ req, res, log, error }) {
  try {
    const tokenData = await refreshAccessToken(log);
    await updateTokenInDB(tokenData, log);
    log('Google Drive access token refreshed and updated in DB');
    return { success: true };
  } catch (err) {
    error('Error refreshing Google Drive token:', err);
    return { success: false, error: String(error) };
  }
}
