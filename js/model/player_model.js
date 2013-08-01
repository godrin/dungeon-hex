var PlayerModel=MovingEntity.extend({
  initialize:function() {
    MovingEntity.prototype.initialize.apply(this,arguments);
    this.set({visible:true});
    this.on("change",this.changeVisitingStateOfCells,this);
    this.changeVisitingStateOfCells();
  },
  changeVisitingStateOfCells:function() {
  this.cellsInView(2);
    var field=this.get("level").get("field"); 
    var myCell=field.getByPosition(positionFrom(this));
    var lastVisited=field.where({visible:true});
    // first get direct neighbors
    /*
    var neighbors=myCell.neighbors(field);
    var allNeighbors=[];
    _.each(neighbors,function(neighbor,neighborIndex) {
      allNeighbors.push(neighbor);
      // check if neighbor is transparent, then take next 3 it's direction
      if(neighbor && neighbor.passable()) {
	var ns=neighbor.neighbors(field);
	for(var i=neighborIndex-1;i<neighborIndex+2;i++) {
	  var j=(i+6)%6;
	  var cn=ns[j];
	  allNeighbors.push(ns[j]);
	}
      }
    });
    neighbors=allNeighbors;*/
    var neighbors=this.cellsInView(2);

    var currentlyVisiting=[myCell].concat(neighbors);
    var noLongerVisible=_.difference(lastVisited,currentlyVisiting);
    _.each(currentlyVisiting,function(cell) {
      if(cell)
	cell.set({visited:true,visible:true});
    });
    _.each(noLongerVisible,function(cell) {
      if(cell)
	cell.set({visible:false});
    });

  },
  moveBy:function(by) {
    if (this.get("hp") >= 1) {
      Entity.prototype.moveBy.apply(this,[by]); 
      this.get("level").tick();
    }
  },
  collect:function(what) {
    var my=this.get("inventory");
    var o=what.get("inventory");
    _.each(o,function(v,k) {
      if(!my[k])
	my[k]=0;
      my[k]+=v;
    });
    this.trigger("change",this,{changes:{inventory:my}});
    if(what.get("onlyInventory"))
      what.destroy();
  }
});


