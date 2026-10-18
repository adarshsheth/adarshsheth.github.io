/* ─────────────────────────────────────────────
   Cloud Function: Notion blog preview for dashboard
   Returns ALL posts (including unpublished) for authorized user only.
   The NOTION_API_KEY lives here, never in browser JS.
   ───────────────────────────────────────────── */

const functions = require('firebase-functions');
const { Client } = require('@notionhq/client');
const admin = require('firebase-admin');

admin.initializeApp();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Your Notion database ID
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Your authorized email
const AUTHORIZED_EMAIL = process.env.AUTHORIZED_EMAIL;

exports.getAllPosts = functions.https.onCall(async (data, context) => {
  // Verify the user is logged in
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in to preview drafts.'
    );
  }
  
  // Verify it's YOUR account
  if (context.auth.token.email !== AUTHORIZED_EMAIL) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Not authorized.'
    );
  }
  
  try {
    // Query ALL posts (no Published filter)
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [{ property: 'Published Date', direction: 'descending' }],
    });
    
    // Format posts (same as build.js but include unpublished)
    const posts = response.results.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        title: props.Title?.title?.[0]?.plain_text || 'Untitled',
        published: props.Published?.checkbox || false,
        // ... add other fields as needed (match build.js format)
      };
    });
    
    return { posts };
  } catch (err) {
    console.error('Notion query failed:', err);
    throw new functions.https.HttpsError('internal', 'Failed to fetch posts.');
  }
});
