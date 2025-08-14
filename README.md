# DriveAPIAccessToken

A lightweight Appwrite Cloud Function that **refreshes a Google Drive API access token** using a stored refresh token, then **updates it in an Appwrite database** for other services to consume.

This is useful for long-running integrations with Google Drive where you need an updated `access_token` without manual re-authentication.

---

## 📌 Features

- Uses **Google OAuth2 Refresh Token** to get a new access token.
- Updates the **Appwrite Database** with:

  - `access_token`
  - `expires_at`
  - `scope`
  - `token_type`
  - `last_updated`

- Designed for **Appwrite Functions** runtime.
- Automatically logs errors and process flow.

---

## ⚙️ How It Works

1. **Function Trigger**
   This function can be triggered on a **schedule** (e.g., every 50 minutes) or manually via HTTP.

2. **Refresh Access Token**
   Calls `https://oauth2.googleapis.com/token` with:

   - `client_id`
   - `client_secret`
   - `refresh_token`
   - `grant_type=refresh_token`

3. **Update Appwrite Database**
   Stores the new token in the specified **collection/document** for your application to use.

---

## 📂 Project Structure

```
DriveAPIAccessToken/
│── main.js        # Core Appwrite Function logic
│── README.md      # Documentation
```

---

## 🔑 Environment Variables

The function expects the following environment variables to be set in your **Appwrite Function settings**:

| Variable Name                        | Description                                 |
| ------------------------------------ | ------------------------------------------- |
| `APPWRITE_ENDPOINT`                  | Appwrite endpoint URL                       |
| `APPWRITE_PROJECT_ID`                | Your Appwrite project ID                    |
| `APPWRITE_API_KEY`                   | API key with **database write permissions** |
| `DATABASE_ID`                        | The database where the token is stored      |
| `GOOGLE_CLIENT_ID`                   | Google Cloud OAuth2 Client ID               |
| `GOOGLE_CLIENT_SECRET`               | Google Cloud OAuth2 Client Secret           |
| `GOOGLE_REFRESH_TOKEN_COLLECTION_ID` | Collection ID where token is stored         |
| `GOOGLE_DRIVE_TOKEN_DOC_ID`          | Document ID for storing token               |
| `GOOGLE_REFRESH_TOKEN`               | Google OAuth2 refresh token                 |

---

## 🚀 Deployment Steps

1. **Create Appwrite Database & Document**

   - Create a database and collection for storing tokens.
   - Add fields:

     - `access_token` (string)
     - `expires_at` (string or timestamp)
     - `scope` (string)
     - `token_type` (string)
     - `last_updated` (datetime)

2. **Create an Appwrite Function**

   - Runtime: **Node.js 18+**
   - Upload `main.js`.
   - Set the **environment variables** listed above.

3. **Test the Function**
   Trigger manually or set a schedule:

   ```cron
   */50 * * * *
   ```

   This refreshes the token every 50 minutes.

---

## 🛠 Usage

Once the function runs successfully, any service in your Appwrite project can query the stored document to get a fresh Google Drive `access_token` for API calls.

Example (Node.js):

```javascript
import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function getAccessToken() {
  const doc = await databases.getDocument(
    process.env.DATABASE_ID,
    process.env.GOOGLE_REFRESH_TOKEN_COLLECTION_ID,
    process.env.GOOGLE_DRIVE_TOKEN_DOC_ID
  );
  return doc.access_token;
}
```

---

## 📜 License

MIT License — feel free to use and modify.

---

## 💡 Notes

- Google refresh tokens typically **do not expire** unless revoked.
- Ensure your Google Cloud project has **Drive API enabled**.
- The refresh token must be obtained via OAuth2 with `access_type=offline` and `prompt=consent`.
