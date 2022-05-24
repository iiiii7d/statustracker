var http = require('http'); 
var url = require('url'); 
var fs = require('fs'); 
var { parse } = require('querystring'); 
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var cheerio = require('cheerio');
const Database = require("@replit/database");
const db = new Database();
var MongoClient = require('mongodb').MongoClient;
var uri = `mongodb+srv://replit:${process.env['mongo']}@statustracker.zp2rb.mongodb.net/statustracker?retryWrites=true&w=majority`;

var staffs = [
  "Frumple",
  "chiefbozx",
  "AP_Red",
  "Cynra_",
  "Tom_Pairs", 
  "Skelezomperman",
  "Needn_NL",
  "Missa_Solemnis",
  "MPolo455",
  "hvt2011",
  "MC_Protocol",
  "DintyB",
  "VickiTori_",
  "SimonScholar",
  "__7d",
  "Mojang1014"];

var prevStringentry;

var server = http.createServer(function(request, response) {  
  if (request.method === 'POST') {
    let body = '';
    request.on('data', chunk => {
      body += chunk.toString(); // convert Buffer to string
    });
    request.on('end', () => {
      console.log(parse(body));
      response.end("complete");
    });
  }
  else {
    var path = url.parse(request.url).pathname; 
    console.log(path)
    switch (path) {  
      case '/':
        fs.readFile(__dirname + '/index.html', function(error, data) { 
          if (error) { 
            response.writeHead(404); 
            response.write(error); 
            response.end(); 
          } else { 
            response.writeHead(200, { 
              'Content-Type': 'text/html' 
            }); 
            response.write(data); 
            response.end(); 
          } 
        }); 
        break;
      case '/index.js': 
      case '/script.js': 
        fs.readFile(__dirname + path, function(error, data) { 
          if (error) { 
            response.writeHead(404); 
            response.write(error); 
            response.end(); 
          } else { 
            response.writeHead(200, { 
              'Content-Type': 'application/javascript' 
            }); 
            response.write(data); 
            response.end(); 
          } 
        }); 
        break;
      case '/count.json': 
        /*fs.readdir('data/', function(error, datas) { 
          if (error) { 
            response.writeHead(404); 
            response.write(error); 
            response.end(); 
          } else { 
            let all = {}
            datas.forEach(data => {
              all = Object.assign({}, all, JSON.parse(fs.readFileSync("data/"+data)))
            })
            response.writeHead(200, { 
              'Content-Type': 'application/json' 
            }); 
            response.write(JSON.stringify(all)); 
            response.end(); 
          } 
        });*/
        console.log("Retrieving");
        MongoClient.connect(uri, function(err, db) {
          if (err) throw err;
          var dbo = db.db("statustracker");
          dbo.collection("statustracker").find({}).toArray(function(err, res) {
            if (err) throw err;
            console.log("Retrieved")
            let dict = {};
            res.forEach(doc => {
              dict[doc._id] = doc.data
            })
            console.log("Sorted")
            response.writeHead(200, { 
              'Content-Type': 'application/json' 
            }); 
            response.write(JSON.stringify(dict));
            response.end();
            db.close();
          });
        });
        /*db.getAll().then(dict => {
          console.log("Retrieved")
          response.writeHead(200, { 
            'Content-Type': 'application/json' 
          }); 
          response.write(JSON.stringify(dict));
          response.end();
        });*/
        break;
      default: 
        response.writeHead(404); 
        response.write("404"); 
        response.end(); 
        break; 
    }
  } 
}); 
server.listen(3000);

function update()
{
  source = null;
  var request = new XMLHttpRequest();
  request.open("GET", "https://status.minecartrapidtransit.net", true);
  request.send(null);
  request.onreadystatechange = function() {
    if (request.readyState == 4)
    {
      source = request.responseText;
      const $ = cheerio.load(source);
      trs = $(".name");
      
      timestamp = Math.round(new Date() / 1000 / 60).toString();
      entry = {
        "Main": {}, "Mumble": {}
      };

      for (i = 0; i < trs.length; i++)
      {
        if (!["Main", "Mumble"].includes(trs.eq(i).text())) continue;
        
        players = trs.eq(i).parents("tr").eq(0).children(".players");
        names = [];
        if (players.children("ul").length != 0)
        {
          list = players.children("ul").children("li")
          for (j = 0; j < list.length; j++) 
          {
            names.push(list.eq(j).text());
          }
        }

        entry[trs.eq(i).text()] = {
          "players": names.length
        }

        function numOfStaff(list)
        {
          staff = 0
          for (k = 0; k < list.length; k++)
          {
            if (staffs.includes(list[k])) staff++;
          }
          return staff;
        }

        if (trs.eq(i).text() == "Main") entry[trs.eq(i).text()]["staffs"] = numOfStaff(names);

      }

      stringentry = `${entry["Main"]["players"]} ${entry["Main"]["staffs"]} ${entry["Mumble"]["players"]}`
      console.log(entry)
      if (prevStringentry == stringentry) return;
      prevStringentry = stringentry
      /*db.set(timestamp, stringentry).then(() => {});*/
      MongoClient.connect(uri, function(err, db) {
        if (err) throw err;
        var dbo = db.db("statustracker");
        var obj = {_id: timestamp, data: stringentry};
        dbo.collection("statustracker").insertOne(obj, function(err, res) {
          if (err) throw err;
          console.log("inserted");
          db.close();
        });
      });
      /*fs.readFile('data/count.json', (err, data) => {
        if (err) throw err;
        let logs = JSON.parse(data);
        logs[timestamp] = stringentry;
        /if (Object.keys(logs).length > 600)
        {
          var temp = Object.keys(logs);
          temp.sort((a, b) => a - b);
          console.log(temp[0]);
          delete logs[temp[0]];
        }/
        //console.log(logs);
        newdata = JSON.stringify(logs, null, 2);
        fs.writeFileSync('data/count.json', newdata)
        if (Math.round(new Date() / 1000 / 60) - parseInt(fs.readFileSync('lastcopied.txt')) >= 720) {
          fs.writeFile(`data/${new Date().toISOString()}.json`, newdata, err => {if (err) throw err;});
          fs.writeFile(`data/count.json`, '{}', err => {if (err) throw err;});
          fs.writeFile(`lastcopied.txt`, Math.round(new Date() / 1000 / 60).toString(), err => {if (err) throw err;})
          console.log("Refreshed");
        }
      });*/
    }
  };
}
update();
setInterval(update, 60*1000);