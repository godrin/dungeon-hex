var MovingEntity=Entity.extend({
  initialize:function() {
    Entity.prototype.initialize.apply(this,arguments);
    this.on("change:hp",this.die,this);
  },
  setText:function(text) {
    var self=this;
    this.set("text",text);
    if(this.textTimeout) {
      clearTimeout(this.textTimeout);
    }
    this.textTimeout=setTimeout(function() {
      self.set("text",null);
    },2000);
  },
  attack:function(whom) {
    var self=this;
    if(whom.get("klass")!=this.get("klass")) {
      if (whom.get("hp")){
	this.setText("Ouch");
	this.setAnimation("animFight");
	whom.setAnimation("animDefend");
	this.trigger("attack",this,whom);
	//$("#fx")[0].play();
	if(whom.get("hp")) {
	  hp=whom.get("hp");
	  if(hp>0){
	    hp-=(this.get("strength")/4)*Math.random();
	    if(hp<=0) {
	      this.set({exp:(this.get("exp")||0)+3});
	    }
	  }
	  if(hp<0){
	    hp=0;
	  }
	  whom.set({hp:hp});
	}
      }
    }
  },
  isDead:function() {
    return this.get("hp")<=0;
  },
  die:function() {
    if(this.isDead()) {
      this.set({passable:true});
      return;
    }
  },
  restMoving:function() {
    if(this.get("hp") && this.get("maxHp")) {
      var healing=this.get("healingSpeed");
      if(!healing)
        healing=0.5;
      console.log("RESTMOVING",this);
      var hp=this.get("hp");
      hp+=healing;
      if(hp>this.get("maxHp"))
        hp=this.get("maxHp");
      console.log("HP",hp);
      this.set("hp",hp);
    }
  }
});


