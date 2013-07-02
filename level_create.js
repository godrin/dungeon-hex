function createLevel(ops) {
  var w = ops.w;
  var h = ops.h;
  var x, y;

  var res = [];
  var s = [];
  for (x = 0; x < w; x++)
    s = s.concat([ "#" ]);
  for (y = 0; y < h; y++)
    res.push([].concat(s));

  function validPos(p, distanceToBorder) {
    if(!p)
      return false;
    if (!distanceToBorder)
      distanceToBorder = 0;
    return (p.x >= distanceToBorder && p.x < w - distanceToBorder
    && p.y >= distanceToBorder && p.y < h - distanceToBorder);
  }

  function getdata(cp) {
    if (validPos(cp))
      return res[cp.y][cp.x];
  }
  function setdata(p, pv) {
    if (validPos(p))
      res[p.y][p.x] = pv;
  }

  function randomPos() {

    var sx = Math.round(Math.random() * (w - 3)) + 1;
    var sy = Math.round(Math.random() * (h - 3)) + 1;

    return {
      x : sx,
      y : sy
    };
  }

  function randomFreePos(trials) {
    if (!trials)
      trials = 20;
    while (trials > 0) {
      trials -= 1;
      var p = randomPos();
      if (getdata(p) == ".")
	return p;
    }
  }

  function freePosNear(pos,trials) {
    var p;
    if(!trials)
      trials=20;
    while(trials>0 && !p) {
      _.each(_.range(1,5),function(d) {
	if(p)
	  return;
	var ps=[{x:pos.x-d,y:pos.y},{x:pos.x+d,y:pos.y},
	{x:pos.x,y:pos.y-d},{x:pos.x,y:pos.y+d}];
	_.each(ps,function(cp) {
	  if(getdata(cp)==".")
	    p=cp;
	});
      });
      trials-=1;

    }
    return p;

  }

  // create call what n times and return an array of results
  function make(n, what) {
    var ret = [];
    for ( var i = 0; i < n; i++) {
      var found=what();
      if(found)
	ret.push(found);
    }
    return ret;
  }

  function randomPoint(x, y, w, h) {
    return {
      x : Math.floor(x + w * Math.random()),
      y : Math.floor(y + h * Math.random())
    };
  }

  // return array of neighbors of p and p itself
  function neighbors(p) {
    var ns = [];
    for ( var x = -1; x < 2; x++)
      for ( var y = -1; y < 2; y++) {
	var n = {
	  x : p.x + x,
	  y : p.y + y
	};
	if (validPos(n))
	  ns.push(n);
      }
      return ns;
  }

  function freeNeighbors(p) {
    return $.grep(neighbors(p), function(x) {
      return getdata(x) == ".";
    });
  }
  function opposingWalls(p) {
    return (

      (getdata({
	x : p.x - 1,
	y : p.y
      }) == "#" && getdata({
	x : p.x + 1,
	y : p.y
      }) == "#" &&
      getdata({x:p.x-1,y:p.y+1})=="#" && 
      getdata({x:p.x+1,y:p.y+1})=="#" && 


      (getdata({
	x : p.x,
	y : p.y - 1
      }) == "." && getdata({
	x : p.x,
	y : p.y + 1
      }) == "."))) 
      ;
      /* || 

      ((getdata({
      x : p.x - 1,
      y : p.y
      }) == "." && getdata({
      x : p.x + 1,
      y : p.y
      }) == "." && (getdata({
      x : p.x,
      y : p.y - 1
      }) == "#" && getdata({
      x : p.x,
      y : p.y + 1
      }) == "#")));*/
  }

  function randomDoor(x, y, w, h, trials) {
    if (!trials)
      trials = 4000;
    while (trials > 0) {
      var p = randomPoint(x, y, w, h);
      if (getdata(p) == "." && opposingWalls(p) && freeNeighbors(p).length > 3) {
	// door itself and two neighboring cells
	setdata(p, "+");
	return p;
      }
      trials -= 1;
    }
    return null;
  }

  function createBox(x, y, w, h) {
    if (w < 0) {
      x += w;
      w = -w;
    }
    if (h < 0) {
      y += h;
      h = -h;
    }

    x = Math.floor(x);
    y = Math.floor(y);
    var i, j;
    for (j = Math.floor(x); j < x + w; j++) {
      for (i = Math.floor(y); i < y + h; i++) {
	setdata({
	  x : j,
	  y : i
	}, ".");
      }
    }

    return {
      //  possibleDoors : possibleDoors,
      centers : make(1, function() {
	return randomPoint(x, y, w, h);
      })
    };
  }

  function randomBox() {
    var bw = 2 + Math.floor(Math.random() * (w / 5)), bh = 2 + Math
    .floor(Math.random() * (h / 5));
    var bx = 1 + Math.random() * (w - 3 - bw);
    var by = 1 + Math.random() * (h - 3 - bh);
    if(true) {
      createBox(bx+1, by, bw-1, bh);
      createBox(bx, by+1, bw, bh-2);
      return createBox(bx+1, by+1, bw-2, bh-2);
    } else {
      return createBox(bx, by, bw, bh);
    }
  }


  function makeLine(p0,p1,callback)
  {
    callback(p0);
    if(p0.x==p1.x && p0.y==p1.y)
      return;
    var dx=p1.x-p0.x;
    var dy=p1.y-p0.y;
    var nx=_.extend({},p0);
    if(Math.abs(dx)>Math.abs(dy)) {
      nx.x+=(dx<0?-1:1);
    } else {
      nx.y+=(dy<0?-1:1);
    }
    makeLine(nx,p1,callback);
  }

  function tunnel(p0,p1) {
    var setWall=function(p) {
      setdata(p,".");
    };
    makeLine(p0,p1,setWall);
  }

  function tunnelOld(p0, p1) {
    if (Math.random() < 0.5) {
      createBox(p0.x, p0.y, p1.x - p0.x, 1);
      createBox(p1.x, p0.y, 1, p1.y - p0.y);
    } else {
      createBox(p0.x, p0.y, 1, p1.y - p0.y);
      createBox(p0.x, p1.y, p1.x - p0.x, 1);
    }
  }


  // create some boxes
  var boxes = make(10, randomBox);
  var centers = $.map(boxes, function(box) {
    return box.centers;
  });

  // make tunnels between the boxes
  for ( var i = 0; i < centers.length; i++) {
    var next = (i + 1) % centers.length;
    tunnel(centers[i], centers[next]);
  }

  // make(20, randomLine);

  function randomDirection() {
    var d = Math.random() < 0.5;
    var sign = Math.random() < 0.5 ? -1 : 1;
    if (d)
      return {
	x : sign,
	y : 0
      };
      else
      return {
	x : 0,
	y : sign
      };
  }
  function randomModify(p) {
    var d = randomDirection();
    return {
      x : p.x + d.x,
      y : p.y + d.y
    };
  }

  var p, u, d;
  setdata(d = randomFreePos(), "<");
  setdata(u = randomFreePos(), ">");
  make(20, function() {
    setdata(randomFreePos(), "$");
  });

  make(3, function() {
    setdata(randomFreePos(), "O");
  });

  make(2, function() {
    setdata(randomFreePos(), "o");
  });

  make(2, function() {
    setdata(randomFreePos(), "M");
  });

  make(1, function() {
    setdata(randomFreePos(), "b");
  });

  make(2, function() {
    setdata(randomFreePos(), "m");
  });

  make(7, function() {
    setdata(randomFreePos(), "D");
  });

  make(7, function() {
    setdata(randomFreePos(), "T");
  });

   make(3, function() {
    setdata(randomFreePos(), "g");
  });

  make(5, function() {
    setdata(randomFreePos(), "d");
  });

  make(6, function() {
    setdata(randomFreePos(), "s");
  });

  make(1, function() {
    setdata(randomFreePos(), "S");
  });

  make(1, function() {
    setdata(randomFreePos(), "F");
  });

  make(2, function() {
    setdata(randomFreePos(), "G");
  });

  var doors=
  make(20, function() {
    return randomDoor(0, 0, w, h);
  });
  console.log("DOOR",doors);
  if(doors.length>0 && false)
    u=doors[0];
  setdata(p = freePosNear(d), "@");

  var poss = [ p, d, u ];

  var todo = 20, trials = 100;
  return $.map(res, function(r) {
    return $.map(r, function(x) {
      return x;
    }).join("");
  });

}
