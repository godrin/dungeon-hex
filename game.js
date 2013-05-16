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
    $(this.el).html(this.model.get("wall")?"W":"0");
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
    var self=this;
    console.log("render");
    _.each(this.cells,function(cell){
      cell.render();
      console.log("cell",cell,self.el);
      $(self.el).append(cell.el);
    });
    //$(this.el).html("fgfh");
  }
});


$(function() {
  var w,h;
  w=h=3;
  var cells=[];
  for(var i=0;i<w*h;i++)
    cells.push(new Cell({x:i%w,y:Math.floor(i/w),wall:(i%2==0)}));
  var field=new Field(cells);
  var fieldView=new FieldView({el:"#field",model:field});
  fieldView.render();

  //  alert("G");
});
