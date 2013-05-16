var Cell=Backbone.Model.extend({
});

var Field=Backbone.Collection.extend({
  model:Cell
});




$(function() {
  var w,h;
  w=h=32;
  var cells=[];
  for(var i=0;i<w*h;i++)
    cells.push(new Cell());
  var field=new Field(cells);




//  alert("G");
});
