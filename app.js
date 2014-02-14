
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , mongoose = require('mongoose')
  , backboneio = require('backbone.io');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

//mongoose
var Schema = mongoose.Schema;
var UserSchema = new Schema({
  title: String,
  message: String,
  date: Date
});
mongoose.model('User', UserSchema);
var uri = process.env.MONGOHQ_URL || 'mongodb://127.0.0.1/memo_app';
mongoose.connect(uri);
var User = mongoose.model('User');

// Backbone.io
var backend = backboneio.createBackend();
backend.use(function(req, res, next) {
  console.log(req.method);
  next();
});

// ミドルウェアを設定（mangodb）
backend.use(backboneio.middleware.mongooseStore(User));

var io = backboneio.listen(server, { mybackend: backend });
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});
