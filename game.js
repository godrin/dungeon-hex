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
    var anim=this.get("anim");
    var self=this;
    self.set({frameIndex:0});
    if(anim) {
      setInterval(function() {
	var c=self.get("frameIndex");
	//console.log("C",c);
	self.set("frameIndex",(c+1)%anim.frames);
      },anim.frame);
    }
  }
});

var Entities=Backbone.Collection.extend({
  model:Entity,
  getPlayer:function() {
    return this.findWhere({klass:"general"});
  }
});

var World=Backbone.Model.extend({

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
    this.$el.css(modelToScreenPos(this.model)); //.get("x"),this.model.get("y"))); //*2)*36});
  }
});

function VisibleChecker(el) {
  var w=el.width();
  var h=el.height();
  var t=el.scrollTop();
  var l=el.scrollLeft();
  var margin=20;
  return function(entity) {
    var p=modelToScreenPos(entity); //.get("x"),entity.get("y"));
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
    this.$el.css(modelToScreenPos(this.model)); //.get("x"),this.model.get("y")));
    this.$el.addClass(this.model.get("klass"));
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
	var v=new EntityView({model:entity});
	v.render();
	self.$el.append(v.el);
      }
    });
  },
  tick:function() {

  }
});

var WorldView=Backbone.View.extend({
  initialize:function() {
    this.listenTo(this.model.get("entities").getPlayer(),"change",this.move);
  },
  move:function() {
    var top=10;
    var left=10;
    this.$el.scrollTop(top);
    this.$el.scrollLeft(left);
  }
});


$(function() {
  var w,h;
  w=h=64;
  var cells=[];

  for(var i=0;i<w*h;i++)
  {
    var x=i%w,y=Math.floor(i/w);
    cells.push(new Cell({x:x,y:y,wall:!(x>3 && x<16 && y>3 && y<7)}));
  }

  var field=new Field(cells);
  field.w=w;
  field.h=h;
  var fieldView=new FieldView({el:"#field",model:field});
  fieldView.render();
  var entities=new Entities();
  entities.add(new Entity({klass:"general",x:5,y:4}));
  entities.add(new Entity({klass:"fencer",x:4,y:4}));
  entities.add(new Entity({klass:"trapdoor",x:6,y:4}));
  entities.add(new Entity({klass:"fire",x:6,y:5,anim:{frame:100,frames:8}}));
  entities.add(new Entity({klass:"gold_small",x:5,y:5}));
  entities.add(new Entity({klass:"key",x:4,y:5}));
  var world=new World({field:field,entities:entities});

  var entitiesView=new EntitiesView({el:"#field",model:entities});
  entitiesView.render();

  var worldView=new WorldView({el:"#field",model:world});

  setInterval(function() {
    entitiesView.tick();
  },50);

  $("#field").scroll(function() {
    fieldView.render();
    console.log("SCROLL");
  });
});
