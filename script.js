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
  var mcplayers = [];
  var mcstaffs = [];
  var mumble = [];
  var percentage = [];
  var prevMcplayers;
  var prevMcstaff;
  var prevMumble;
  var prevPercentage;
  var min = Math.min(...Object.entries(result).map(entry => entry[0]));

  for (var time=start; time<end; time++) {
    if (result[time]) {
      val = result[time];
      mcplayers.push({x: new Date(time * 60 * 1000), y: prevMcplayers = parseInt(val.split(" ")[0])});
      mcstaffs.push({x: new Date(time * 60 * 1000), y: prevMcstaff = parseInt(val.split(" ")[1])});
      mumble.push({x: new Date(time * 60 * 1000), y: prevMumble = parseInt(val.split(" ")[2])});
      percentage.push({x: new Date(time * 60 * 1000), y: prevPercentage = parseInt(val.split(" ")[1]) / parseInt(val.split(" ")[0]) * 100});
    } else {
      if (prevMcplayers) {
        mcplayers.push({x: new Date(time * 60 * 1000), y: prevMcplayers});
        mcstaffs.push({x: new Date(time * 60 * 1000), y: prevMcstaff});
        mumble.push({x: new Date(time * 60 * 1000), y: prevMumble});
        percentage.push({x: new Date(time * 60 * 1000), y: prevPercentage});
      } else {
        for (var i = time; i > min; i--) {
          if (result[i]) {
            mcplayers.push({x: new Date(time * 60 * 1000), y: prevMcplayers = parseInt(result[i].split(" ")[0])});
            mcstaffs.push({x: new Date(time * 60 * 1000), y: prevMcstaff = parseInt(result[i].split(" ")[1])});
            mumble.push({x: new Date(time * 60 * 1000), y: prevMumble = parseInt(result[i].split(" ")[2])});
            percentage.push({x: new Date(time * 60 * 1000), y: prevPercentage = parseInt(result[i].split(" ")[1]) / parseInt(result[i].split(" ")[0]) * 100});
            break;
          }
        }
      }
    } 
  }

  var chart = new CanvasJS.Chart("chart", {
    title: {text: "Players"},
    zoomEnabled: true,
    rangeChanged: syncHandler,
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
        if (isNaN(pc)) pc = "-";
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
  
  var pcchart = new CanvasJS.Chart("pcchart", {
    title: {text: "% Staff"},
    zoomEnabled: true,
    rangeChanged: syncHandler,
    toolTip: {
      shared: true,
      contentFormatter: function(e){
        var str = e.entries[0].dataPoint.x.toLocaleString() + "<br>";
        var pc = e.entries[0].dataPoint.y;
        if (pc.isNaN) pc = "-";
        str = str.concat(`% staff: ${pc}`);
        return (str);
      }
    },
    data: [
      {
        type: "line",
        name: "percentage",
        color: "#aaaaaa",
        dataPoints: percentage
      }
    ]
  });

  pcchart.render();
  
  var charts = [chart, pcchart]; 
 
  function syncHandler(e) {
    for (var i = 0; i < charts.length; i++) {
        var chart = charts[i];
        if (!chart.options.axisX) chart.options.axisX = {};
        if (!chart.options.axisY) chart.options.axisY = {};
        if (e.trigger === "reset") {
          chart.options.axisX.viewportMinimum = chart.options.axisX.viewportMaximum = null;
          chart.options.axisY.viewportMinimum = chart.options.axisY.viewportMaximum = null;
          chart.render();
        } else if (chart !== e.chart) {
          chart.options.axisX.viewportMinimum = e.axisX[0].viewportMinimum;
          chart.options.axisX.viewportMaximum = e.axisX[0].viewportMaximum;
          chart.options.axisY.viewportMinimum = e.axisY[0].viewportMinimum;
          chart.options.axisY.viewportMaximum = e.axisY[0].viewportMaximum;
          chart.render();
        }
    }
}
}