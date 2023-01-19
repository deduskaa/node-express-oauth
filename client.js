const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios').default;
const { randomString, timeout } = require('./utils');

const config = {
  port: 9000,

  clientId: 'my-client',
  clientSecret: 'zETqHgl0d7ThysUqPnaFuLOmG1E=',
  redirectUri: 'http://localhost:9000/callback',

  authorizationEndpoint: 'http://localhost:9001/authorize',
  tokenEndpoint: 'http://localhost:9001/token',
  userInfoEndpoint: 'http://localhost:9002/user-info',
};
let state = '';

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'assets/client');
app.use(timeout);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
Your code here
*/

app.get('/authorize', (req, res) => {
  state = randomString();
  const redirectUrl = new URL(config.authorizationEndpoint);
  redirectUrl.searchParams.set('response_type', 'code');
  redirectUrl.searchParams.set('client_id', config.clientId);
  redirectUrl.searchParams.set('redirect_uri', config.redirectUri);
  redirectUrl.searchParams.set('scope', 'permission:name permission:date_of_birth');
  redirectUrl.searchParams.set('state', state);
  res.redirect(redirectUrl.toString());
});

app.get('/callback', async (req, res) => {
  if (state !== req.query.state) {
    return res.sendStatus(403);
  }

  const response = await axios({
    method: 'POST',
    url: config.tokenEndpoint,
    auth: { username: config.clientId, password: config.clientSecret },
    data: { code: req.query.code },
  });

  const userResponse = await axios({
    method: 'GET',
    url: config.userInfoEndpoint,
    headers: { Authorization: `bearer ${response.data.access_token}` },
  });

  res.render('welcome', { user: userResponse.data });
});

const server = app.listen(config.port, 'localhost', function () {
  var host = server.address().address;
  var port = server.address().port;
});

// for testing purposes

module.exports = {
  app,
  server,
  getState() {
    return state;
  },
  setState(s) {
    state = s;
  },
};
