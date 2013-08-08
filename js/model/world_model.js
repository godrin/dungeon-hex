var World=Backbone.Model.extend({
  initialize:function() {
    this.get("levels").at(0).get("entities").getPlayer().on("change:z",this.setCurrentLevel,this);
  },
  setCurrentLevel:function(player) {
    this.set("currentLevel",player.get("z"));
  },
  currentLevel:function() {
    var levels=this.get("levels");
    var currentLevel=this.get("currentLevel");
    return levels.at(currentLevel);
  }
});

