const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { timeout } = require('./utils');

const config = {
  port: 9002,
  publicKey: fs.readFileSync('assets/public_key.pem'),
};

const users = {
  user1: {
    username: 'user1',
    name: 'User 1',
    date_of_birth: '7th October 1990',
    weight: 57,
  },
  john: {
    username: 'john',
    name: 'John Appleseed',
    date_of_birth: '12th September 1998',
    weight: 87,
  },
};

const app = express();
app.use(timeout);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
Your code here
*/

app.get('/user-info', (req, res) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.sendStatus(401);
  }

  const token = authorization.slice('bearer '.length);

  try {
    const publicKey = fs.readFileSync('./assets/public_key.pem');

    const { userName, scope: scopeStrings } = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

    const scopes = scopeStrings.split(' ').reduce((acc, cur) => {
      const scope = cur.slice('permissions:'.length - 1);

      return { ...acc, [scope]: users[userName][scope] };
    }, {});

    return res.json({ ...scopes });
  } catch (e) {
    return res.sendStatus(401);
  }
});

const server = app.listen(config.port, 'localhost', function () {
  var host = server.address().address;
  var port = server.address().port;
});

// for testing purposes
module.exports = {
  app,
  server,
};
