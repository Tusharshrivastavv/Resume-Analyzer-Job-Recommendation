const express = require('express');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const app = express();
const port = 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.post('/upload', upload.single('resume'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const resumePath = path.join(__dirname, req.file.path);

    const pythonProcess = spawn('python', ['parse_resume.py', resumePath]);
    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    pythonProcess.on('close', async (code) => {
        if (code === 0) {
            try {
                const parsedData = JSON.parse(outputData);
                const { ats_score, matched_skills, missing_skills, extracted_skills } = parsedData;

                const jobRecommendations = await getJobRecommendations(matched_skills);

                res.render('result', {
                    atsScore: ats_score,
                    matchedSkills: matched_skills,
                    missingSkills: missing_skills,
                    extractedSkills: extracted_skills,
                    jobRecommendations
                });
            } catch (err) {
                console.error('Error processing parsed data:', err);
                res.status(500).send('Error processing the resume.');
            }
        } else {
            console.error('Error parsing resume:', errorData || 'Unknown error occurred.');
            res.status(500).send(`Error parsing resume: ${errorData || 'Unknown error occurred.'}`);
        }
    });
});

async function getJobRecommendations(matchedSkills) {
    try {
        const skillsQuery = matchedSkills.join(', ');
        const response = await axios.get(`https://www.linkedin.com/developers/tools/oauth`, {
            params: { skills: skillsQuery }
        });
        return response.data.jobs || [];
    } catch (error) {
        console.error('Error on fetching job recommendations:', error);
        return [];
    }
}

app.use((err, req, res, next) => {
    res.status(500).send('Something going wrong');
});

app.listen(port, () => {
    console.log(`Server is running `);
});
