var StatsView=Backbone.View.extend({
  el:"#inventory .numbers",
  templateEl:"#numbersTemplate",
  attributes:["hp","exp","x","y","z"],
  initialize:function() {
    this.listenTo(this.model,"change",this.render);
    this.render();
  },
  render:function() {
    if(!this.template)
      this.template=$(this.templateEl).html();
    this.$el.html(Mustache.render(this.template,this.present(this.model.toJSON())));
  },
  present:function(m) {
    var r=_.map(this.attributes,function(attribute){return {id:attribute,name:attribute,value:Math.floor(m[attribute])};});
    for(var key in m.inventory) {
      r.push({id:key,name:key,value:m.inventory[key]});
    }
    return {values:r};
  }
});


