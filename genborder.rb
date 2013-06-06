#!/usr/bin/env ruby

files=
[
"void-ne.png",
"void-ne-se.png",
"void-ne-se-s.png",
"void-n-ne.png",
"void-n-ne-se.png",
"void-n.png",
"void-nw-n-ne.png",
"void-nw-n.png",
"void-nw.png",
"void.png",
"void-se.png",
"void-se-s.png",
"void-se-s-sw.png",
"void-s.png",
"void-s-sw-nw.png",
"void-s-sw.png",
"void-sw-nw-n.png",
"void-sw-nw.png",
"void-sw.png"
]


File.open("void.css","w"){|f|
 files.each{|n|
    
    f.puts ".void_"+n[5..-5].gsub("-","_")+" {"
    f.puts " background-image:url(/usr/share/games/wesnoth/1.10/data/core/images/terrain/void/"+n+");"
    f.puts "}"
 }
}


