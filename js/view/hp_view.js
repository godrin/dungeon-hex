var HpView=Backbone.View.extend({
  tagName:"div",
  className:"entity_hp",
  initialize:function() {
    this.listenTo(this.model,"change:hp",this.render);
    this.listenTo(this.model,"change:maxHp",this.render);
    this.render();
  },
  render:function() {
    var brick=this.$(".brick");
    if(this.model.get("hp")<=0) {
      this.remove();
      return;
    }
    if(brick.length==0) {
      brick=$("<div class='brick'>&nbsp;</div>");
      brick.appendTo(this.$el);
    }
    var p=this.model.get("hp")/this.model.get("maxHp");
    brick.css({width:Math.floor(100*p)+"%",
      backgroundColor:"rgb("+Math.floor(255-p*255)+","+Math.floor(p*255)+",0)"
    });
  }
});


