result = {};

window.onload = function() {
  d = new Date();
  document.getElementById("end").value = `${extraZero(d.getFullYear())}-${extraZero(d.getMonth()+1)}-${extraZero(d.getDate())}T${extraZero(d.getHours())}:${extraZero(d.getMinutes())}`;
  start = Date.parse(document.getElementById("start").value) / 60 / 1000;
  end = Date.parse(document.getElementById("end").value) / 60 / 1000;
  $.getJSON("count.json", (r) => {result = r; chart(result, start, end);});
};

function update()
{
  start = Date.parse(document.getElementById("start").value) / 60 / 1000;
  end = Date.parse(document.getElementById("end").value) / 60 / 1000;
  chart(result, start, end);
}

function extraZero(n)
{
  if (n.toString().length == 1) return "0".concat(n.toString());
  else return n.toString();
}

function view(mins)
{
  de = new Date();
  document.getElementById("end").value = `${extraZero(de.getFullYear())}-${extraZero(de.getMonth()+1)}-${extraZero(de.getDate())}T${extraZero(de.getHours())}:${extraZero(de.getMinutes())}`;
  if (mins == null) document.getElementById("start").value = "2020-11-01T00:00";
  else
  {
    ds = new Date();
    ds.setMinutes(ds.getMinutes() - mins);
    document.getElementById("start").value = `${extraZero(ds.getFullYear())}-${extraZero(ds.getMonth()+1)}-${extraZero(ds.getDate())}T${extraZero(ds.getHours())}:${extraZero(ds.getMinutes())}`;
  }
  update();
}

function chart(result, start, end)
{
  mcplayers = [];
  mcstaffs = [];
  mumble = [];
  percentage = [];
  for (const [time, val] of Object.entries(result))
  {
    if (time >= start && time <= end)
    {
      mcplayers.push({x: new Date(time * 60 * 1000), y: parseInt(val.split(" ")[0])});
      mcstaffs.push({x: new Date(time * 60 * 1000), y: parseInt(val.split(" ")[1])});
      mumble.push({x: new Date(time * 60 * 1000), y: parseInt(val.split(" ")[2])});
      percentage.push({x: new Date(time * 60 * 1000), y: parseInt(val.split(" ")[1]) / parseInt(val.split(" ")[0])})
    }
  }

  var chart = new CanvasJS.Chart("chart", {
    title: {text: "Players"},
    zoomEnabled: true,
    toolTip: {
      shared: true,
      contentFormatter: function(e){
        var str = e.entries[0].dataPoint.x.toLocaleString() + "<br>";
        cplayers = 0;
        cstaffs = 0;
        for (var i = 0; i < e.entries.length; i++) {
          var temp = `<span style="color:${e.entries[i].dataSeries.color};">${e.entries[i].dataSeries.name} </span><strong>${e.entries[i].dataPoint.y}</strong><br/>` ; 
          str = str.concat(temp);
          if (e.entries[i].dataSeries.name == "players") cplayers = e.entries[i].dataPoint.y;
          if (e.entries[i].dataSeries.name == "staffers") cstaffs = e.entries[i].dataPoint.y;
        }
        var pc = Math.round(cstaffs / cplayers * 100);
        if (pc.isNaN) pc = "-";
        str = str.concat(`% staff: ${pc}`);
        return (str);
      }
    },
    data: [
      {        
        type: "line",
        name: "players",
        color: "darkgreen",
        dataPoints: mcplayers
      },
      {        
        type: "line",
        name: "staffers",
        color: "#cc0000",
        dataPoints: mcstaffs
      },
      {        
        type: "line",
        name: "mumble",
        color: "#87ceeb",
        dataPoints: mumble
      },
      /*{
        type: "line",
        name: "percentage",
        color: "#aaaaaa",
        dataPoints: percentage
      }*/
    ]
  });

  chart.render();
}