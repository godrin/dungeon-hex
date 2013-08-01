var CellView=Backbone.View.extend({
  tagName:"div",
  initialize:function(){
    this.listenTo(this.model,"change",this.render);
    var self=this;
    _.each(this.model.neighbors(this.options.fieldModel),function(neighbor) {
      if(neighbor) {
	//console.log("nei",neighbor);
	self.listenTo(neighbor,"change",self.render);
      }
    });
  },
  render:function(){
    var self=this;
    var blendType="void"; //fog";

    var klasses=[]

    this.$el.addClass("tile");
    this.$el.css(modelToScreenPos(this.model));

    this.$el.attr({x:this.model.get("x"),y:this.model.get("y"),cid:this.model.cid});

    if (!this.model.get("wall") && !this.model.get("door")) {
      this.$el.addClass("var"+(this.model.get("variance")%6));
      this.$el.addClass("floor");
    } else {
      var wklasses=[];
      var ns=this.model.neighbors(this.options.fieldModel);
      var nw=_.map(ns,function(n) {
	return (!n || (n.get("wall")||n.get("door")));
      });
      var v=_.map(ns,function(n) {
	return n && n.get("visited");
      });
      if(v[2] && nw[1] && !nw[2]) 
	wklasses.push('concave_tl'); 
      if(v[3] && nw[5] && !nw[4]) 
	wklasses.push('concave_tr'); 
      if(nw[3] && !nw[2]) 
	wklasses.push('concave_l'); 
      if(nw[3] && !nw[4]) 
	wklasses.push('concave_r'); 
      if(!nw[5] && nw[4]) 
	wklasses.push('concave_br'); 
      if(!nw[1] && nw[2]) 
	wklasses.push('concave_bl'); 

      // convex
      if(!nw[0] && !nw[1]) 
	wklasses.push('convex_tr'); 
      if(v[2] && !nw[1] && !nw[2]) 
	wklasses.push('convex_r'); 
      if(v[2] && !nw[2] && !nw[3]) 
	wklasses.push('convex_br'); 
      if(v[3] && !nw[3] && !nw[4])  
	wklasses.push('convex_bl'); 
      if(!nw[4] && !nw[5]) 
	wklasses.push('convex_l'); 
      if(!nw[5] && !nw[0]) 
	wklasses.push('convex_tl'); 


      _.each(wklasses,function(k) {
	klasses.push("wall wall_"+k);
	//self.$el.append("<div class='wall wall_"+k+"'></div>"); 
      });

    }
    if (klasses.length>0 || !this.model.get("wall") || true) {
      var blendValue=""; //" half";
      if(!this.model.get("visited"))
	blendValue="";
      if(this.model.get("visited")) {
	var ns=this.model.neighbors(this.options.fieldModel);

	var names=["n","ne","se","s","sw","nw"];
	var bnw=_.map(ns,function(n,iter) {
	  if(!n || !(n.get("visited"))) {
	    return names[iter];
	  }
	});
	bnw=_.filter(bnw,function(n) { return n;});
	var str=bnw.join("_");
	if(str!="") {
	  klasses.push(blendType+" "+blendType+"_"+str+blendValue);
	}
      } 
      if(!this.model.get("visited")) {
	klasses.push(blendType+" "+blendType+"_"+blendValue);
      }
    }
    if(this.model.get("stairs")=="down") {
      klasses.push("entity stairs_down");
    } else if(this.model.get("stairs")=="up") {
      klasses.push("entity stairs_up");
    }
    if(this.model.get("door")) {
      console.log("NW",nw);
      if(!nw[0] && !nw[3])  {
	//klasses.push("door door_n");
	//klasses.push("wall wall_concave_tl left_door"); 
	//klasses.push("wall wall_concave_tr right_door"); 
	klasses.unshift("floor door_floor");
	klasses.push("door door_open_n");
      } else {
	klasses.push("door door_v");
      }
    }
    this.$el.empty();
    _.each(klasses,function(k) {
      self.$el.append("<div class='"+k+"'></div>"); 
    });



  }
});


