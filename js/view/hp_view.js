var HpView=Backbone.View.extend({
  tagName:"div",
  className:"entity_hp",
  initialize:function() {
    this.listenTo(this.model,"change:hp",this.render);
    this.listenTo(this.model,"change:maxHp",this.render);
  },
  render:function() {
    if(this.model.get("hp")<=0) {
      console.log("REMVOE",this.$el);
      this.remove();
      return;
    }
    var brick=this.$(".brick");
    brick.attr("hp",this.model.get("hp")); // debug
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


