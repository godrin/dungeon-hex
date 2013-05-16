var Cell=Backbone.Model.extend({
});

var Field=Backbone.Collection.extend({
  model:Cell
});

var CellView=Backbone.View.extend({
  tagName:"div",
  initialize:function(){
  },
  render:function(){
  $(this.el).html("blabla");
  //console.log("DING!");
  }
});

var FieldView=Backbone.View.extend({
  initialize:function(){
    console.log("init");
    this.cells=this.model.map(function(cellModel){
    return new CellView({
    model:cellModel});
    });
  },
  render:function(){
    console.log("render");
    _.each(this.cells,function(cell){
    cell.render();
    console.log("cell",cell);
    $(this.el).append(cell.el);
    });
    //$(this.el).html("fgfh");
  }
});


$(function() {
  var w,h;
  w=h=3;
  var cells=[];
  for(var i=0;i<w*h;i++)
    cells.push(new Cell({x:i%w,y:Math.floor(i/w)}));
  var field=new Field(cells);
  var fieldView=new FieldView({el:"#field",model:field});
  fieldView.render();
  
  //  alert("G");
});
