var Entity=Backbone.Model.extend({
  initialize:function() {
    var self=this;
    // animations
    if(this.get("anim")) {
      self.set({frameIndex:0});
    }
    this.bindCheckVisibility();
  },
  variant:function() {
    if(this.get("variants")) {
      var v=this.get("variance")%this.get("variants");
      return v;
    }
  },
  animTick:function() {
    var anim=this.get("anim");
    if(anim) {
      var c=this.get("frameIndex");
      this.set("frameIndex",(c+1)%anim.frames);
    } else {
      var tempAnim=this.get("currentAnim");
      if(tempAnim && tempAnim.frames) {
	var c=this.get("frameIndex");
	c+=1;
	if(c>=tempAnim.frames) {
	  c=0;
	  this.set("currentAnim",null);
	}
	this.set("frameIndex",c);
      }
    }
  },
  setAnimation:function(type) {
    type=_.extend({name:type},this.get(type));
    this.set({frameIndex:0,currentAnim:type});
  },
  tick:function() {
  },
  moveVertical:function(dir) {
    var nz=this.get("z")+dir;
    this.get("level").get("entities").remove(this);
    console.log("mvoeVertical",dir,this);
    //
    var world=this.get("level").get("world");
    var nlevel=world.get("levels").at(nz);
    nlevel.get("entities").add(this);
    var stairs=nlevel.findStairs(-dir);
    this.set({level:nlevel});
    // this triggers repaint
    this.set(_.extend({z:nz},positionFrom(stairs)));
  },
  moveBy:function(by) {
    var self=this;
    if(by>=0) {
      if(this.get("hp")>0) {
	var field=this.get("level").get("field"); 
	var currentCell=field.getByPosition(positionFrom(this));
	var neighborCells=currentCell.neighbors(field);
	var cell=neighborCells[by];
	if(by==6 && currentCell.get("stairs")=="up") {
	  this.moveVertical(-1);	   
	} else if(by==7 && currentCell.get("stairs")=="down") {
	  this.moveVertical(1);	   
	}
	if(cell && !cell.get("wall")) {
	  var npos=positionFrom(cell);
	  var other=this.get("level").get("entities").where(npos);
	  var nonpassable=_.select(other,function(e) { return !e.get("passable");});
	  if(nonpassable.length>0) {
	    if(this.attack) {
	      this.attack(nonpassable[0]);

	    }
	    console.log("OTHER "+other+" "+by);
	  } else {

	    _.each(other,function(entity) {
	      if(self.collect)
		self.collect(entity);
	    });
	    // move to next position
	    this.unbindCheckVisibility();
	    this.set(npos);
	    this.bindCheckVisibility();

            if(this.restMoving)
              this.restMoving();
          }
        }
      }
    }
  },
  getCell:function() {
    var field=this.get("level").get("field"); 
    return field.getByPosition(positionFrom(this));
  },
  bindCheckVisibility:function() {
    this.checkVisibility(this.getCell());
    this.getCell().on("change",this.checkVisibility,this);
  },
  unbindCheckVisibility:function() {
    this.getCell().off("change",this.checkVisibility,this);
  },
  checkVisibility:function(cellModel) {
    if(cellModel.get("visited"))
      this.set({visible:true});
  },
  cellsInView:function(depth) {
    var field=this.get("level").get("field"); 
    var myCell=field.getByPosition(positionFrom(this));
    // first get direct neighbors
    var curNeighbors=_.map(myCell.neighbors(field),function(val,key) {return {v:val,k:key}});
    var allNeighbors=[].concat(curNeighbors);
    while(depth>1) { 
      var nextNeighbors=[];
      depth-=1;
      _.each(curNeighbors,function(neighborPair) {
        var neighbor=neighborPair.v;
        var neighborIndex=neighborPair.k;
        // check if neighbor is transparent, then take next 3 it's direction
        if(neighbor && neighbor.passable()) {
          var ns=neighbor.neighbors(field);
          for(var i=neighborIndex-1;i<neighborIndex+2;i++) {
            var j=(i+6)%6;
            var cn=ns[j];
            nextNeighbors.push({k:i,v:cn});
          }
        }
      });
      curNeighbors=nextNeighbors;
      allNeighbors=allNeighbors.concat(nextNeighbors);
    }
    return _.map(allNeighbors,function(n){return n.v});
  }
});

