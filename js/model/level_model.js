var Level=Backbone.Model.extend({
  initialize:function() {
    $(window).focus(_.bind(this.animate,this));
    $(window).blur(_.bind(this.stop,this));

    this.animate();
  },
  findStairs:function(dir) {
    console.log("CCCC",this);
    return this.get("field").findWhere({stairs:(dir>0?"down":"up")});
  },
  stop:function() {
    console.log("STOP");
    document.title="Dungeon - PAUSED";
    if(this.animation) {
      clearInterval(this.animation);
      this.animation=null;
    }
    if(this.advance) {
      clearInterval(this.advance);
      this.advance=null;
    }
  },
  tick:function() {
    console.log("WORLD.tick");
    this.get("entities").advance();
  },
  animate:function() {
    document.title="Dungeon";
    if(this.animation)
      return;
    var self=this;
    this.animation=setInterval(function() {
      self.get("entities").animate();
    },100);
    if(false)
      this.advance=setInterval(function() {
	self.tick();
      },1000);

      var body=$("body")[0];

      var element = document.getElementById("game");
      if (element.requestFullScreen) {
	element.requestFullScreen();
      } else if (element.mozRequestFullScreen) {
	element.mozRequestFullScreen();
      } else if (element.webkitRequestFullScreen) {
	console.log("REQUEST.... FULLSCREEN");
	var res=element.webkitRequestFullScreen();
	console.log("RES",res);
      }
  }
});


