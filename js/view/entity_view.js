var EntityView=Backbone.View.extend({
  tagName:"div",
  className:"entity",
  initialize:function() {
    this.listenTo(this.model,"change",this.render);
    this.listenTo(this.model,"destroy",this.remove);
  },
  render:function() {
    var self=this;
    if(!this.model.get("visible"))
      return;
    if(this.$el.attr("cid")==this.model.cid) {
      //animate
      this.$el.stop(true,false).animate(modelToScreenPos(this.model),"fast");
    } else {
      this.$el.css(modelToScreenPos(this.model));
    }
    if(!this.model.get("maxHp") || this.model.get("hp")>0)
      this.$el.addClass(this.model.get("klass"));
    else
      this.$el.removeClass(this.model.get("klass")).addClass("corps");
    if(this.model.variant())
      this.$el.addClass("var"+this.model.variant());
    this.$el.attr("cid",this.model.cid);

    // animate
    var anim=this.model.get("anim");
    var currentAnim=this.model.get("currentAnim");
    if(anim || currentAnim) {
      if(!anim) {
	anim=currentAnim;
	this.$el.addClass(anim.name);
      }
      var f=this.model.get("frameIndex");
      for(var i=0;i<anim.frames;i++) {
	if(i==f)
	  this.$el.addClass("anim"+i);
	else
	  this.$el.removeClass("anim"+i);
      }
    } else {
      var klasses=this.$el.attr("class").split(" ");
      _.each(klasses,function(klass) {
	if(klass.match(/anim.*/))
	  self.$el.removeClass(klass);
      });
    }
    if(this.model.get("maxHp") && !this.brick) {
      this.brick=new HpView({model:this.model});
      this.$el.append(this.brick.el);
      this.brick.render();
    }
    if(false) {
      // display texts
      var text=this.model.get("text");
      if(text) {
	this.$el.html("<div class='speak'>"+text+"</div>");
      }
      else
	this.$el.html("");
    }
  },
  update:function() {

  }
});


