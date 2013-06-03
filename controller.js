function Controller(ops) {

  this.keymap = {
    38 : {
      y : -1
    },
    40 : {
      y : 1
    },
    39 : {
      x : 1
    },
    37 : {
      x : -1
    },
    72 : {
      x : -1
    },
    76 : {
      x : 1
    },
    74 : {
      y : 1
    },
    75 : {
      y : -1
    },
    89 : {
      x : -1,
      y : -1
    },
    90 : {
      x : -1,
      y : -1
    },
    66 : {
      x : -1,
      y : 1
    },
    78 : {
      x : 1,
      y : 1
    },
    85 : {
      x : 1,
      y : -1
    },
    60 : {
      z : 1
    },
    62 : {
      z: -1
    }
  };

  $.extend(this, ops);
  var self = this;

  this.move = function(by) {
    console.log("moved by: ",by)
    //player(by);
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
