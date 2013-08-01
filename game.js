function positionFrom(model) {
  return {x:model.get("x"),y:model.get("y")};
}

var Monster=MovingEntity.extend({
  freeNeighborCells:function() {
    var field=this.get("level").get("field"); 
    var neighborCells=field.getByPosition(positionFrom(this)).neighbors(field);
    return _.map(neighborCells,function(cell,iter) {
      return iter;
    });
  },


  

  tick:function() {
    // dead
    if(this.isDead())
      return;


    if(!this.done)
      this.done=0;
    this.done+=1;
    if(this.done>0) {
      var free=this.freeNeighborCells();
      var next=_.shuffle(free)[0];
      if(next) {
	this.moveBy(next);
      }
      this.done=0;
    }
  }
});

var Entities=Backbone.Collection.extend({
  initialize:function() {
  },
  model:Entity,
  getPlayer:function() {
    return this.findWhere({type:PlayerModel});
  },
  animate:function() {
    this.each(function(entity) { entity.animTick();});
  },
  advance:function() {
    this.each(function(entity) { entity.tick();});
  }
});

var LevelCollection=Backbone.Collection.extend({
  model:Level
});

// has:
// * levels - LevelCollection
// * currentLevel - id of current Level
function modelToScreenPos(model) {
  return cellPosToScreenPos(model.get("x"),model.get("y"));
}

function cellPosToScreenPos(x,y) {
  return {
    left:x*54,
    top:((x%2)+y*2)*36
  };
}

function distanceModel(a,b) {
  var p0=modelToScreenPos(a);
  var p1=modelToScreenPos(b);
  var dx=p1.left-p0.left;
  var dy=p1.top-p1.top;
  console.log("distance",JSON.stringify(p0),JSON.stringify(p1),dx,dy);
  return Math.sqrt(dx*dx+dy*dy)/72;
}

function VisibleChecker(el,player) {
  var w=el.width();
  var h=el.height();
  var t=el.scrollTop();
  var l=el.scrollLeft();
  var margin=200;
  return function(entity,debug) {

    var p=modelToScreenPos(entity);
    var ppos=modelToScreenPos(player);
    if(debug)
      console.log("visblechecked debug",w,h,t,l,JSON.stringify(p),JSON.stringify(ppos),entity,player);
    p.left-=ppos.left;
    p.top-=ppos.top;
    return (p.left>-w/2-margin && p.left<w/2+margin && p.top>-h/2-margin && p.top<h/2+margin);
  };
}


function createLevelFromLevelText(levelText,depth) {
  var cells=[];

  var entities=new Entities();
  var mapping={
    "@":{type:PlayerModel,klass:"general", maxHp:15,hp:15,exp:0,strength:3,
      idleAnim:{frame:100,frames:7},
      animFight:{frames:7},
      inventory:{gold:10}
    },

    "d":{type:Monster,klass:"dwarf",hp:10,maxHp:10,exp:10,strength:2,
      animFight:{frames:8},
      animDefend:{frames:4}
    },

    "g":{type:Monster,klass:"ogre",hp:20,maxHp:20,exp:15,strength:4,
      animFight:{frames:5},
      animDefend:{frames:2}
    },

    "T":{type:Monster,klass:"troll",hp:13,maxHp:13,exp:10,strength:2,
      animFight:{frames:6},
      animDefend:{frames:2}
    },

    "t":{type:Monster,klass:"troll_whelp",hp:10,maxHp:15,exp:0,strength:1,
      animFight:{frames:3},
      animDefend:{frames:2}
    },

    "R":{type:Monster,klass:"rat",hp:5,maxHp:5,exp:0,strength:1,
      animFight:{frames:7},
      animDefend:{frames:2}
    },

    "O":{type:Entity,klass:"fire",anim:{frames:8}},

    "o":{type:Entity,klass:"brazier",anim:{frames:8}},

    "$":{
      type:Entity,
      klass:function() { 
	return "item gold_small var"+this.inventory.gold;
      },
      passable:true,variants:4,
      inventory:{gold:Math.floor(Math.random()*3+1)},
      onlyInventory:true
    },

    "s":{
      type:Entity,
      klass:function() { 
	return "stones var"+(Math.floor(Math.random()*3+1));
      },
      passable:true,variants:4,
    },
    // "$":"gold_small",
    //
    "G":{type:Entity,klass:"cage"},

    "b":{type:Entity,klass:"burial",passable:true},

    "S":{type:Entity,klass:"scarecrow",passable:true},

    "F":{type:Entity,klass:"orcish-flag",passable:true},

    "M":{type:Entity,klass:"mushrooms",passable:true},

    "m":{type:Entity,klass:"medipack",passable:true,inventory:{potion:1},onlyInventory:true}
  };
  var w=levelText[0].length;
  var h=levelText.length;
  for(var i=0;i<w*h;i++)
  {
    var x=i%w,y=Math.floor(i/w);
    var s=levelText[y][x];

    cells.push(new Cell({x:x,
      y:y,
      ascii:(_.contains(['#','<','>'],s)?s:'.'), //(s.match(/[A-Z]/)?".":s),
      wall:s=="#",
      door:s=='+',
      stairs:{'<':'down','>':'up'}[s], //(s=='<'?"down":null),
      variance:Math.floor(Math.random()*100)
    }));
  }

  var field=new Field(cells);
  field.w=w;
  field.h=h;

  var level=new Level({field:field,entities:entities});

  for(var i=0;i<w*h;i++)
  {
    var x=i%w,y=Math.floor(i/w);
    var s=levelText[y][x];

    var klass=mapping[s];
    if(klass) {
      if(typeof(klass.klass)=='function')
	klass.klass=klass.klass();
      var ops=_.extend({x:x,y:y,z:depth,level:level},klass);
      entities.add(new klass.type(ops));
    }
  }
  return level;

}

function createWorldFromText(worldText) {
  var levels=_.map(worldText,function(levelText,levelDepth) {
    return createLevelFromLevelText(levelText,levelDepth);
  });
  var levelCollection=new LevelCollection(levels);
  var world=new World({levels:levelCollection,currentLevel:0});
  _.each(levels,function(level) {
    level.set("world",world);
  });

  return world;
}


$(function() {

  var h=64;
  h=32;
  var w=h*2;
  var worldText=createWorld({w:64,h:32,d:2});

  var world=createWorldFromText(worldText);
  var level=world.currentLevel();

  var entities=level.get("entities");
  var field=level.get("field");

  var player=entities.getPlayer();

  var worldView=new WorldView({
    model:world
  });

  worldView.render();

  // display minimap, when URL is like index.html#.*minimap.*
  if(location.hash && location.hash.match(/minimap/)) {
    var miniMap=new MiniMapView({el:"#minimap",model:level});
  }

  var statsView=new StatsView({model:player});

  var controller = new Controller({
    player:entities.getPlayer()
  });

  controller.init();

});


