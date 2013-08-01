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


