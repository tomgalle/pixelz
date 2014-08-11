(function() {

	// var canvas = document.getElementById("canvas"),
	// 	ctx = canvas.getContext("2d"),
	// 	cursor = $('cursor'),
	// 	windowWith = $(window).width(),
	// 	windowHeight = $(window).height(),
	// 	floor = Math.floor;


	// 	console.log(windowHeight);



	var pixelsize = '2'
	var pixel = $('.pixel')

	var posx = (Math.random() * ($(document).width() - pixelsize )).toFixed();
	var posy = (Math.random() * ($(document).height() - pixelsize )).toFixed();


	function randompixel() {
		pixel.css({	
			'position':'absolute',
			'top': posy + 'px',
			'left': posx + 'px'
		});

	}
	randompixel();






})();
