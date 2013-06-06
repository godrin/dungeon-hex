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
  },
  animTick:function() {
    var anim=this.get("anim");
    if(anim) {
      var c=this.get("frameIndex");
      this.set("frameIndex",(c+1)%anim.frames);
    }
  },
  tick:function() {
  },
  moveBy:function(by) {
    var field=this.get("world").get("field"); 
    var neighborCells=field.getByPosition(positionFrom(this)).neighbors(field);
    var cell=neighborCells[by];
    if(cell && !cell.get("wall")) {
      var npos=positionFrom(cell);
      var other=this.get("world").get("entities").where(npos);
      var nonpassable=_.select(other,function(e) { return !e.get("passable");});
      if(nonpassable.length>0) {
	console.log("OTHER",other);
      } else {
	// move to next position
	this.set(npos);
      }
    }
  }
});

var PlayerModel=Entity.extend({
  move:function(by) {
   if (by.x) {
     self.x=by.x;
   }
   if (by.y) {
     self.y=by.y;
   }
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
  }
});

var Entities=Backbone.Collection.extend({
  initialize:function() {
  },
  model:Entity,
  getPlayer:function() {
    return this.findWhere({klass:"general"});
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
  animate:function() {
    document.title="Dungeon";
    if(this.animation)
      return;
    var self=this;
    this.animation=setInterval(function() {
      self.get("entities").animate();
    },100);
    this.advance=setInterval(function() {
      self.get("entities").advance();
    },1000);
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
  },
  render:function(){
    var self=this;

    this.$el.addClass("tile");
    this.$el.attr({x:this.model.get("x"),y:this.model.get("y")});
    if (!this.model.get("wall")) {
      this.$el.addClass("floor"+Math.floor(Math.random()*6));
    } else {
      var ns=this.model.neighbors(this.options.fieldModel);
      var nw=_.map(ns,function(n) {
	return (!n || (n.get("wall")));
      });
      var klasses=[]

      if(nw[1] && !nw[2]) 
	klasses.push('concave_tl'); 
      if(nw[5] && !nw[4]) 
	klasses.push('concave_tr'); 
      if(nw[3] && !nw[2]) 
	klasses.push('concave_l'); 
      if(nw[3] && !nw[4]) 
	klasses.push('concave_r'); 
      if(!nw[5] && nw[4]) 
	klasses.push('concave_br'); 
      if(!nw[1] && nw[2]) 
	klasses.push('concave_bl'); 

      // convex
      if(!nw[0] && !nw[1]) 
	klasses.push('convex_tr'); 
      if(!nw[1] && !nw[2]) 
	klasses.push('convex_r'); 
      if(!nw[2] && !nw[3]) 
	klasses.push('convex_br'); 
      if(!nw[3] && !nw[4])  
	klasses.push('convex_bl'); 
      if(!nw[4] && !nw[5]) 
	klasses.push('convex_l'); 
      if(!nw[5] && !nw[0]) 
	klasses.push('convex_tl'); 

      _.each(klasses,function(k) {
	self.$el.append("<div class='wall wall_"+k+"'></div>"); 
      });
    }
    this.$el.css(modelToScreenPos(this.model));
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
  render:function() {
    var self=this;
    var checker=VisibleChecker(this.$el);
    this.model.each(function(cellModel){
      if(checker(cellModel)) {
	var selector=".tile[x='"+cellModel.get("x")+"'][y='"+cellModel.get("y")+"']";
	//console.log("SEL",selector,this.$(selector).length);
	if(this.$(selector).length==0) {
	  var cell=new CellView({
	    model:cellModel,fieldModel:self.model});
	    cell.render();
	    $(self.el).append(cell.el);
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
  },
  render:function() {
    var self=this;
    if(this.$el.attr("cid")==this.model.cid) {
      //animate
      this.$el.stop(true,false).animate(modelToScreenPos(this.model),"fast");
    } else {
      this.$el.css(modelToScreenPos(this.model));
    }
    this.$el.addClass(this.model.get("klass"));
    this.$el.attr("cid",this.model.cid);
    var anim=this.model.get("anim");
    if(anim) {
      var f=this.model.get("frameIndex");
      for(var i=0;i<anim.frames;i++) {
	if(i==f)
	  this.$el.addClass("anim"+i);
	else
	  this.$el.removeClass("anim"+i);
      }
    }
  },
  update:function() {

  }
});

var EntitiesView=Backbone.View.extend({
  render:function() {
    var self=this;
    var checker=VisibleChecker(this.$el);
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
  var level=createLevel({w:w,h:h});
  console.log("LEVEL",level);
  var cells=[];

  var entities=new Entities();
  var mapping={
    "@":{type:PlayerModel,klass:"general"},
    "T":{type:Monster,klass:"troll"},
    "O":{type:Entity,klass:"fire",anim:{frame:100,frames:8}},
    "$":{type:Entity,klass:"item gold_small"+Math.floor(Math.random()*4+1),passable:true},
    // "$":"gold_small",
    "G":{type:Entity,klass:"cage"}
  };
  for(var i=0;i<w*h;i++)
  {
    var x=i%w,y=Math.floor(i/w);
    var s=level[y][x];

    cells.push(new Cell({x:x,y:y,wall:s=="#"}));
  }

  var field=new Field(cells);
  field.w=w;
  field.h=h;
  var fieldView=new FieldView({el:"#field",model:field});
  fieldView.render();

  var world=new World({field:field,entities:entities});

  for(var i=0;i<w*h;i++)
  {
    var x=i%w,y=Math.floor(i/w);
    var s=level[y][x];

    var klass=mapping[s];
    if(klass) {
      var ops=_.extend({x:x,y:y,world:world},klass);
      entities.add(new klass.type(ops));
    }
  }

  var entitiesView=new EntitiesView({el:"#field",model:entities});
  entitiesView.render();

  var controller = new Controller({
<<<<<<< HEAD
    //Player : player,
    entities : entities
=======
    World : world,
    entities : entities,
    player:entities.getPlayer()
>>>>>>> e75d1bb4b29fad62cc923283f90a6113f618a139
  });

  controller.init();

  var worldView=new WorldView({el:"#field",model:world});
  $("#field").scroll(function() {
    fieldView.render();
    entitiesView.render();
  });
});


