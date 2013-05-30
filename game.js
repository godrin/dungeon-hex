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

});

var Entities=Backbone.Collection.extend({
  model:Entity
});

var World=Backbone.Model.extend({

});

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

    this.$el.addClass("tile");
    this.$el.attr({x:this.model.get("x"),y:this.model.get("y")});
    if (!this.model.get("wall")) {
      this.$el.addClass("floor"+Math.floor(Math.random()*6));
    } else {
      var ns=this.model.neighbors(this.options.fieldModel);
      var nw=_.map(ns,function(n) {
	return (!n || (n.get("wall")));
      });
      if(nw[1] && !nw[2]) {
	this.$el.append("<div class='wall wall_concave_tl'></div>"); 
      }
      if(nw[5] && !nw[4]) {
	this.$el.append("<div class='wall wall_concave_tr'></div>"); 
      }
      if(nw[3] && !nw[2]) {
	this.$el.append("<div class='wall wall_concave_l'></div>"); 
      }
      if(nw[3] && !nw[4]) {
	this.$el.append("<div class='wall wall_concave_r'></div>"); 
      }
      if(!nw[5] && nw[4]) {
	this.$el.append("<div class='wall wall_concave_br'></div>"); 
      }
      if(!nw[1] && nw[2]) {
	this.$el.append("<div class='wall wall_concave_bl'></div>"); 
      }

      if (true) {

	if(!nw[0] && !nw[1]) { 
	  this.$el.append("<div class='wall wall_convex_tr'></div>"); 
	}
	if(!nw[1] && !nw[2]) {
	  this.$el.append("<div class='wall wall_convex_r'></div>"); 
	}
	if(!nw[2] && !nw[3]) {
	  this.$el.append("<div class='wall wall_convex_br'></div>"); 
	}
	if(!nw[3] && !nw[4]) { 
	  this.$el.append("<div class='wall wall_convex_bl'></div>"); 
	}
	if(!nw[4] && !nw[5]) {
	  this.$el.append("<div class='wall wall_convex_l'></div>"); 
	}
	if(!nw[5] && !nw[0]) {
	  this.$el.append("<div class='wall wall_convex_tl'></div>"); 
	}
      }
    }
    this.$el.css(cellPosToScreenPos(this.model.get("x"),this.model.get("y"))); //*2)*36});
  }
});

var FieldView=Backbone.View.extend({
  initialize:function(){
    var self=this;
    this.cells=this.model.map(function(cellModel){
      return new CellView({
	model:cellModel,fieldModel:self.model});
    });
  },
  render:function(){
    var self=this;
    console.log("render");
    _.each(this.cells,function(cell){
      cell.render();
      $(self.el).append(cell.el);
    });
  }
});

var EntityView=Backbone.View.extend({
  tagName:"div",
  className:"entity",
  render:function() {
    var self=this;
    var index=0;
    this.$el.css(cellPosToScreenPos(this.model.get("x"),this.model.get("y")));
    this.$el.addClass(this.model.get("klass"));
    // FIXME: won't be removed on removal of view !
    setInterval(function() {
      self.$el.removeClass("anim"+index);
      index=(index+1)%8;
      self.$el.addClass("anim"+index);
    },100);
  }
});

var EntitiesView=Backbone.View.extend({
  render:function() {
    var self=this;
    this.model.each(function(entity) {
      var v=new EntityView({model:entity});
      v.render();
      self.$el.append(v.el);
    });
  },
  tick:function() {

  }
});


$(function() {
  var w,h;
  w=h=16;
  var cells=[];

  for(var i=0;i<w*h;i++)
  {
    var x=i%w,y=Math.floor(i/w);
    cells.push(new Cell({x:x,y:y,wall:!(x>3 && x<10 && y>3 && y<7)}));
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
  entities.add(new Entity({klass:"fire",x:6,y:5}));
  entities.add(new Entity({klass:"gold_small",x:5,y:5}));
  var world=new World({field:field,entities:entities});

  var entitiesView=new EntitiesView({el:"#field",model:entities});
  entitiesView.render();

  setInterval(function() {
    entitiesView.tick();
  },50);
});
