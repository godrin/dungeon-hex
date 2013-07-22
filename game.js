function positionFrom(model) {
  return {x:model.get("x"),y:model.get("y")};
}

var MovingEntity=Entity.extend({
  initialize:function() {
    Entity.prototype.initialize.apply(this,arguments);
    this.on("change:hp",this.die,this);
  },
  setText:function(text) {
    var self=this;
    this.set("text",text);
    if(this.textTimeout) {
      clearTimeout(this.textTimeout);
    }
    this.textTimeout=setTimeout(function() {
      self.set("text",null);
    },2000);
  },
  attack:function(whom) {
    var self=this;
    if(whom.get("klass")!=this.get("klass")) {
      if (whom.get("hp")){
	console.log("ATTACK",whom);
	this.setText("Ouch");
	this.setAnimation("animFight");
	whom.setAnimation("animDefend");
	this.trigger("attack",this,whom);
	//$("#fx")[0].play();
	if(whom.get("hp")) {
	  hp=whom.get("hp");
	  if(hp>0){
	    console.log("HEALTH: "+hp);
	    hp-=1+(this.get("strength")/2);
	    if(hp<=0) {
	      this.set({exp:(this.get("exp")||0)+3});
	    }
	    console.log("HEALTH: "+hp);
	  }
	  if(hp<0){
	    hp=0;
	  }
	  whom.set({hp:hp});
	}
      }
    }
  },
  isDead:function() {
    return this.get("hp")<=0;
  },
  die:function() {
    if(this.isDead()) {
      this.set({passable:true});
      return;
    }
  }
});

var PlayerModel=MovingEntity.extend({
  initialize:function() {
    MovingEntity.prototype.initialize.apply(this,arguments);
    this.set({visible:true});
    this.on("change",this.changeVisitingStateOfCells,this);
    this.changeVisitingStateOfCells();
  },
  changeVisitingStateOfCells:function() {
    var field=this.get("level").get("field"); 
    var myCell=field.getByPosition(positionFrom(this));
    var lastVisited=field.where({visible:true});
    var neighbors=myCell.neighbors(field);
    var addNeighbors=_.flatten(
      _.map(neighbors,function(neighbor,neighborIndex) {
	var ar=[];
	var ns=neighbor.neighbors(field);
	for(var i=neighborIndex-1;i<neighborIndex+2;i++) {
	  var j=(i+6)%6;
	  ar.push(ns[j]);
	}
	return ar;
	//return neighbor.neighbors(field).slice(neighborIndex-1,neighborIndex+2);
      }));
      neighbors=neighbors.concat(addNeighbors);

      var currentlyVisiting=[myCell].concat(neighbors);
      var noLongerVisible=_.difference(lastVisited,currentlyVisiting);
      _.each(currentlyVisiting,function(cell) {
	if(cell)
	  cell.set({visited:true,visible:true});
      });
      _.each(noLongerVisible,function(cell) {
	if(cell)
	  cell.set({visible:false});
      });

  },
  moveBy:function(by) {
    if (this.get("hp") >= 1) {
      Entity.prototype.moveBy.apply(this,[by]); 
      this.get("level").tick();
    }
  },
  collect:function(what) {
    var my=this.get("inventory");
    var o=what.get("inventory");
    _.each(o,function(v,k) {
      if(!my[k])
	my[k]=0;
      my[k]+=v;
    });
    this.trigger("change",this,{changes:{inventory:my}});
    if(what.get("onlyInventory"))
      what.destroy();
  }
});

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
    if(this.done>2) {
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

var Level=Backbone.Model.extend({
  initialize:function() {
    $(window).focus(_.bind(this.animate,this));
    $(window).blur(_.bind(this.stop,this));

    this.animate();
  },
  findStairs:function(dir) {
    console.log("CCCC",this);
    return this.get("field").findWhere({stairs:(dir>0?"down":"up")});
  },
  stop:function() {
    console.log("STOP");
    document.title="Dungeon - PAUSED";
    if(this.animation) {
      clearInterval(this.animation);
      this.animation=null;
    }
    if(this.advance) {
      clearInterval(this.advance);
      this.advance=null;
    }
  },
  tick:function() {
    console.log("WORLD.tick");
    this.get("entities").advance();
  },
  animate:function() {
    document.title="Dungeon";
    if(this.animation)
      return;
    var self=this;
    this.animation=setInterval(function() {
      self.get("entities").animate();
    },100);
    if(false)
      this.advance=setInterval(function() {
	self.tick();
      },1000);

      var body=$("body")[0];

      var element = document.getElementById("game");
      if (element.requestFullScreen) {
	element.requestFullScreen();
      } else if (element.mozRequestFullScreen) {
	element.mozRequestFullScreen();
      } else if (element.webkitRequestFullScreen) {
	console.log("REQUEST.... FULLSCREEN");
	var res=element.webkitRequestFullScreen();
	console.log("RES",res);
      }
  }
});

var LevelCollection=Backbone.Collection.extend({
  model:Level
});

// has:
// * levels - LevelCollection
// * currentLevel - id of current Level
var World=Backbone.Model.extend({
  initialize:function() {
    this.get("levels").at(0).get("entities").getPlayer().on("change:z",this.setCurrentLevel,this);
  },
  setCurrentLevel:function(player) {
    this.set("currentLevel",player.get("z"));
  },
  currentLevel:function() {
    var levels=this.get("levels");
    var currentLevel=this.get("currentLevel");
    return levels.at(currentLevel);
  }
});

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

var MiniMapCellView=Backbone.View.extend({
  tagName:"div",
  initialize:function() {
    this.render();
  },
  render:function() {
    this.$el.html(this.model.get("ascii"));
    var p=modelToScreenPos(this.model);
    var l=""+Math.round(p.left/5)+"px";
    this.$el.css({left:l,top:p.top/5,position:"absolute"});
  }
});

var MiniMapView=Backbone.View.extend({
  initialize:function() {
    this.render();
  },
  render:function() {
    var el=$(this.el);
    this.model.get("field").each(function(cell) {
      var v=new MiniMapCellView({model:cell});
      el.append(v.el);
    });
  }

});

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

var FieldView=Backbone.View.extend({
  initialize:function(){
    this.listenTo(this.options.player,"change",this.render);
    this.listenTo(this.model,"reset",this.reset);
    this.viewCache={};
    this.inserted={};
  },
  reset:function() {
    this.viewCache={};
    this.inserted={};
    this.$el.empty();
    this.render();
  },
  createView:function(cellModel,checker) {
    var visible=checker(cellModel);
    var cell;
    if(this.viewCache[cellModel.cid]) {
      cell=this.viewCache[cellModel.cid];
      if(visible && !this.inserted[cellModel.cid]) {
	this.inserted[cellModel.cid]=true;
	$(this.el).append(cell.el);
      } else if(!visible && this.inserted[cellModel.cid]) {
	//checker(cellModel,true);
	//asd();
	//console.log("REMOVE from DOM",this);
	this.inserted[cellModel.cid]=false;
	cell.$el.detach(); //$(this.el).detach(cell.el);
      }


      return;
    }
    cell=new CellView({
      model:cellModel,fieldModel:this.model});
      this.viewCache[cellModel.cid]=cell;
      cell.render();
      if(checker(cellModel)) {
	this.inserted[cellModel.cid]=true;
	$(this.el).append(cell.el);
      }
  },
  render:function(options) {
    if(options && options.changed && !(options.changed.x || options.changed.y)) {
      console.log("EARLY out");
      return;
    }
    var self=this;
    var checker=VisibleChecker(this.$el,this.options.player);
    this.model.each(function(cellModel){
      if(true)
	self.createView(cellModel,checker);
      else
      if(checker(cellModel)) {
	var selector=".tile[cid='"+cellModel.cid+"']";
	//console.log("SEL",selector,this.$(selector).length);
	if(this.$(selector).length==0) {
	  self.createView(cellModel,checker);
	}
      }
    });
  }
});

var HpView=Backbone.View.extend({
  tagName:"div",
  className:"entity_hp",
  initialize:function() {
    this.listenTo(this.model,"change:hp",this.render);
    this.listenTo(this.model,"change:maxHp",this.render);
    this.render();
  },
  render:function() {
    var brick=this.$(".brick");
    if(this.model.get("hp")<=0) {
      this.remove();
      return;
    }
    if(brick.length==0) {
      brick=$("<div class='brick'>&nbsp;</div>");
      brick.appendTo(this.$el);
    }
    var p=this.model.get("hp")/this.model.get("maxHp");
    brick.css({width:Math.floor(100*p)+"%",
      backgroundColor:"rgb("+Math.floor(255-p*255)+","+Math.floor(p*255)+",0)"
    });
  }
});

var EntityView=Backbone.View.extend({
  tagName:"div",
  className:"entity",
  initialize:function() {
    this.listenTo(this.model,"change",this.render);
    this.listenTo(this.model,"destroy",this.remove);
  },
  render:function() {
    var self=this;
    if(!this.model.get("visible"))
      return;
    if(this.$el.attr("cid")==this.model.cid) {
      //animate
      this.$el.stop(true,false).animate(modelToScreenPos(this.model),"fast");
    } else {
      this.$el.css(modelToScreenPos(this.model));
    }
    if(!this.model.get("maxHp") || this.model.get("hp")>0)
      this.$el.addClass(this.model.get("klass"));
    else
      this.$el.removeClass(this.model.get("klass")).addClass("corps");
    if(this.model.variant())
      this.$el.addClass("var"+this.model.variant());
    this.$el.attr("cid",this.model.cid);

    // animate
    var anim=this.model.get("anim");
    var currentAnim=this.model.get("currentAnim");
    if(anim || currentAnim) {
      if(!anim) {
	anim=currentAnim;
	this.$el.addClass(anim.name);
      }
      var f=this.model.get("frameIndex");
      for(var i=0;i<anim.frames;i++) {
	if(i==f)
	  this.$el.addClass("anim"+i);
	else
	  this.$el.removeClass("anim"+i);
      }
    } else {
      var klasses=this.$el.attr("class").split(" ");
      _.each(klasses,function(klass) {
	if(klass.match(/anim.*/))
	  self.$el.removeClass(klass);
      });
    }
    if(this.model.get("maxHp") && !this.brick) {
      this.brick=new HpView({model:this.model});
      this.$el.append(this.brick.el);
    }
    if(false) {
      // display texts
      var text=this.model.get("text");
      if(text) {
	this.$el.html("<div class='speak'>"+text+"</div>");
      }
      else
	this.$el.html("");
    }
  },
  update:function() {

  }
});

var EntitiesView=Backbone.View.extend({
  render:function() {
    var self=this;
    var checker=function(){return true;};
    VisibleChecker(this.$el);
    this.model.each(function(entity) {
      if(checker(entity)) {
	if(this.$(".entity[cid='"+entity.cid+"']").length==0) {
	  var v=new EntityView({model:entity});
	  v.render();
	  self.$el.append(v.el);
	}
      }
    });
  },
  tick:function() {

  }
});

var SoundView=Backbone.View.extend({
  el:"#fx",
  initialize:function() {
    var self=this;
    this.model.each(function(entity) {
      self.listenTo(entity,"attack",self.attacked);
    });
  },
  setModel:function(model) {
    var self=this;
    this.model=model;
    this.stopListening();
    this.model.each(function(entity) {
      self.listenTo(entity,"attack",self.attacked);
    });
  },
  attacked:function(from,to) {
    var d=distanceModel(from,this.options.player);
    console.log("DDDDD",d,from,to);
    if(d<5) {
      var volume=1-d/5.0;
      volume*=0.5;
    console.log("SOUND",volume);
      $("#fx")[0].volume=volume;
      $("#fx")[0].play();
    }
  }
});

var StatsView=Backbone.View.extend({
  el:"#inventory .numbers",
  templateEl:"#numbersTemplate",
  attributes:["hp","exp","x","y","z"],
  initialize:function() {
    this.listenTo(this.model,"change",this.render);
    this.render();
  },
  render:function() {
    if(!this.template)
      this.template=$(this.templateEl).html();
    this.$el.html(Mustache.render(this.template,this.present(this.model.toJSON())));
  },
  present:function(m) {
    var r=_.map(this.attributes,function(attribute){return {id:attribute,name:attribute,value:m[attribute]};});
    for(var key in m.inventory) {
      r.push({id:key,name:key,value:m.inventory[key]});
    }
    return {values:r};
  }
});

var LevelView=Backbone.View.extend({
  initialize:function() {
    var field=this.model.get("field");
    $("#world_bg").css({width:field.w*54+72*2,
      height:field.h*54+72*2})

      var player=this.model.get("entities").getPlayer();
      this.listenTo(player,"change",this.move);
      this.move(player);
  },
  move:function(entity) {
    var pos=modelToScreenPos(entity);
    var t=pos.top-this.$el.height()/2+36;
    var l=pos.left-this.$el.width()/2+36;
    if(this.inited) {
      this.$el.stop(true,false).animate({scrollTop:""+t+"px",
	scrollLeft:""+l+"px"});
    } else {
      l=Math.round(l);
      t=Math.round(t);
      this.$el.scrollTop(t).scrollLeft(l);
      this.inited=true;
    }

  }
});


function createLevelFromLevelText(levelText,depth) {
  var cells=[];

  var entities=new Entities();
  var mapping={
    "@":{type:PlayerModel,klass:"general", maxHp:15,hp:15,exp:0,strength:3,
      idleAnim:{frame:100,frames:7},
      animFight:{frames:7},
      inventory:{gold:10}
    },

    "d":{type:Monster,klass:"dwarf",hp:10,maxHp:10,exp:10,strength:1,
      animFight:{frames:8},
      animDefend:{frames:4}
    },

    "g":{type:Monster,klass:"ogre",hp:20,maxHp:20,exp:15,strength:3,
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

    "R":{type:Monster,klass:"rat",hp:5,maxHp:5,exp:0,strength:0.5,
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
    //    console.log("X",x,y,level);
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
  console.log("world",world);
  _.each(levels,function(level) {
    level.set("world",world);
  });

  return world;
}

var WorldView=Backbone.View.extend({
  initialize:function() {
    this.player=this.model.currentLevel().get("entities").getPlayer();
    this.listenTo(this.player,"change:z",this.render);
  },
  render:function() {
    var level=this.model.currentLevel();
    var self=this;

    if(this.fieldView)
      this.fieldView.remove();
    if(this.entitiesView)
      this.entitiesView.remove();

    if($("#field").length==0) {
      $("#world").html('<div id="field"><div id="world_bg"></div></div>');
    }
    var entities=level.get("entities");
    var field=level.get("field");

    self.fieldView=new FieldView({el:"#field",model:field,player:self.player});
    self.fieldView.render();
    self.entitiesView=new EntitiesView({el:"#field",model:entities});
    self.entitiesView.render();
    var levelView=new LevelView({el:"#field",model:level});

    if(!this.soundView)
      this.soundView=new SoundView({model:entities,player:this.player});
    this.soundView.setModel(entities);
  }
});


$(function() {

  var h=64;
  h=32;
  var w=h*2;
  if(false) {
    // create level-text

    var levelText=createLevel({w:w,h:h});
    var level=createLevelFromLevelText(levelText);
  } else {
    var worldText=createWorld({w:64,h:32,d:2});
    console.log("LEVEL",levelText);

    var world=createWorldFromText(worldText);
    var level=world.currentLevel();
    console.log("LEVEL",level);
  }


  var entities=level.get("entities");
  var field=level.get("field");

  var player=entities.getPlayer();

  var worldView=new WorldView({
    model:world
  });

  worldView.render();

  if(location.hash && location.hash.match(/minimap/)) {
    var miniMap=new MiniMapView({el:"#minimap",model:level});
  }

  console.log("PLAYER",player);
  var statsView=new StatsView({model:player});

  var controller = new Controller({
    player:entities.getPlayer()
  });

  controller.init();

  if(false)
    $("#field").scroll(function() {
      fieldView.render();
      entitiesView.render();
    });
});


