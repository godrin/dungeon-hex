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


