var WorldView=Backbone.View.extend({
  initialize:function() {
    this.player=this.model.currentLevel().get("entities").getPlayer();
    this.listenTo(this.player,"change:z",this.render);
  },
  render:function() {
    var level=this.model.currentLevel();
    var self=this;

    if(this.fieldView)
      this.fieldView.remove();
    if(this.entitiesView)
      this.entitiesView.remove();

    if($("#field").length==0) {
      $("#world").html('<div id="field"><div id="world_bg"></div></div>');
    }
    var entities=level.get("entities");
    var field=level.get("field");

    self.fieldView=new FieldView({el:"#field",model:field,player:self.player});
    self.fieldView.render();
    self.entitiesView=new EntitiesView({el:"#field",model:entities});
    self.entitiesView.render();
    var levelView=new LevelView({el:"#field",model:level});

    if(!this.soundView)
      this.soundView=new SoundView({model:entities,player:this.player});
    this.soundView.setModel(entities);
  }
});


