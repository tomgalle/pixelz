(function() {


	var pixelsize = '4'
	var pixel = $('.pixel');
	var score = 0;


	randompixel();


	function randompixel() {

		var posx = (Math.random() * ($(document).width() - pixelsize )).toFixed();
		var posy = (Math.random() * ($(document).height() - pixelsize )).toFixed();

		pixel.css({	
			'position':'absolute',
			'top': posy + 'px',
			'left': posx + 'px'
		});

	}

	pixel.on("click", function(){
		randompixel();
		score ++;
		console.log(score);
		$('.counter').html(" " + score);

	});


})();
