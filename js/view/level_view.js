var LevelView=Backbone.View.extend({
  initialize:function() {
    var field=this.model.get("field");
    $("#world_bg").css({width:field.w*54+72*2,
      height:field.h*54+72*2})

      var player=this.model.get("entities").getPlayer();
      this.listenTo(player,"change",this.move);
      this.move(player);
  },
  move:function(entity) {
    var pos=modelToScreenPos(entity);
    var t=pos.top-this.$el.height()/2+36;
    var l=pos.left-this.$el.width()/2+36;
    if(this.inited) {
      this.$el.stop(true,false).animate({scrollTop:""+t+"px",
	scrollLeft:""+l+"px"});
    } else {
      l=Math.round(l);
      t=Math.round(t);
      this.$el.scrollTop(t).scrollLeft(l);
      this.inited=true;
    }

  }
});


