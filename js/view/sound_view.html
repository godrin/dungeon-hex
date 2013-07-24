var SoundView=Backbone.View.extend({
  el:"#fx",
  initialize:function() {
    var self=this;
    this.model.each(function(entity) {
      self.listenTo(entity,"attack",self.attacked);
    });
  },
  setModel:function(model) {
    var self=this;
    this.model=model;
    this.stopListening();
    this.model.each(function(entity) {
      self.listenTo(entity,"attack",self.attacked);
    });
  },
  attacked:function(from,to) {
    var d=distanceModel(from,this.options.player);
    console.log("DDDDD",d,from,to);
    if(d<5) {
      var volume=1-d/5.0;
      volume*=0.5;
      console.log("SOUND",volume);
      $("#fx")[0].volume=volume;
      $("#fx")[0].play();
    }
  }
});


