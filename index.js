var http = require('http'); 
var url = require('url'); 
var fs = require('fs'); 
var { parse } = require('querystring'); 
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var cheerio = require('cheerio');

var staffs = [
  "Frumple",
  "Chiefbozx",
  "AP_Red",
  "Cynra_",
  "sesese9",
  "Tom_Pairs", 
  "Skelezomperman",
  "Needn_NL",
  "Missa_Solemnis",
  "ondist",
  "MPolo455",
  "hvt2011",
  "Narnia17",
  "MC_Protocol",
  "DintyB"];

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
        fs.readFile('count.json', function(error, data) { 
          if (error) { 
            response.writeHead(404); 
            response.write(error); 
            response.end(); 
          } else { 
            response.writeHead(200, { 
              'Content-Type': 'application/json' 
            }); 
            response.write(data); 
            response.end(); 
          } 
        }); 
        break;
      default: 
        response.writeHead(404); 
        response.write("404"); 
        response.end(); 
        break; 
    }
  } 
}); 
server.listen(8082);

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
      fs.readFile('count.json', (err, data) => {
        if (err) throw err;
        let logs = JSON.parse(data);
        logs[timestamp] = stringentry;
        /*if (Object.keys(logs).length > 600)
        {
          var temp = Object.keys(logs);
          temp.sort((a, b) => a - b);
          console.log(temp[0]);
          delete logs[temp[0]];
        }*/
        //console.log(logs);
        newdata = JSON.stringify(logs, null, 2);
        fs.writeFile('count.json', newdata, (err) => {
          if (err) throw err;
          //console.log('Data written to file');
        });
      });
    }
  };
}
update();
setInterval(update, 60*1000);