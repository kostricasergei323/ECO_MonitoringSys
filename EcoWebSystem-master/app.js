const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const config = require('config');
const router = require('./server/router');
const { Schedule } = require('./server/utils/scheduler');

const app = express();

const corsMiddleware = require('./server/middlewares/cors');

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(corsMiddleware);

app.use('/public', express.static(path.join(__dirname, 'server', 'public')));
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'build')));
}

app.use('/', router);

const PORT = process.env.PORT || config.get('port') || 3001;

app.listen(PORT, () => {
  console.log(`Eco app listening on port ${PORT}!`);
  const sch = new Schedule(
    +process.env.HOUR_RESET ? process.env.HOUR_RESET : 02,
    +process.env.MINUTE_RESET ? process.env.MINUTE_RESET : 30
  );
  sch.Start();
});
