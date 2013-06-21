function positionFrom(model) {
  return {x:model.get("x"),y:model.get("y")};
}

var Cell=Backbone.Model.extend({
  neighborDelta:[
    [
      {x:0,y:-1},
      {x:1,y:0},
      {x:1,y:1},
      {x:0,y:1},
      {x:-1,y:1},
      {x:-1,y:0}
    ],
    [
      {x:0,y:-1},
      {x:1,y:-1},
      {x:1,y:0},
      {x:0,y:1},
      {x:-1,y:0},
      {x:-1,y:-1}
    ]
  ],
  neighborCells:function(){
    var x=this.get("x");
    var y=this.get("y");
    var neighbors=this.neighborDelta[(1+x)%2];
    return _.map(neighbors,function(neighbor){
      return {x:neighbor.x+x,y:neighbor.y+y};
    });
  },
  neighbors:function(fieldModel) {
    return _.map(this.neighborCells(),function(pos) {
      return fieldModel.getByPosition(pos);
    });
  }
});

var Field=Backbone.Collection.extend({
  model:Cell,
  getByPosition:function(pos) {
    if(pos.x<0 || pos.y<0 || pos.x>=this.w || pos.y>=this.h)
      return null;
    var index=pos.x+pos.y*this.w;
    return this.at(index);
  }
});

var Entity=Backbone.Model.extend({
  initialize:function() {
    var self=this;
    // animations
    if(this.get("anim")) {
      self.set({frameIndex:0});
    }
    this.bindCheckVisibility();
  },
  variant:function() {
    if(this.get("variants")) {
      var v=this.get("variance")%this.get("variants");
      return v;
    }
  },
  animTick:function() {
    var anim=this.get("anim");
    if(anim) {
      var c=this.get("frameIndex");
      this.set("frameIndex",(c+1)%anim.frames);
    } else {
      var tempAnim=this.get("currentAnim");
      if(tempAnim) {
	var c=this.get("frameIndex");
	c+=1;
	if(c>=tempAnim.frames) {
	  c=0;
	  this.set("currentAnim",null);
	}
	this.set("frameIndex",c);
      }
    }
  },
  setAnimation:function(type) {
    this.set({frameIndex:0,currentAnim:type});
  },
  tick:function() {
  },
  moveBy:function(by) {
    if(by>=0) {
      var field=this.get("world").get("field"); 
      var neighborCells=field.getByPosition(positionFrom(this)).neighbors(field);
      var cell=neighborCells[by];
      if(cell && !cell.get("wall")) {
	var npos=positionFrom(cell);
	var other=this.get("world").get("entities").where(npos);
	var nonpassable=_.select(other,function(e) { return !e.get("passable");});
	if(nonpassable.length>0) {
	  if(this.attack) {
	    this.attack(nonpassable[0]);
	  }
	  console.log("OTHER "+other+" "+by);
	} else {

	  if(other.length>0) {
	    if(this.collect)
	      this.collect(other[0]);
	  }

	  // move to next position
	  this.unbindCheckVisibility();
	  this.set(npos);
	  this.bindCheckVisibility();
	}
      }
    }
  },
  getCell:function() {
    var field=this.get("world").get("field"); 
    return field.getByPosition(positionFrom(this));
  },
  bindCheckVisibility:function() {
    this.getCell().on("change",this.checkVisibility,this);
  },
  unbindCheckVisibility:function() {
    this.getCell().off("change",this.checkVisibility,this);
  },
  checkVisibility:function(cellModel) {
    if(cellModel.get("visited"))
      this.set({visible:true});
  }
});

var PlayerModel=Entity.extend({
  initialize:function() {
    Entity.prototype.initialize.apply(this,arguments);
    this.set({visible:true});
    this.on("change",this.changeVisitingStateOfCells,this);
    this.changeVisitingStateOfCells();
  },
  changeVisitingStateOfCells:function() {
    var field=this.get("world").get("field"); 
    var myCell=field.getByPosition(positionFrom(this));
    var lastVisited=field.where({visible:true});
    var neighbors=myCell.neighbors(field);
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
    Entity.prototype.moveBy.apply(this,[by]); 
    this.get("world").tick();
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
    console.log("ATTACK",whom);
    this.setText("Ouch");
    this.setAnimation({name:"animFight",frames:7});
    whom.setAnimation({name:"animDefend",frames:4});
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

    what.destroy();
  }
});

var Monster=Entity.extend({
  freeNeighborCells:function() {
    var field=this.get("world").get("field"); 
    var neighborCells=field.getByPosition(positionFrom(this)).neighbors(field);
    return _.map(neighborCells,function(cell,iter) {
      return iter;
    });
  },
  tick:function() {
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
  },
  attack:function(who) {
    var self=this;
    console.log("UNDER ATTACK :"+this);
    console.log(who.get("hp"));
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

var World=Backbone.Model.extend({
  initialize:function() {
    $(window).focus(_.bind(this.animate,this));
    $(window).blur(_.bind(this.stop,this));

    this.animate();
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

function modelToScreenPos(model) {
  return cellPosToScreenPos(model.get("x"),model.get("y"));
}

function cellPosToScreenPos(x,y) {
  return {
    left:x*54,
    top:((x%2)+y*2)*36
  };
}

var CellView=Backbone.View.extend({
  tagName:"div",
  initialize:function(){
    this.listenTo(this.model,"change",this.render);
    var self=this;
    _.each(this.model.neighbors(this.options.fieldModel),function(neighbor) {
      if(neighbor) {
	//console.log("nei",neighbor);
	self.listenTo(neighbor,"change",self.render);
      }
    });
  },
  render:function(){
    var self=this;
    var blendType="void"; //fog";

    var klasses=[]
    console.log("RENDER");

    this.$el.addClass("tile");
    this.$el.css(modelToScreenPos(this.model));

    this.$el.attr({x:this.model.get("x"),y:this.model.get("y")});

    if (!this.model.get("wall")) {
      this.$el.addClass("floor");
      this.$el.addClass("var"+(this.model.get("variance")%6));

    } else {
      var wklasses=[];
      var ns=this.model.neighbors(this.options.fieldModel);
      var nw=_.map(ns,function(n) {
	return (!n || (n.get("wall")));
      });
      var v=_.map(ns,function(n) {
	return n && n.get("visited");
      });
      if(v[2] && nw[1] && !nw[2]) 
	wklasses.push('concave_tl'); 
      if(v[3] && nw[5] && !nw[4]) 
	wklasses.push('concave_tr'); 
      if(nw[3] && !nw[2]) 
	wklasses.push('concave_l'); 
      if(nw[3] && !nw[4]) 
	wklasses.push('concave_r'); 
      if(!nw[5] && nw[4]) 
	wklasses.push('concave_br'); 
      if(!nw[1] && nw[2]) 
	wklasses.push('concave_bl'); 

      // convex
      if(!nw[0] && !nw[1]) 
	wklasses.push('convex_tr'); 
      if(v[2] && !nw[1] && !nw[2]) 
	wklasses.push('convex_r'); 
      if(v[2] && !nw[2] && !nw[3]) 
	wklasses.push('convex_br'); 
      if(v[3] && !nw[3] && !nw[4])  
	wklasses.push('convex_bl'); 
      if(!nw[4] && !nw[5]) 
	wklasses.push('convex_l'); 
      if(!nw[5] && !nw[0]) 
	wklasses.push('convex_tl'); 

      _.each(wklasses,function(k) {
	klasses.push("wall wall_"+k);
	//self.$el.append("<div class='wall wall_"+k+"'></div>"); 
      });

    }
    if (klasses.length>0 || !this.model.get("wall") || true) {
      var blendValue=""; //" half";
      if(!this.model.get("visited"))
	blendValue="";
      if(this.model.get("visited")) {
	var ns=this.model.neighbors(this.options.fieldModel);

	var names=["n","ne","se","s","sw","nw"];
	var nw=_.map(ns,function(n,iter) {
	  if(!n || !(n.get("visited"))) {
	    return names[iter];
	  }
	});
	nw=_.filter(nw,function(n) { return n;});
	var str=nw.join("_");
	if(str!="") {
	  klasses.push(blendType+" "+blendType+"_"+str+blendValue);
	}
      } 
      if(!this.model.get("visited")) {
	klasses.push(blendType+" "+blendType+"_"+blendValue);
      }
    }
    this.$el.empty();
    _.each(klasses,function(k) {
      self.$el.append("<div class='"+k+"'></div>"); 
    });



  }
});

function VisibleChecker(el) {
  var w=el.width();
  var h=el.height();
  var t=el.scrollTop();
  var l=el.scrollLeft();
  var margin=20;
  return function(entity) {
    var p=modelToScreenPos(entity);
    return (p.left>l-margin && p.left<l+w+margin && p.top>t-margin && p.top<t+h+margin);
  };
}

var FieldView=Backbone.View.extend({
  initialize:function(){
  },
  createView:function(cellModel) {
    var cell=new CellView({
      model:cellModel,fieldModel:this.model});
      cell.render();
      $(this.el).append(cell.el);
  },
  render:function() {
    var self=this;
    var checker=VisibleChecker(this.$el);
    this.model.each(function(cellModel){
      if(true)
	self.createView(cellModel);
      else
      if(checker(cellModel)) {
	var selector=".tile[x='"+cellModel.get("x")+"'][y='"+cellModel.get("y")+"']";
	//console.log("SEL",selector,this.$(selector).length);
	if(this.$(selector).length==0) {
	  self.createView(cellModel);
	}
      }
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
    this.$el.addClass(this.model.get("klass"));
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

    // display texts
    var text=this.model.get("text");
    if(text) {
      this.$el.html("<div class='speak'>"+text+"</div>");
    }
    else
      this.$el.html("");
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

var StatsView=Backbone.View.extend({
  el:"#inventory .numbers",
  templateEl:"#numbersTemplate",
  attributes:["hp","x","y"],
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

var WorldView=Backbone.View.extend({
  initialize:function() {
    var player=this.model.get("entities").getPlayer();
    this.listenTo(player,"change",this.move);
    this.move(player);
  },
  move:function(entity) {
    var pos=modelToScreenPos(entity);
    var t=pos.top-this.$el.height()/2+36;
    var l=pos.left-this.$el.width()/2+36;
    this.$el.stop(true,false).animate({scrollTop:""+t+"px",
      scrollLeft:""+l+"px"});
  }
});



$(function() {

  var w=32;
  var h=32;
  // create level-text
  var level=createLevel({w:w,h:h});
  console.log("LEVEL",level);
  var cells=[];

  var entities=new Entities();
  var mapping={
    "@":{type:PlayerModel,klass:"general", maxHp:15,hp:15,strength:3,idleAnim:{frame:100,frames:7},inventory:{gold:10}},
    "T":{type:Monster,klass:"troll",hp:13,maxHp:13,strength:2},
    "O":{type:Entity,klass:"fire",anim:{frames:8}},
    "$":{
      type:Entity,
      klass:function() { 
	console.log("KASLS",this);
	return "item gold_small var"+(Math.floor(Math.random()*3+1));
      },
      passable:true,variants:4,
      inventory:{gold:Math.floor(Math.random()*3+1)}
    },
    // "$":"gold_small",
    "G":{type:Entity,klass:"cage"}
  };
  for(var i=0;i<w*h;i++)
  {
    var x=i%w,y=Math.floor(i/w);
    var s=level[y][x];

    cells.push(new Cell({x:x,y:y,wall:s=="#",variance:Math.floor(Math.random()*100)}));
  }

  var field=new Field(cells);
  field.w=w;
  field.h=h;

  var world=new World({field:field,entities:entities});

  for(var i=0;i<w*h;i++)
  {
    var x=i%w,y=Math.floor(i/w);
    var s=level[y][x];

    var klass=mapping[s];
    if(klass) {
      if(typeof(klass.klass)=='function')
	klass.klass=klass.klass();
      var ops=_.extend({x:x,y:y,world:world},klass);
      entities.add(new klass.type(ops));
    }
  }

  var fieldView=new FieldView({el:"#field",model:field});
  fieldView.render();
  var entitiesView=new EntitiesView({el:"#field",model:entities});
  entitiesView.render();


  var player=entities.getPlayer();
  console.log("PLAYER",player);
  var statsView=new StatsView({model:player});

  var controller = new Controller({
    entities : entities,
    World : world,
    player:entities.getPlayer()
  });

  controller.init();

  var worldView=new WorldView({el:"#field",model:world});
  if(false)
    $("#field").scroll(function() {
      fieldView.render();
      entitiesView.render();
    });
});


