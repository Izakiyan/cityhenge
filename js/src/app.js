function SketchRender() {
  RND_FACTOR = 1;
  rnd = function() { return RND_FACTOR*( 2*Math.random() -1) ;}

  var times = SunCalc.getTimes(curtod, 40.734698,-73.995667);

  function sketchLine(ctx, p0, p1) {

    var c = map.getCenter();
    var sunrisePos = SunCalc.getPosition(curtod, c.lat, c.lon);

    var dx = p1.x - p0.x;
    var dy = p1.y - p0.y;
    dx *=0.15;
    dy *= 0.15;

    if ((sunrisePos.altitude > 0.95*(Math.PI/2)) && (sunrisePos.altitude < 1.05*(Math.PI/2))){
    }

    var lw = 0.4;
    if (sunrisePos.altitude < 0.1){
      //NIGHT TIME
      // console.log('night')
      ctx.strokeStyle = "rgba(0,0,0, 1)";
      lw = 0.4
      } else {
      //higher sun = greater tolerance
      var tolerance = 0.20*sunrisePos.altitude/Math.PI;
      // tolerance = 0.05;

      var r = Math.atan2(p1.y - p0.y, p1.x - p0.x) + 0.5*Math.PI;
      var d = Math.abs((r + Math.PI -  sunrisePos.azimuth) % (Math.PI*2) - Math.PI)
      console.log(d, sunrisePos.azimuth);
      d = d < Math.PI ? d : d - Math.PI;
      if (d < tolerance*Math.PI){
        ctx.strokeStyle = "rgba(254, 217, 118)";
        } else if (d < (tolerance * 1.2)*Math.PI){
        ctx.strokeStyle = "rgba(253, 141, 60)";
        lw = 2
        } else if (d < (tolerance * 1.4)*Math.PI){
        ctx.strokeStyle = "rgba(252, 78, 42, 0.9)";
        lw = 1.8
        } else if (d < (tolerance * 1.6)*Math.PI){
        ctx.strokeStyle = "rgba(189, 0, 38, 0.9)";
        lw = 1.2
        } else if (d < (tolerance * 1.8)*Math.PI){
        ctx.strokeStyle = "rgba(128, 0, 38)";
        lw = .8
        } else {
        ctx.strokeStyle = "rgba(0,0,0, 1)";
        lw = 0.4;
      }
    }
    for(var i = 0; i < 3; ++i) {
      ctx.beginPath();
      ctx.lineWidth = lw
      ctx.moveTo(p0.x - dx, p0.y - dy);
      ctx.lineTo(p1.x + dx, p1.y + dy);
      ctx.closePath();
      ctx.stroke();
    }
  }

  var primitive_render = this.primitive_render = {
    'Polygon': function(ctx, coordinates) {
      var c = coordinates;
      var xmin, xmax,ymin, ymax;
      xmin = xmax = c[0].x;
      ymin = ymax = c[0].y;
      for(var i=1; i < c.length; ++i) {
        sketchLine(ctx, c[i-1], c[i]);
        var p0 = c[i-1];
        var p = c[i];
        xmin = Math.min(xmin, p.x);
        xmax = Math.max(xmax, p.x);
        ymin = Math.min(ymin, p.y);
        ymax = Math.max(ymax, p.y);

      }
    },
    'MultiPolygon': function(ctx, coordinates) {
      var prender = primitive_render['Polygon'];
      for(var i=0; i < coordinates.length; ++i) {
        prender(ctx, coordinates[i][0]);
      }
    },
    'LineString': function(ctx, coordinates) {
      var p = primitive_render['Polygon'];
      p(ctx, coordinates);
    }
  };

}
SketchRender.prototype = new VECNIK.Renderer();

var tod = new Date();
tod.setHours(2);
tod.setMinutes(0);
var curtod = tod;
function displayTime(t){
  // var t = new Date(o);
  var fieldNameElement = document.getElementById("tod");
  hr = t.getHours()+3 + '';
  while (hr.length < 2) hr = '0'+hr;
  mi = t.getMinutes() + '';
  while (mi.length < 2) mi = '0'+mi;
  fieldNameElement.innerHTML =  hr + ":" + mi;
}

var map;
function initMap(table) {
  displayTime(curtod);

  VECNIK.Carto.init(function(carto) {
    VECNIK.Carto.compile(
    "#world { line-width: 2; line-color: #000; [TYPEY='test']{ line-width: 2; } [ZOOM = 0]{ line-width: 2; } }"
    , function() {});
  });
  // var stat = new Stats();


  var template = 'img/bk.png'
  var subdomains = [ '', 'a.', 'b.', 'c.' ];
  var provider = new MM.TemplatedLayer(template, subdomains);

  VECNIK.settings.set({
    ENABLE_CLIPPING: true,
    ENABLE_SIMPLIFY: true,
    ENABLE_FIXING: true,
    ENABLE_SNAPPING: true,
  });

  var dataSource = new VECNIK.CartoDB.API({
    user: 'viz2',
    table: table,
    debug: true
  });

  var shader = new VECNIK.CartoShader({
    'point-color': '#fff',
    'line-color': '#F00',
    'line-width': function(data) {
      // console.log(data)
      return '0';
    },
    'polygon-fill': function(data) {
      return "rgba(200, 200, 200, 1)";
    }
  });

  var vector_layer = new VECNIK.MM.CanvasProvider(dataSource, shader, new SketchRender());
  fg = new MM.Layer(vector_layer);

  map = new MM.Map(document.getElementById('map'), [provider,  fg])

  if(!location.hash) {
    map.setCenterZoom(new MM.Location(40.7199,-73.9694), 13);
  }
  var hash = new MM.Hash(map);
  var t = 0;
  var button = document.getElementById('start_animation');
  function animate(){
    curtod = new Date(tod.getTime() + (t * 60000))
    displayTime(curtod);
    console.log(curtod);
    t = t + 10;
    VECNIK.Carto.compile(
    "#world { line-width: 2; line-color: #000; [TYPEY='test']{ line-width: 2; } [ZOOM = 0]{ line-width: 2; } }", function(shaderData) {
      if(shaderData) {
        shader.compile(shaderData);
      }
    });
    if(t == 14*60) {
      button.style.display = 'block';
      } else {
      setTimeout(animate, 1);
    }
  }
  button.onclick = function() {
    tod = new Date();
    tod.setHours(4);
    tod.setMinutes(0);
    curtod = tod;
    button.style.display = 'none';
    t = 0;
    animate();
    return false;
  };
}
