
/// include express ///
const express  = require('express');
const path     = require('path')
const session  = require('express-session')

/// create connection to database ///
const mysql = require('mysql')
const db = mysql.createConnection({
    host: "127.0.0.1",
    user: "Manager",
    password: "22122001",
    database: "Hospital"
  });

db.connect(function(err) {
    if (err) console.log(err);
    console.log("Connected!");
});
  
/// create app and listen server ///
const app    = express()
const server = require("http").createServer(app);
const port   = process.env.PORT || 3000;

/// app config ///
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
  secret: 'session', 
  resave: false, 
  saveUninitialized: true,
  cookie: {
      maxAge: 3600 * 24 * 1000
  }
}))

/// handle request ///
const controller = require('./controller')
controller(app, db)

/// listen ///
server.listen(port)
