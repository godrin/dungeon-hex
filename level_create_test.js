$(function() {
  if(true) {
    var world=createWorld({w:64,h:32,d:4});
    world=_.map(world,function(level) { 
      return level.join("\n");
    });
    world=world.join("\n------------------------\n");
    $("#level").html(world);
  } else { 
    $("#level").html(createLevel({w:64,h:32}).join("\n"));
  }
});
