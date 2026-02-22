const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASE_ID = '447f904b502d4e908a32504c5030565a';

export default async function handler(req, res) {
  // Allow requests from any origin (needed for browser form submissions)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!NOTION_API_KEY) {
    return res.status(500).json({ error: 'Notion API key not configured' });
  }

  const {
    student, reviewer, assignment, checkpoint, date,
    overallGrade, overallScore,
    ideation, iteration, typography, communication, craft,
    ideationNotes, iterationNotes, typographyNotes, communicationNotes, craftNotes
  } = req.body;

  if (!student) {
    return res.status(400).json({ error: 'Student name is required' });
  }

  // Build Notion page properties
  const properties = {
    Student: {
      title: [{ text: { content: student } }]
    }
  };

  if (reviewer)   properties.Reviewer   = { rich_text: [{ text: { content: reviewer } }] };
  if (assignment) properties.Assignment = { rich_text: [{ text: { content: assignment } }] };
  if (checkpoint) properties.Checkpoint = { rich_text: [{ text: { content: checkpoint } }] };
  if (date)       properties.Date       = { date: { start: date } };

  if (overallGrade) properties['Overall Grade'] = { select: { name: overallGrade } };
  if (overallScore !== null && overallScore !== undefined)
    properties['Overall Score'] = { number: overallScore };

  if (ideation     !== null) properties.Ideation     = { number: ideation };
  if (iteration    !== null) properties.Iteration    = { number: iteration };
  if (typography   !== null) properties.Typography   = { number: typography };
  if (communication !== null) properties.Communication = { number: communication };
  if (craft        !== null) properties.Craft        = { number: craft };

  if (ideationNotes)       properties['Ideation Notes']       = { rich_text: [{ text: { content: ideationNotes } }] };
  if (iterationNotes)      properties['Iteration Notes']      = { rich_text: [{ text: { content: iterationNotes } }] };
  if (typographyNotes)     properties['Typography Notes']     = { rich_text: [{ text: { content: typographyNotes } }] };
  if (communicationNotes)  properties['Communication Notes']  = { rich_text: [{ text: { content: communicationNotes } }] };
  if (craftNotes)          properties['Craft Notes']          = { rich_text: [{ text: { content: craftNotes } }] };

  try {
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties
      })
    });

    const data = await notionRes.json();

    if (!notionRes.ok) {
      console.error('Notion error:', data);
      return res.status(500).json({ error: data.message || 'Notion API error' });
    }

    return res.status(200).json({ success: true, url: data.url });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
}
