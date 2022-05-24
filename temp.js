var http = require('http'); 
var url = require('url'); 
var fs = require('fs'); 
var { parse } = require('querystring'); 
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var cheerio = require('cheerio');
const Database = require("@replit/database");
const rdb = new Database();
var MongoClient = require('mongodb').MongoClient;
var uri = `mongodb+srv://replit:${process.env['mongo']}@statustracker.zp2rb.mongodb.net/statustracker?retryWrites=true&w=majority`;

/*rdb.getAll().then(dict => {
    console.log("Got all")
    fs.writeFileSync("temp.json", JSON.stringify(dict))
});*/

dict = JSON.parse(fs.readFileSync("temp.json"))
MongoClient.connect(uri, function(err, db) {
  if (err) throw err;
  var dbo = db.db("statustracker");
  
  let l = []
  for (const [timestamp, stringentry] of Object.entries(dict)) {
    console.log(timestamp, stringentry)
    var obj = {_id: timestamp, data: stringentry};
    l.push(obj)
  }
  dbo.collection("statustracker").insertMany(l, function(err, res) {
    if (err) throw err;
    console.log("inserted");
    db.close();
  });
});