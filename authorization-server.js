const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { randomString, containsAll, decodeAuthCredentials, timeout } = require('./utils');
const { url } = require('inspector');

const config = {
  port: 9001,
  privateKey: fs.readFileSync('assets/private_key.pem'),

  clientId: 'my-client',
  clientSecret: 'zETqHgl0d7ThysUqPnaFuLOmG1E=',
  redirectUri: 'http://localhost:9000/callback',

  authorizationEndpoint: 'http://localhost:9001/authorize',
};

const clients = {
  'my-client': {
    name: 'Sample Client',
    clientSecret: 'zETqHgl0d7ThysUqPnaFuLOmG1E=',
    scopes: ['permission:name', 'permission:date_of_birth'],
  },
  'test-client': {
    name: 'Test Client',
    clientSecret: 'TestSecret',
    scopes: ['permission:name'],
  },
};

const users = {
  user1: 'password1',
  john: 'appleseed',
};

const requests = {};
const authorizationCodes = {};

let state = '';

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'assets/authorization-server');
app.use(timeout);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
Your code here
*/

app.get('/authorize', (req, res) => {
  const { client_id } = req.query;

  const requestId = randomString();
  const client = clients[client_id];
  const scope = req.query.scope ? req.query.scope.split(' ') : [];

  if (client && containsAll(client.scopes, scope)) {
    requests[requestId] = req.query;

    res.render('login', { client, scope: req.query.scope, requestId });
    res.status(200);

    return;
  }

  res.sendStatus(401);
});

app.post('/approve', (req, res) => {
  const { userName, password, requestId } = req.body;

  if (users[userName] !== password) {
    return res.sendStatus(401);
  }

  if (!requests[requestId]) {
    return res.sendStatus(401);
  }

  const clientReq = requests[requestId];
  delete requests[requestId];

  const code = randomString();

  authorizationCodes[code] = { clientReq, userName };

  const redirectUrl = new URL(clientReq.redirect_uri);
  redirectUrl.searchParams.set('code', code);
  redirectUrl.searchParams.set('state', clientReq.state);

  res.redirect(302, redirectUrl.toString());
});

app.post('/token', (req, res) => {
  const { authorization } = req.headers;
  const { code } = req.body;

  if (!authorization) {
    return res.sendStatus(401);
  }

  const { clientId, clientSecret } = decodeAuthCredentials(authorization);

  if (!clients[clientId] || clients[clientId].clientSecret !== clientSecret) {
    return res.sendStatus(401);
  }

  if (!authorizationCodes[code]) {
    return res.sendStatus(401);
  }

  const obj = authorizationCodes[code];
  delete authorizationCodes[code];

  const privateKey = fs.readFileSync('./assets/private_key.pem');

  const jwtString = jwt.sign({ userName: obj.userName, scope: obj.clientReq.scope }, privateKey, {
    algorithm: 'RS256',
  });

  return res.json({ access_token: jwtString, token_type: 'Bearer' });
});

const server = app.listen(config.port, 'localhost', function () {
  var host = server.address().address;
  var port = server.address().port;
});

// for testing purposes

module.exports = { app, requests, authorizationCodes, server };
