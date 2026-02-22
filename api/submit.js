import { google } from 'googleapis';

const SPREADSHEET_ID = '1L5Wu9ZXEWVX8in3qodAXdj4bUlsF3hhmk62KFilrtb4';

const PROJECTS = [
  '00 Warm Up',
  '01 Instructional',
  '02 Informational',
  '03 Invitational',
];

async function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return res.status(500).json({ error: 'Google credentials not configured' });
  }

  const {
    project, student, reviewerType, date,
    overallGrade, overallScore,
    ideation, iteration, typography, communication, craft,
    ideationNotes, iterationNotes, typographyNotes, communicationNotes, craftNotes
  } = req.body;

  if (!student) return res.status(400).json({ error: 'Student name is required' });
  if (!project) return res.status(400).json({ error: 'Project is required' });
  if (!PROJECTS.includes(project)) return res.status(400).json({ error: 'Invalid project' });

  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Check if tab exists, create if not
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);

    if (!existingSheets.includes(project)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: project } } }]
        }
      });

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${project}'!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Date', 'Student', 'Reviewer Type',
            'Overall Grade', 'Overall Score',
            'Ideation', 'Iteration', 'Typography', 'Communication', 'Craft',
            'Ideation Notes', 'Iteration Notes', 'Typography Notes',
            'Communication Notes', 'Craft Notes'
          ]]
        }
      });
    }

    const row = [
      date || new Date().toISOString().split('T')[0],
      student,
      reviewerType || '',
      overallGrade || '',
      overallScore !== null && overallScore !== undefined ? overallScore : '',
      ideation !== null && ideation !== undefined ? ideation : '',
      iteration !== null && iteration !== undefined ? iteration : '',
      typography !== null && typography !== undefined ? typography : '',
      communication !== null && communication !== undefined ? communication : '',
      craft !== null && craft !== undefined ? craft : '',
      ideationNotes || '',
      iterationNotes || '',
      typographyNotes || '',
      communicationNotes || '',
      craftNotes || '',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${project}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] }
    });

    return res.status(200).json({
      success: true,
      url: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`
    });

  } catch (err) {
    console.error('Sheets error:', err);
    return res.status(500).json({ error: err.message });
  }
}
