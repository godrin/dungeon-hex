function Controller(ops) {

  this.keymap = {
    103 : {
      y : -1,
      x : -1
    },
    104 : {
      y : -1
    },
    105 : {
      y : -1,
      x : 1
    },
    97 : {
      y : -1,
      x : 1
    },
    98 : {
      y : -1
    },
    99 : {
      y : 1,
      x : 1
    }
  };

  $.extend(this, ops);
  var self = this;

  this.move = function(by) {
    console.log("moved by: ",by);
    player.move(by);
  }

  this.init = function() {
    $(window).bind("keydown", function(ev) {
      console.log("EV ", ev, ev.keycode);

      var by = self.keymap[ev.keyCode];
      if (by) {
	self.move(by);
      }
    });

  };
}
