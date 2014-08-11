$(function(){
  var socket = io.connect(window.location.hostname);
  var windowWidth = $(window).width(), windowHeight = $(window).height();
  var $cursor = $("#cursor");
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  var win_zone = 10;
  var colors = "red purple blue".split(" ");

  var floor     = Math.floor,
      random    = Math.random,
      abs       = Math.abs,
      sqrt      = Math.sqrt,
      max       = Math.max,
      min       = Math.min,
      pow       = Math.pow,
      rand      = function(n)     { return floor(random()*n); },
      distance  = function(e,x,y) { return sqrt(pow(x-e.x,2) + pow(y-e.y,2)); },
      choice    = function(list)  { return list[rand(list.length)]; },
      another   = function(list,skip) {
        var it = skip;
        while (it == skip) {
          it = choice(list);
        }
        return it;
      };

  var Pixel = {
    
    // Initialize the game and bind basic events
    'init': function(){
      $(window).bind('mousemove', Pixel.events.move);
      $(window).bind(Pixel.utils.touchTest ? 'touchstart' : 'click', Pixel.events.click);
      $("#renege").bind('click', Pixel.events.renege);
      document.onselectstart = function() { return false; };
      Pixel.login.init();
    },
    
    // Entering a username
    'login': {
      
      // If it's the first time playing, display the modal to enter a username.
      // Otherwise, join the game with the previously defined username.
      'init': function(){
        if (Pixel.utils.localStorageTest && localStorage['username']) {
          Pixel.player.name = localStorage['username'];
          Pixel.login.done();
        } else {
          $(".modal,#curtain").fadeIn();
          $("#username").keydown(function(e){
            if (e.keyCode === 13)
              Pixel.login.set();
          });
          $("#send-username").click(Pixel.login.set);
        }
      },
      
      // Set the username from form input
      'set': function(){
        var username = $("#username").val().replace(/[<>&]/g,"").replace(/^\s+/,"").replace(/\s+$/,"");
        if (username.length && username !== "ENTER YOUR NAME") {
          Pixel.send.join();
          if (Pixel.utils.localStorageTest) {
            localStorage['username'] = username;
          }
          Pixel.player.name = username;
          $(".modal,#curtain").fadeOut();
          Pixel.login.done();
        }
      },
      
      // Ready to go; join a game and start playing.
      'done': function(){
        $("#you_name").html(Pixel.player.name);
        Pixel.send.join();
        Pixel.mouse.animate();
        Sound.activate();
      }
    },
    
    // Events triggered by user input.
    'events': {
    
      // Player moves mouse.
      'move': function(e){
        if (distance(Pixel.p, e.pageX, e.pageY) < win_zone) {
          $("body").addClass("near");
        } else {
          $("body").removeClass("near");
        }
        Pixel.mouse.x = e.pageX;
        Pixel.mouse.y = e.pageY;
      },
      
      // Player clicks on something.
      'click': function(e){
        var x, y;
        if (Pixel.utils.touchTest) {
            x = e.touches[0].pageX;
            y = e.touches[0].pageY;
            Pixel.send.mouse(x, y);
        } else {
            x = e.x ? e.x : e.clientX;
            y = e.y ? e.y : e.clientY;
        }
        Pixel.send.click(x,y);
        Sound.play('click');
      },
      
      // Player starts a new game
      'renege': function(e){
        $("#cursor").css({
          "top": -9999,
          "left": -9999
        });
        $("#opponent_name,#opponent_score").hide();
        Pixel.opponent.name = "";
        $(window).trigger("share-set", ["help me find the pixel"]);
        Pixel.send.renege();
      }
    },

    // Receiving messages from the server.
    'receive': {
    
      // Another player joins.
      'join': function(data){
        Pixel.canvas.reset(data);
        Pixel.canvas.plot(data);
        Pixel.scores.init(data);
        Pixel.cursor.recolor();
        Sound.play('join');
      },
      
      // Another player leaves.
      'part': function(data){
        if (data.id === Pixel.opponent.id) {
          $("#cursor").css({
            "top": -9999,
            "left": -9999
          });
          Pixel.msg.say(Pixel.opponent.name + " has left the game");
          $("#opponent_name,#opponent_score").hide();
          Pixel.opponent.name = "";
          $(window).trigger("share-set", ["help me find the pixel"]);
        }
      },

      // Game starts.
      'start': function(data){
        Pixel.canvas.reset(data);
        Pixel.canvas.plot(data);
      },

      // Someone found the pixel.
      'found': function(data){
        Pixel.canvas.plot(data);
        Pixel.scores.win(data);
      },
      
      // Another player's mouse moved.
      'mouse': function(data){
        Pixel.cursor.move(data);
      }
    },
    
    // Sending messages to the server
    'send': {
    
      // Joining the game (done on init)
      'join': function(){
        socket.emit('join', JSON.stringify({
          'name': Pixel.player.name,
          'w': windowWidth,
          'h': windowHeight
        }));
      },
      
      // Sending a mouse movement
      'mouse': function(x,y){
        socket.emit('mouse', JSON.stringify({
          'x': x,
          'y': y,
          'w': windowWidth,
          'h': windowHeight
        }));
      },
      
      // Sending a click event
      'click': function(x,y){
        socket.emit('click', JSON.stringify({
          'x': x - Pixel.canvas.left,
          'y': y - Pixel.canvas.top
        }));
      },
      
      // Sending a new game event
      'renege': function(){
        socket.emit('renege', JSON.stringify({
          'name': Pixel.player.name,
          'w': windowWidth,
          'h': windowHeight
        }));
      }
    },
    
    // Setting up the canvas and drawing a dot
    'canvas': {
      'width': 0,
      'height': 0,
      'top': 0,
      'left': 0,
      



      // Set the canvas dimensions, and center it
      'reset': function(data){
        Pixel.canvas.width = canvas.width = data.w;
        Pixel.canvas.height = canvas.height = data.h;
        Pixel.canvas.top = floor((windowHeight - data.h) / 2)
        Pixel.canvas.left = floor((windowWidth - data.w) / 2)
        $(canvas).css({
          "top": Pixel.canvas.top,
          "left": Pixel.canvas.left
        });
      },
      
      // Clear the canvas and draw the pixel
      'plot': function(data){
        Pixel.p.x = data.x + Pixel.canvas.left;
        Pixel.p.y = data.y + Pixel.canvas.top;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "black";
        ctx.fillRect(data.x, data.y, 1, 1);
        ctx.fill();
      }
    },
    










    // Player model
    'player': {
      'id': 0,
      'name': "",
      'score': 0
    },
    
    // Opponent model
    'opponent': {
      'id': 0,
      'name': "",
      'score': 0,
      'color': ""
    },
    
    // Pixel position
    'p': {
      'x': 0,
      'y': 0
    },
    
    // User's mouse movements
    'mouse': {
      'x': 0,
      'y': 0,
      'oldx': 0,
      'oldy': 0,
      'iter': 0,
      
      // Tell the server the new mouse position
      'update': function(){
        if (Pixel.mouse.x !== Pixel.mouse.oldx &&
            Pixel.mouse.y !== Pixel.mouse.oldy) {
          Pixel.mouse.oldx = Pixel.mouse.x;
          Pixel.mouse.oldy = Pixel.mouse.y;
          Pixel.send.mouse(Pixel.mouse.x, Pixel.mouse.y);
        }
      },
      
      // Throttle mouse movement updates based on the animation loop
      'animate': function(){
        requestAnimFrame(Pixel.mouse.animate);
        if (!(Pixel.mouse.iter++ % 3))
          Pixel.mouse.update();
      }
    },

    // Opponent's cursor
    'cursor': {
    
      // Move the opponent's cursor and check if it's near the pixel
      'move': function(data){
        data = JSON.parse(data);
        var x = parseInt((windowWidth - data.w) / 2 + data.x, 10);
        var y = parseInt((windowHeight - data.h) / 2 + data.y, 10);
        if (x && y) {
          if (distance(Pixel.p, x, y) < win_zone) {
            $("#cursor").addClass("near");
          } else {
            $("#cursor").removeClass("near");
          }
          
          $("#cursor").css({
            "top": y,
            "left": x
          });
        }
      },
      
      // Change the opponent's cursor color
      'recolor': function(){
        Pixel.opponent.color = another(colors, Pixel.opponent.color);
        $("#cursor")[0].className = Pixel.opponent.color;
      }
    },

    // Current scores display
    'scores': {
    
      // Reset the scores when a player joins
      'init': function(data){
        if (data.id) Pixel.player.id = data.id;
        $("#opponent_name,#opponent_score").hide();
        for (var id in data.names) {
          if (id === Pixel.player.id)
            continue;
          Pixel.opponent.id = id;
          Pixel.opponent.name = data.names[id];
          $("#opponent_name").html(data.names[id]);
          $("#opponent_name,#opponent_score").show();
          Pixel.msg.say(data.names[id] + " has joined the game!");
          $(window).trigger("share-set", ["i'm playing where's the pixel with " + data.names[id].substr(0,20)]);
        }
        Pixel.player.score = 0;
        Pixel.opponent.score = 0;
        $("#you_score").html("0");
        $("#opponent_score").html("0");
      },
      
      // Someone found the pixel!
      'win': function(data){
        if (data.id) Pixel.player.id = data.id;
        var winner, loser, winner_score_div, winner_score;
        if (data.winner === Pixel.player.id) {
          winner = Pixel.player.name.substr(0,20);
          loser = Pixel.opponent.name.substr(0,20);
          winner_score_div = "#you_score";
          winner_score = Pixel.player.score += 1;
          Sound.play('win');
        } else {
          winner = Pixel.opponent.name;
          loser = Pixel.player.name;
          winner_score_div = "#opponent_score";
          winner_score = Pixel.opponent.score += 1;
          Pixel.cursor.recolor();
          Sound.play('lose');
        }
        $(winner_score_div).html(winner_score);
        Pixel.msg.win(winner, loser);
      }
    },
    
    // "Win" message underneath the logo
    'msg': {
    
      // Someone found the pixel!
      'win': function (winner, loser) {
        var message;
        if (Pixel.opponent.name === "") {
          message = choice(win1p);
        } else {
          message = choice(win2p).replace("WINNER", winner).replace("LOSER", loser)
        }
        Pixel.msg.say(message);
        $("share").show();
      },
      
      // Update the message and fade it out after a delay
      'say': function (msg) {
        $("msg").html(msg);
        $("msg").stop().css("opacity", "1.0").delay(4000, function(){ $("msg").fadeOut(5000) });
      }
    },
    
    // HTML5/tablet tests
    'utils': {
      touchTest: 'ontouchstart' in window,
      socketTest: 'WebSocket' in window,
      localStorageTest: 'localStorage' in window
    }
  };

  // Bind events from the server
  socket.on('event-join', Pixel.receive.join);
  socket.on('event-names', Pixel.receive.names);
  socket.on('event-part', Pixel.receive.part);
  socket.on('event-start', Pixel.receive.start);
  socket.on('event-found', Pixel.receive.found);
  socket.on('event-mouse', Pixel.receive.mouse);
  socket.on('event-gameover', Pixel.receive.gameover);

  window.requestAnimFrame = (function(){
    return window.requestAnimationFrame       || 
           window.webkitRequestAnimationFrame || 
           window.mozRequestAnimationFrame    || 
           window.oRequestAnimationFrame      || 
           window.msRequestAnimationFrame     || 
           function( callback ){
             window.setTimeout(callback, 1000 / 60);
           };
  })();

  // Talking to Soundmanager and playing sounds
  var Sound = {
    'ready': false,
    'muted': false,
    'active': false,
    'path': "/audio/",
    
    // Sound object defaults
    'defaults': {
      'autoLoad': true,
      'autoPlay': false,
      'volume': 90
    },
    
    // Initialize Soundmanager2
    'init': function(){
      soundManager.url = '/swf/';
      soundManager.flashVersion = 9;
      soundManager.useFlashBlock = false;
      soundManager.onready(Sound.load);
      $("#mute").click(Sound.toggle);
    },
    
    // Game has started; ready to play sounds
    'activate': function(){
      Sound.active = true;
    },
    
    'toggle': function(){
      if (Sound.muted) {
        $("#mute").html("mute");
        Sound.muted = false;
      } else {
        $("#mute").html("unmute");
        Sound.muted = true;
      }
    },

    // Set up the Soundmanager sound objects
    'load': function(){
      for (key in Sound.data) {
        for (var i = 0; i < Sound.data[key].length; i++) {
          var obj = $.extend({}, Sound.data[key][i], Sound.defaults);
          obj.id = key + i;
          obj.url = Sound.path + obj.url;
          Sound.data[key][i] = soundManager.createSound(obj);
        }
      }
      Sound.ready = true;
    },

    // Play a sound
    'play': function(key){
      if (! Sound.ready || ! Sound.active || Sound.muted) return;
      choice(Sound.data[key]).play();
    },

    // Lists of sounds that will be chosen at random when an event fires
    'data': {
      'join': [
        { 'url': "ENTERING/enter0.wav" },
        { 'url': "ENTERING/enter1.wav" }
      ],
      'click': [
        { 'url': "MISFIRING/misfire0.wav" },
        { 'url': "MISFIRING/misfire1.wav" },
        { 'url': "MISFIRING/misfire2.wav" },
        { 'url': "MISFIRING/misfire3.wav" },
        { 'url': "MISFIRING/misfire4.wav" },
        { 'url': "MISFIRING/misfire5.wav" }
      ],
      'win': [
        { 'url': "WINNING/win0.wav" },
        { 'url': "WINNING/win1.wav" },
        { 'url': "WINNING/win2.wav" },
        { 'url': "WINNING/win3.wav" },
        { 'url': "WINNING/win4.wav" },
        { 'url': "WINNING/win5.wav" }
      ],
      'lose': [
        { 'url': "WINNING/lose0.wav" },
        { 'url': "WINNING/lose1.wav" },
        { 'url': "WINNING/lose2.wav" },
        { 'url': "WINNING/lose3.wav" },
        { 'url': "WINNING/lose4.wav" },
        { 'url': "WINNING/lose5.wav" },
        { 'url': "WINNING/lose6.wav" },
        { 'url': "WINNING/lose7.wav" },
        { 'url': "WINNING/lose8.wav" },
        { 'url': "WINNING/lose9.wav" }
      ]
    }
  };

  // Opening a window to share on Facebook and Twitter
  var Share = {
    'url': "http://wheresthepixel.com/",
    'msg': "help me find the pixel ",
    'init': function(){
      $("#twitter-invite").bind("click", Share.twitterinvite);
      $("#twitter").bind("click", Share.twitter);
      $(window).bind("share-set", Share.set);
    },
    'set': function(e, msg) {
      Share.msg = msg;
    },
    'openLink': function (url) {
      window.open(url, "_blank");
    },
    'facebook': function () {
      var url = "http://www.facebook.com/share.php?u=" + encodeURIComponent(Share.url) + "&t=" + encodeURIComponent(Share.msg);
      Share.openLink(url);
      return false;
    },
    'twitter': function () {
      var url = "http://twitter.com/home?status=" + encodeURIComponent(Share.msg + " " + Share.url);
      Share.openLink(url);
      return false;
    },
    'twitterinvite': function () {
      var url = "http://twitter.com/home?status=" + encodeURIComponent("help me find the pixel " + Share.url);
      Share.openLink(url);
      return false;
    }
  };
  
  Sound.init();
  Share.init();
  Pixel.init();
});