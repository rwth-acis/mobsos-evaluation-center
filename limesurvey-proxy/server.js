/* eslint-disable @typescript-eslint/no-misused-promises */
const request = require('request');
const express = require('express');
const fs = require('fs');
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

app.get('/', async (req, res) => {
  const surveys = await service.getSurveyList(); // list of surveys
  const survey = surveys[0]; // first survey
  const questions = await service.getQuestions(survey.sid); // list of questions for first survey
  const responses = await service.getResponsesBySurveyId(survey.sid); // list of responses for first survey
  res.send(responses[0]); // send first response to first survey to client
});

app.listen(port, async () => {
  console.log(`Example app listening on port ${port}`);
  const surveys = await service.getSurveyList();
  console.log(
    `Service initialized, number of surveys: ${surveys.length}`,
  );
});
