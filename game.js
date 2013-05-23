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
    var neighbors=this.neighborDelta[x%2];
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

var CellView=Backbone.View.extend({
  tagName:"div",
  initialize:function(){
  },
  render:function(){

    var ns=this.model.neighbors(this.options.fieldModel);

    //$(this.el).html(this.model.get("wall")?"W":"0");
    this.$el.addClass("tile");
    this.$el.attr({x:this.model.get("x"),y:this.model.get("y")});
    if (this.model.get("wall"))
      this.$el.addClass("floor"+Math.floor(Math.random()*6));
    this.$el.css({left:this.model.get("x")*54,
      top:((this.model.get("x")%2)+this.model.get("y")*2)*36});
      //console.log("DING!");
  }
});

var FieldView=Backbone.View.extend({
  initialize:function(){
    var self=this;
    //console.log("init");
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
      // console.log("cell",cell,self.el);
      $(self.el).append(cell.el);
    });
    //$(this.el).html("fgfh");
  }
});


$(function() {
  var w,h;
  w=h=16;
  var cells=[];

  for(var i=0;i<w*h;i++)
  {
    var x=i%w,y=Math.floor(i/w);
    cells.push(new Cell({x:x,y:y,wall:(x>3 && x<7 && y>3 && y<7)}));
  }

  var field=new Field(cells);
  field.w=w;
  field.h=h;
  var fieldView=new FieldView({el:"#field",model:field});
  fieldView.render();

  //  alert("G");
});
