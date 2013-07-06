function Controller(ops) {

  this.keymap={104:0,105:1,99:2,98:3,97:4,103:5,
    38:0,33:1,34:2,40:3,35:4,36:5,190:-1};

    $.extend(this, ops);
    var self = this;

    this.move = function(by) {
      if(ops.player)
	ops.player.moveBy(by);
    }

    this.init = function() {
      $(window).bind("keydown", function(ev) {
	console.log("EV ", ev, ev.keyCode);

	var by = self.keymap[ev.keyCode];
	if (typeof(by)!='undefined') {
	  self.move(by);
	  return false;
	}
	if (ev.keyCode==80){
	  inv=ops.player.get("inventory");

	  if (inv["potion"]>=1) {
	    ops.player.set({hp:15});
	    inv["potion"]-=1;
	    ops.player.set({inventory:inv});
	  }
	}
      });

    };
}
