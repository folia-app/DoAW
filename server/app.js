#!/usr/bin/env node

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')
require('dotenv').config()

var indexRouter = require('./index');

var app = express();
app.use(cors())

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// this disables serving everything from the dist directory
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'gifs')));

app.use('/', indexRouter);
// app.use('/get', getRouter);

/**
 * Anything not found falls back to the loading frame, with a 200.
 *
 * This is not new behaviour — it is the droplet's, moved into the app. There,
 * /server/* was served by nginx straight off the filesystem with
 *
 *     try_files /dist$uri /gifs$uri /dist/loading.png =404;
 *     error_page 404 =200 /dist/loading.png;
 *
 * so a token whose GIF had not been rendered yet showed the loading frame
 * rather than a broken image. Fly serves these paths from express instead, and
 * without this a fresh mint would 404 for the ~100 seconds its GIF takes to
 * render — and OpenSea would happily cache that.
 *
 * /v1/* is deliberately excluded: on the droplet the metadata routes were a
 * different nginx server block with no such fallback, and their 404 bodies are
 * part of what scripts/parity.js pins.
 */
app.use(function (req, res, next) {
  if (req.path.startsWith('/v1/')) return next(createError(404));
  return res.status(200).sendFile(path.join(__dirname, '..', 'dist', 'loading.png'));
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(''); // Return a blank error page
});

var debug = require('debug')('doaw:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3003');
console.log(`Listening on port ${port}`)
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
