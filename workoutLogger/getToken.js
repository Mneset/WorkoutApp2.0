var request = require("request");

var options = { method: 'POST',
  url: 'https://dev-n8xnfzfw0w26p6nq.us.auth0.com/oauth/token',
  headers: { 'content-type': 'application/json' },
  body: '{"client_id":"i7U6tBXlmjGH6itjgrkhNGRnfu2X8aZK","client_secret":"2GBk2dYaLTtXHMQ1xoLLC2kYJEcOsiHJfneBxqGrCWmbPz6biZiXHJplA6iLQ2QO","audience":"https://localhost:3000/api/v1","grant_type":"client_credentials"}' };

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});