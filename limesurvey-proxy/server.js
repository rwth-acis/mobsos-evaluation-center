/* eslint-env es6 */
/* eslint-disable no-console */
const express = require('express');
const cors = require('cors');
const limesurvey = require('node-limesurvey');
require('dotenv').config();

//  ******GLOBAL***************

const app = express();
const service = limesurvey({
  url: process.env.LIMESURVEY_HOST + '/index.php/admin/remotecontrol',
  username: process.env.LIMESURVEY_USERNAME,
  password: process.env.LIMESURVEY_PASSWORD,
});
const port = 3000;
app.use(
  cors({
    origin: 'http://localhost:4200',
  }),
);
/**
 * Returns list of surveys, format:
 * {
      "sid":string,
      "surveyls_title":string,
      "startdate":ISO string (e.g. 2021-03-10 14:10:27),
      "expires":ISO string (e.g. 2021-03-10 14:10:27)",
      "active":"Y" | "N"
   }[]
 */
app.get('/surveys', async (req, res) => {
  const surveys = await service.getSurveyList(); // list of surveys
  res.send(surveys); // send first response to first survey to client
});

app.get('/local/surveys', async (req, res) => {
  const surveys = await service.getSurveyList(); // list of surveys
  console.log(surveys);
  res.send(surveys); // send first response to first survey to client
});

/**
 * Returns the responses for a given survey,
 * @requires req.query.sid the survey for which to get the responses
 * format: 
 * 
  {
    "question": string,
    "title": string,
    "type": "L" | "5" |"S" | "T",
    "responses": {[response:string]:number} (e.g. { "Male": 23, "Female": 1 })
  }[]
 */
app.get('/responses', async (req, res) => {
  if (!req.query.sid) {
    res.status(400).send({ error: 'No survey id provided' });
  }
  const responses = await getSurveyResponses(req.query.sid);
  res.send(responses);
});

app.get('/local/responses', async (req, res) => {
  if (!req.query.sid) {
    res.status(400).send({ error: 'No survey id provided' });
  }
  const responses = await getSurveyResponses(req.query.sid);
  res.send(responses);
});

app.listen(port, async () => {
  console.log(`Example app listening on port ${port}`);
  const surveys = await service.getSurveyList();
  console.log(
    `Service initialized, number of surveys: ${surveys.length}`,
  );
});

async function getSurveyResponses(sid) {
  const questionsFromLimeSurvey = await service.getQuestions(sid); // list of questions for first survey
  const responsesFromLimeSurvey =
    await service.getResponsesBySurveyId(sid); // list of responses for first survey
  const responseList = responsesFromLimeSurvey.map((response) => {
    let actualResponse = Object.values(response)[0];
    delete actualResponse.id;
    delete actualResponse.submitdate;
    delete actualResponse.lastpage;
    delete actualResponse.seed;
    delete actualResponse.q;
    return actualResponse; // remove unnecessary fields so that only the responses to the questions remain
  });
  const responsesToQuestions = questionsFromLimeSurvey.map(
    (question) => {
      const groupedResponses = {}; // counts how many times each response appears
      for (const response of responseList) {
        const key = Object.keys(response).find(
          (key) => key === question.title,
        );
        if (key) {
          const statement = response[key]; // response to question
          if (statement in groupedResponses) {
            groupedResponses[statement]++;
          } else {
            groupedResponses[statement] = 1;
          }
        }
      }
      return {
        question: question.question,
        // id: question.qid,
        title: question.title,
        type: question.type,
        responses: groupedResponses,
      };
    },
  );
  return responsesToQuestions;
}
