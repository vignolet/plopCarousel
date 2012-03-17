/*!
 * plopCarousel (jQuery Plugin)
 * Original author: Yann Vignolet
 * Comments: Yann Vignolet
 * Date : 13/01/2012
 * http://www.yannvignolet.fr
 * Version : 1.2.1
 *
 * Ce plugin affiche en diaporama les images d'un conteneur avec des effets de transition.
 *
 * Depend de la librarie: jQuery
 */
(function($, window, document, undefined) {
	/**
	 * defaults sont les reglages que l'utilisateur peut faire varier
	 * settings sont les variables attachees a chaque carousel
	 *
	 * event 'reloadcarousel' sur le conteneur relancera l'execution du carousel en cas de changement de contenu
	 */
        "use strict";
	var pluginName = "plopCarousel", defaults = {
		delay : 3000, //delais en milliseconde (par defaut 3000)
		mode : "fade", //mode de transition (par defaut fade)
		largeur : undefined, //largeur de l'affichage du carousel
		hauteur : undefined, //hauteur de l'affichage du carousel
		fleche : false, //afficher des flêches pour passe a l'image suivante ou precedente (par defaut false)
		selecteur : false, //afficher une serie de bouton pour passe d'une image a l'autre (par defaut false)
		preload : true, //gestion du prechargement des images (par defaut true)
		legende : null, //affichage ou non d'une legende sur chaque image (par defaut null)
		vignette : false, //ajout une serie de vignette pour passer d'une image a l'autre (par defaut false)
		vignetteHauteur : 50, //hauteur des vignettes (par defaut 50)
		vignetteLargeur : 50, //largeur des vignettes (par defaut 50)
		slidevignette : false, //ajout une serie de vignette pour passer d'une image a l'autre avec un effect de slide horizontal(par defaut false)
		slideVignetteNbr : 4, //nombre de vignettes visible dans le slidevignettes (par defaut 4)
		autoplay : true, //fonction de mise en route des transitions
		easing : 'swing', //easing configurable sur les transitions
		infobulle : false, //Activation des infobulles sur les vignettes
		gestionTouche : true //gestion des touch des tablettes et mobile
	}, settings = {
		nbElement : null, //nombre d'image composant le carousel
		elementCourant : 0, //index de l'image encourt d'execution
		elementPrecedent : null, //index de l'image precèdement executee
		slideMouvementH : 0, //amplitude du mouvement pour l'effet de slide horizontal
		click : false, //indicateur de click de l'utilisateur
		survole : false,
		tempo : null, //temps qui defini le rythme du carousel
		archive : null, //contenu initiale avant changement par ce Plugin
		allCarousel : null, //contient la selection de tout les carousel qui compose la galerie
		update : [], // tableau qui va contenir chaque function de mise a jour des different element active sur le carousel
		touch : []
	}, callback// function passee en argument qui s'executera a chaque fin de transition
	;
	/**
	 *Constructeur
	 *
	 */
	function Plugin(element, options, callback) {
		this.element = element;
		if( typeof callback === 'function') {
			this.callback = callback;
		}
		this.options = $.extend({}, defaults, options, settings);
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	}

	/**
	 * Methode d'initialisation du plugin
	 */
	Plugin.prototype.init = function() {
		var self = this, largeurOrigine = $(self.element).width(), hauteurOrigine = $(self.element).height();
		$(self.element).unbind('stopcarousel');
		$(self.element).unbind('reloadcarousel');
		self.options.archive = $(self.element).html();
		$(self.element).addClass('carouselcontainer loaderCarousel').append('<div class="animationCarousel plopCarousel"></div>');
		$(self.element).find("img").addClass('carousel').appendTo($(self.element).find('.animationCarousel'));
		self.options.allCarousel = $(self.element).find('.carousel');
		if(!self.options.largeur) {
			if($(self.element).width() > 0) {
				self.options.largeur = $(self.element).width();
			}
			else {
				self.error('largeur');
			}
		}

		if(!self.options.hauteur) {
			if($(self.element).height() > 0) {
				self.options.hauteur = $(self.element).height();
			}
			else {
				self.error('hauteur');
			}
		}
		else {
			$(self.element).css({
				'min-height' : $(self.element).height(),
				'height' : 'auto'
			});
		}
		$(self.element).find('.animationCarousel').height(self.options.hauteur).width(self.options.largeur);
		self.options.nbElement = self.options.allCarousel.length;
		self.options.elementPrecedent = self.options.nbElement;
		if(self.options.preload) {
			$(self.element).prepend('<div class="loaderCarouselBar plopCarousel"><div class="loaderCarouselProgress"></div></div>');
			self.precharger_image();
		}
		else {
			self.setCarousel();
		}
		$(self.element).one('reloadcarousel', function(event, callback) {
			event.stopPropagation();
			$(self.element).trigger('stopcarousel');

			if( typeof callback === 'function') {
				self.callback = callback;
			}

			self.options.nbElement = null;
			self.options.elementCourant = 0;
			self.options.elementPrecedent = null;
			self.options.click = false;
			self.options.survole = false;
			self.options.update = [];
			$(self.element).removeClass('carouselcontainer');

			if($(self.element).find(".plopCarousel")) {
				//$(self.element).html(self.options.archive);
				$(self.element).find(".plopCarousel").remove();
			}
			$.extend(self.options, event);
			$(self.element).height(hauteurOrigine).width(largeurOrigine);
			self.init();
		});
		$(self.element).one('stopcarousel', function(event) {
			event.stopPropagation();

			self.options.allCarousel.stop(true, true);
			self.options.tempo = window.clearTimeout(self.options.tempo);
			$(self.element).find('.ePlopCarousel').die('click,touchstart,touchmove,touchend');



		});
	};
	/**
	 * Methode qui verifie le chargement de toutes les images.
	 *
	 */
	Plugin.prototype.precharger_image = function() {
		var self = this, _done = function() {
			self.setCarousel();
			return true;
		}, i = 0, loaderCarouselProgress = 100 / self.options.nbElement;
		self.options.allCarousel.each(function() {
			var _img = this, _checki = function(e) {
				if((_img.complete) || (_img.readyState === 'complete' && e.type === 'readystatechange')) {
					$(self.element).find('.loaderCarouselProgress').css({
						'width' : (loaderCarouselProgress) + 'px'
					});
					loaderCarouselProgress += 100 / self.options.nbElement;
					if(++i === self.options.nbElement) {
						_done();
					}
				}
				else
				if(_img.readyState === undefined)// dont for IE
				{
					$(_img).attr('src', $(_img).attr('src'));
					// re-fire load event
				}
			};
			// _checki \\
			$(_img).bind('load readystatechange', function(e) {
				_checki(e);
			});
			_checki({
				type : 'readystatechange'
			});
			// bind to 'load' event...
		});
	};
	/**
	 * Methode qui lance les differentes methodes qui vont construire le carousel avec tous les elements voulus.
	 *
	 */
	Plugin.prototype.setCarousel = function() {
		var self = this;
		self.options.allCarousel.each(function(index) {
			/*if(self.options.hauteur !== $(this).height()) {
			 $(this).attr('width', parseInt(self.options.hauteur * $(this).width() / $(this).height(), 10));
			 $(this).attr('height', self.options.hauteur);
			 }*/
			var ratio = $(this).width()/$(this).height(),
                        marge;
			if(ratio>1){

				$(this).width(self.options.largeur);
				$(this).height(Math.ceil(self.options.largeur/ratio));

			}
			if(ratio<1){

				$(this).height(self.options.hauteur);
				$(this).width(Math.ceil(self.options.hauteur*ratio));


			}

			if(self.options.hauteur !== $(this).height()) {

				marge = ((self.options.hauteur - $(this).height()) / 2);
				$(this).css({
					'margin-top' : Math.ceil(marge) + 'px',
					'margin-botom' : Math.floor(marge) + 'px'
				});
			}
			if(self.options.largeur !== $(this).width()) {
				marge = ((self.options.largeur - $(this).width()) / 2);
				$(this).css({
					'margin-left' : Math.ceil(marge) + 'px',
					'margin-right' : Math.floor(marge) + 'px'
				});
			}
			$(this).attr('data', index);
		});
		if(self.options.nbElement > 1) {
			if(self.options.fleche) {
				self.fleches();
			}
			if(self.options.selecteur) {
				self.selecteur();
			}
			if(self.options.legende !== null) {
				self.legendes();
			}
			if(self.options.vignette) {
				self.vignette();
			}
			if(self.options.slidevignette) {
				self.slideVignette();
			}
			if(self.options.gestionTouche){
				self.touchMobile();
			}

			self.startCarousel();
		}
		else {
			self.options.allCarousel.css({
				'top' : 0,
				'left' : 0
			}).show();
			$(self.element).removeClass('loaderCarousel').find('.loaderCarouselBar').remove();
			if(self.callback) {
				self.callback(self);
			}
		}
	};
	/**
	 * Methode qui ajout des fleches pour passer a l'image suivante ou precedente
	 */
	Plugin.prototype.fleches = function() {
		var self = this;
		$(self.element).append("<div class='flecheGauche flechesCarousel plopCarousel'></div><div class='flecheDroite flechesCarousel plopCarousel'></div>");
		$(self.element).find('.flecheGauche').addClass('ePlopCarousel').live('click , touchstart', function(event) {
			event.stopPropagation();
			self.options.allCarousel.stop(true, true);
			self.options.elementPrecedent = Number($(self.element).find('.active').attr('data'));
			self.options.elementCourant = ((self.options.elementPrecedent - 1) < 0) ? (self.options.nbElement - 1) : (self.options.elementPrecedent - 1);
			self.options.click = true;
			self.play();
		});
		$(self.element).find('.flecheDroite').addClass('ePlopCarousel').live('click , touchstart', function(event) {
			event.stopPropagation();

			self.options.allCarousel.stop(true, true);
			self.options.elementPrecedent = Number($(self.element).find('.active').attr('data'));
			self.options.elementCourant = ((self.options.elementPrecedent + 1) >= (self.options.nbElement)) ? 0 : (self.options.elementPrecedent + 1);
			self.options.click = true;
			self.play();
		});
		self.options.update.push(function() {
			$(self.element).find(".flechesCarousel").stop().animate({
				'opacity' : 1
			}, 'fast');
			if(self.options.elementCourant === 0) {
				$(self.element).find(".flecheGauche").stop().animate({
					'opacity' : 0
				}, 'fast');
			}
			else {
				$(self.element).find(".flecheGauche").stop().animate({
					'opacity' : 1
				}, 'fast');
			}
			if(self.options.elementCourant === (self.options.nbElement - 1)) {
				$(self.element).find(".flecheDroite").stop().animate({
					'opacity' : 0
				}, 'fast');
			}
			else {
				$(self.element).find(".flecheDroite").stop().animate({
					'opacity' : 1
				}, 'fast');
			}
		});
	};

/*
 * Methode qui ajout des écouteurs sur ".animationCarousel" qui gére le touch des mobiles et tablettes
 */
	Plugin.prototype.touchMobile = function() {
		var self = this;

		$(self.element).find('.animationCarousel').addClass('ePlopCarousel').live("touchstart", function(event) {
			var e = event.originalEvent;
			event.preventDefault();
			self.options.touch = [];

			self.options.touch[0] = e.touches[0].pageX;
			self.options.touch[2] = e.touches[0].pageY;
			self.options.touch[1] = self.options.touch[0];
			self.options.touch[3] = self.options.touch[2];

		});
		$(self.element).find('.animationCarousel').addClass('ePlopCarousel').live("touchmove", function(event) {
			var e = event.originalEvent;
			event.preventDefault();

			self.options.touch[1] = e.touches[0].pageX;
			self.options.touch[3] = e.touches[0].pageY;
		});
		$(self.element).find('.animationCarousel').addClass('ePlopCarousel').live("touchend", function(event) {
			var e = event.originalEvent, annule=false;
			event.preventDefault();

			if(Math.abs(self.options.touch[1] - self.options.touch[0])<20){
				self.options.touch[1] = self.options.touch[0];
			}
			if((self.options.touch[3] !== self.options.touch[2])&& Math.abs(self.options.touch[3] - self.options.touch[2])>50) {
				var deplacement = self.options.touch[3]-self.options.touch[2];
				$(window).scrollTop($(window).scrollTop()-deplacement);
				annule=true;
			}

			if((self.options.touch[1] < self.options.touch[0])&&!annule) {
				self.options.allCarousel.stop(true, true);
				self.options.elementPrecedent = Number($(self.element).find('.active').attr('data'));
				self.options.elementCourant = ((self.options.elementPrecedent + 1) >= (self.options.nbElement)) ? 0 : (self.options.elementPrecedent + 1);
				self.options.click = true;
				self.play();

			}
			if((self.options.touch[1] > self.options.touch[0])&&!annule) {
				self.options.allCarousel.stop(true, true);
				self.options.elementPrecedent = Number($(self.element).find('.active').attr('data'));
				self.options.elementCourant = ((self.options.elementPrecedent - 1) < 0) ? (self.options.nbElement - 1) : (self.options.elementPrecedent - 1);
				self.options.click = true;
				self.play();

			}
		});
	};




	/**
	 * Methode qui ajout un serie de bouton pour passer a l'image de son choix
	 */
	Plugin.prototype.selecteur = function() {
		var self = this;
		$(self.element).append("<div class='selecteurCarousel plopCarousel'></div>");
		for(var i = 0; i < self.options.nbElement; i++) {
			$(self.element).find(".selecteurCarousel").append("<span data='" + i + "'>&bull;</span>");
		}
		$(self.element).find(".selecteurCarousel").find("span:first").addClass('select');
		$(self.element).find(".selecteurCarousel").find("span").addClass('ePlopCarousel').live('click', function(event) {
			event.stopPropagation();
			self.options.allCarousel.stop(true, true);
			self.options.elementPrecedent = Number($(self.element).find('.active').attr('data'));
			self.options.elementCourant = Number($(this).attr('data'));
			self.options.click = true;
			self.play();
		});
		self.options.update.push(function() {
			$(self.element).children(".selecteurCarousel").find("span").eq(self.options.elementCourant).addClass('select').siblings("span").removeClass('select');
		});
	};
	/**
	 * Methode qui ajout une legende tire de l'attribut 'alt' de l'image
	 */
	Plugin.prototype.legendes = function() {
		var self = this;
		$(self.element).append("<div class='legendCarousel plopCarousel'><p></p></div>");
		self.options.update.push(function() {
			var legende = self.options.allCarousel.eq(self.options.elementCourant).attr(self.options.legende);
			if(legende) {
				$(self.element).find(".legendCarousel>p").html(legende);
				$(self.element).find(".legendCarousel").show();
			}
			else {
				$(self.element).find(".legendCarousel").hide();
			}
		});
	};
	/**
	 * Methode qui ajout un serie de vignette pour passer a l'image de son choix
	 */
	Plugin.prototype.vignette = function() {
		var self = this;
		var vignetteRatio = self.options.vignetteHauteur / self.options.vignetteLargeur;
		$(self.element).append("<div class='vignetteCarousel plopCarousel'></div>");
		self.options.allCarousel.each(function(index) {
			var carouselRatio = $(this).height() / $(this).width(), hauteur, largeur, style;
			if(vignetteRatio > carouselRatio) {
				hauteur = self.options.vignetteHauteur;
				largeur = self.options.vignetteHauteur / carouselRatio;
				style = "margin-left:" + ((self.options.vignetteLargeur - self.options.vignetteHauteur / carouselRatio) / 2) + "px";
			}
			else {
				largeur = self.options.vignetteLargeur;
				hauteur = self.options.vignetteLargeur * carouselRatio;
				style = "margin-top:" + ((self.options.vignetteHauteur - self.options.vignetteLargeur * carouselRatio) / 2) + "px";
			}
			var thumbImage = "<div><img src='" + $(this).attr('src') + "' height='" + hauteur + "' width='" + largeur + "' alt='" + $(this).attr('alt') + "' data='" + index + "' style='" + style + "'/></div>";
			$(self.element).find(".vignetteCarousel").append(thumbImage);
		});
		$(self.element).find(".vignetteCarousel").find("div").css({
			'height' : self.options.vignetteHauteur + 'px',
			'width' : self.options.vignetteLargeur + 'px'
		});

		/* $(self.element).css({
		 'width':'auto',
		 'height':'auto'
		 });*/
		$(self.element).find(".vignetteCarousel").find("div:first").addClass('select');
		$(self.element).find(".vignetteCarousel").find("img").addClass('ePlopCarousel').live('click', function(event) {
			event.stopPropagation();
			self.options.allCarousel.stop(true, true);
			self.options.allCarousel.find('div').stop();
			self.options.elementPrecedent = Number($(self.element).find('.active').attr('data'));
			self.options.elementCourant = Number($(this).attr('data'));
			self.options.tempo = window.clearTimeout(self.options.tempo);
			self.options.click = true;
			self.play();
		});
		if(self.options.infobulle) {
			$(self.element).find(".vignetteCarousel").find("img").hover(function() {
				if($(this).attr("alt") !== "") {
					$('body').append('<span class="infobulleCarousel plopCarousel"></span>');
					var bulle = $(".infobulleCarousel:last");
					bulle.append($(this).attr("alt"));
					var posTop = $(this).parent().offset().top;
					var posLeft = $(this).parent().offset().left + $(this).parent().width() / 2 - bulle.width() / 2;
					bulle.css({
						'left' : posLeft,
						'top' : posTop - 30,
						'opacity' : 0
					});
					bulle.animate({
						'top' : posTop - 20,
						opacity : 0.99
					});
				}
			}, function() {
				var bulle = $(".infobulleCarousel:last");
				bulle.animate({
					'top' : bulle.offset().top - 30,
					'opacity' : 0
				}, 500, "linear", function() {
					bulle.remove();
				});
			});
		}
		self.options.update.push(function() {
			$(self.element).children(".vignetteCarousel").find("div").eq(self.options.elementCourant).addClass('select').siblings("div").removeClass('select');
		});
	};
	Plugin.prototype.slideVignette = function() {
		var self = this;
		var vignetteRatio = self.options.vignetteHauteur / self.options.vignetteLargeur;
		$(self.element).append('<div class="blocVignetteCarousel plopCarousel"><div class="gaucheVignetteCarousel"></div><div class="masqueCarousel"><div class="slideVignetteCarousel"></div></div><div class="droiteVignetteCarousel"></div></div>');
		self.options.allCarousel.each(function(index) {
			var carouselRatio = $(this).height() / $(this).width(), hauteur, largeur, style;
			if(vignetteRatio > carouselRatio) {
				hauteur = self.options.vignetteHauteur;
				largeur = self.options.vignetteHauteur / carouselRatio;
				style = "margin-left:" + ((self.options.vignetteLargeur - self.options.vignetteHauteur / carouselRatio) / 2) + "px";
			}
			else {
				largeur = self.options.vignetteLargeur;
				hauteur = self.options.vignetteLargeur * carouselRatio;
				style = "margin-top:" + ((self.options.vignetteHauteur - self.options.vignetteLargeur * carouselRatio) / 2) + "px";
			}
			var thumbImage = "<div><img src='" + $(this).attr('src') + "' height='" + hauteur + "' width='" + largeur + "' alt='" + $(this).attr('alt') + "' data='" + index + "' style='" + style + "'/></div>";
			$(self.element).find('.slideVignetteCarousel').append(thumbImage);
		});
		$(self.element).find(".slideVignetteCarousel").find("div").css({
			'height' : self.options.vignetteHauteur + 'px',
			'width' : self.options.vignetteLargeur + 'px'
		});
		$(self.element).find(".slideVignetteCarousel").find("div:first").addClass('select');
		$(self.element).find(".slideVignetteCarousel").width(self.options.nbElement * $(self.element).find(".slideVignetteCarousel").find("div:first").outerWidth(true));
		$(self.element).find(".masqueCarousel").width(self.options.slideVignetteNbr * $(self.element).find(".slideVignetteCarousel").find("div:first").outerWidth(true));
		$(self.element).find('.blocVignetteCarousel').width($(self.element).find(".masqueCarousel").outerWidth(true) + $(self.element).find('.gaucheVignetteCarousel').outerWidth(true) + $(self.element).find('.droiteVignetteCarousel').outerWidth(true)).height($(self.element).find(".slideVignetteCarousel").find("div:first").outerHeight(true));
		$(self.element).find(".slideVignetteCarousel").find("img").addClass('ePlopCarousel').live('click', function(event) {
			event.stopPropagation();
			self.options.allCarousel.stop(true, true);
			self.options.allCarousel.find('div').stop();
			self.options.elementPrecedent = Number($(self.element).find('.active').attr('data'));
			self.options.elementCourant = Number($(this).attr('data'));
			self.options.tempo = window.clearTimeout(self.options.tempo);
			self.options.click = true;
			self.play();
		});
		$(self.element).find('.gaucheVignetteCarousel').addClass('ePlopCarousel').live('click', function(event) {
			event.stopPropagation();
			self.options.allCarousel.stop(true, true);
			self.options.elementPrecedent = Number($(self.element).find('.active').attr('data'));
			self.options.elementCourant = ((self.options.elementPrecedent - 1) < 0) ? (self.options.nbElement - 1) : (self.options.elementPrecedent - 1);
			self.options.click = true;
			self.play();
		});
		$(self.element).find('.droiteVignetteCarousel').addClass('ePlopCarousel').live('click', function(event) {
			event.stopPropagation();
			self.options.allCarousel.stop(true, true);
			self.options.elementPrecedent = Number($(self.element).find('.active').attr('data'));
			self.options.elementCourant = ((self.options.elementPrecedent + 1) >= (self.options.nbElement)) ? 0 : (self.options.elementPrecedent + 1);
			self.options.click = true;
			self.play();
		});
		self.options.update.push(function() {
			$(self.element).find(".slideVignetteCarousel").find("div").eq(self.options.elementCourant).addClass('select').siblings("div").removeClass('select');
			var largeurVignette = $(self.element).find(".slideVignetteCarousel").find("div:first").outerWidth(true), nbr;
			if(self.options.elementCourant < self.options.nbElement - (self.options.slideVignetteNbr / 2) - 1 && self.options.elementCourant > (self.options.slideVignetteNbr / 2)) {
				nbr = -1 * (self.options.elementCourant * largeurVignette - largeurVignette * parseInt(self.options.slideVignetteNbr / 2, 10));
			}
			else {
				nbr = (self.options.elementCourant <= (self.options.slideVignetteNbr / 2)) ? 0 : -1 * ((self.options.nbElement - self.options.slideVignetteNbr) * largeurVignette);
			}
			$(self.element).find(".slideVignetteCarousel").stop().animate({
				'left' : Number(nbr) + "px"
			}, 'slow', self.options.easing);
		});
	};
	/**
	 * Methode qui place les elements de l'animation du carousel au premier lancement
	 */
	Plugin.prototype.startCarousel = function() {
		var self = this;
		self.update();
		switch (self.options.mode) {
			case 'fade':
				self.options.allCarousel.animate({
					opacity : 0
				}, 0).addClass("fadeCarousel");
				$(self.element).find(".carousel:first").stop().animate({
					opacity : 1
				}, 0).addClass('active');
				break;
			case 'slide':
				self.options.slideMouvementH = $(self.element).find(".carousel:first").outerWidth(true);
				$(self.element).find('.animationCarousel').prepend("<div class='slideCarousel'></div>");
				$(self.element).find(".slideCarousel").append($(self.element).find(".carousel"));
				var totaleLargeur = 0;
				self.options.allCarousel.each(function(index) {
					$(this).css({
						'float' : "left",
						'position' : "relative"
					});
					totaleLargeur = totaleLargeur + $(this).outerWidth(true);
				});
				$(self.element).find(".slideCarousel").css({
					"width" : (totaleLargeur) + "px"
				});
				$(self.element).find(".carousel:first").addClass('active');
				break;
			case 'vague':
				self.options.allCarousel.stop().fadeOut(0);
				self.splitCarousel(50);
				$(self.element).find(".carousel:first").addClass('active').find('div').stop().css({
					'top' : 0
				});
				break;
			case 'smooth':
				self.options.allCarousel.stop().fadeOut(0);
				self.splitCarousel(50);
				$(self.element).find('.splitCarousel').css({
					'z-index' : 1
				}).find('div').animate({
					'opacity' : 0
				}, 0);
				$(self.element).find(".carousel:first").addClass('active').find('div').animate({
					'opacity' : 1
				}, 0);
				break;
		}
		$(self.element).removeClass('loaderCarousel').find('.loaderCarouselBar').remove();
		self.options.tempo = window.setTimeout(function() {
			self.play();
		}, self.options.delay);
	};
	/**
	 * Methode qui est utilise en amont des effets de transition 'vague' et 'smooth'
	 * elle passe les images dans le background de plusieurs div qui mise bout a bout reforme l'image
	 * @nbrSplit : le nbr de div voulu
	 */
	Plugin.prototype.splitCarousel = function(nbrSplit) {
		var self = this, urlImage, largeurSplit = (self.options.largeur / nbrSplit), i = 0;
		$(self.element).children('.animationCarousel').find('img.carousel').each(function(index) {
			urlImage = $(this).attr('src');
			$(self.element).children('.animationCarousel').append("<div class='splitCarousel carousel' data='" + $(this).attr('data') + "' alt='" + $(this).attr('alt') + "'></div>");
			if(self.options.mode === 'vague') {
				for( i = 0; i < nbrSplit; i++) {
					$(self.element).children('.animationCarousel').find('.splitCarousel').eq(index).append("<div style='left:" + (i * largeurSplit - 1) + "px;top:" + self.options.hauteur + "px;width:" + (largeurSplit + 1) + "px;height:" + self.options.hauteur + "px;background : url(" + urlImage + ") " + ((largeurSplit * i - 1) * -1) + "px top no-repeat;'></div>");
				}
			}
			if(self.options.mode === 'smooth') {
				for( i = 0; i < nbrSplit; i++) {
					$(self.element).children('.animationCarousel').find('.splitCarousel').eq(index).append("<div style='left:" + (i * largeurSplit - 1) + "px;top:0;width:" + (largeurSplit + 1) + "px;height:" + self.options.hauteur + "px;background : url(" + urlImage + ") " + ((largeurSplit * i - 1) * -1) + "px top no-repeat;'></div>");
				}
			}
			$(self.element).children('.animationCarousel').find('.splitCarousel').css({
				'width' : $(this).width(),
				'margin-right' : $(this).css('margin-right'),
				'margin-left' : $(this).css('margin-left')
			});
		});
		$(self.element).find('img.carousel').remove();
		self.options.allCarousel = $(self.element).find('.carousel');
	};
	/**
	 * Methode qui gere le rythme des animations
	 */
	Plugin.prototype.play = function() {
		var self = this;
		self.options.tempo = window.clearTimeout(self.options.tempo);
		if(self.options.autoplay || self.options.click) {
			switch (self.options.mode) {
				case 'fade':
					self.fade();
					break;
				case 'slide':
					self.slide();
					break;
				case 'vague':
					self.vague();
					break;
				case 'smooth':
					self.smooth();
					break;
			}//fin switch
		}//if autoplay
		self.options.tempo = window.setTimeout(function() {
			self.play();
		}, self.options.delay);
		self.update();
	};
	/**
	 * Methode qui gere la transition fade. Alpha de 0 a 1 sur chaque image de maniere alterne.
	 */
	Plugin.prototype.fade = function() {
		var self = this;
		if(!self.options.click) {
			self.options.elementPrecedent = self.options.elementCourant;
			self.options.elementCourant = self.suivant();
		}
		self.options.allCarousel.eq(self.options.elementCourant).stop().animate({
			opacity : 1
		}, 'slow', function() {
			$(this).addClass('active');
			self.options.click = false;
			$(this).siblings(".carousel").removeClass('active').filter(":visible").stop().animate({
				opacity : 0
			}, 'slow', self.options.easing);
		});
	};
	/**
	 * Methode qui gere la transition vague. Mouvement en vague de chaque image.
	 */
	Plugin.prototype.vague = function() {
		var self = this;
		$(self.element).find('.splitCarousel').eq(self.options.elementPrecedent).css({
			'z-index' : 1
		}).find('div').css({
			'top' : $(self.element).find('.splitCarousel').height()
		});
		if(!self.options.click) {
			self.options.elementPrecedent = self.options.elementCourant;
			self.options.elementCourant = self.suivant();
		}
		else {
			$(self.element).find('.splitCarousel').eq(self.options.elementPrecedent).css({
				'z-index' : 1
			}).find('div').stop().css({
				'top' : 0
			});
			self.options.allCarousel.eq(self.options.elementPrecedent).siblings(".carousel").find('div').stop().css({
				'top' : $(self.element).find('.splitCarousel').height()
			});
		}
		var delais = 300;
		$(self.element).find('.splitCarousel').eq(self.options.elementCourant).css({
			'z-index' : 2
		}).find('div').each(function(index) {
			$(this).stop().animate({
				'top' : 0
			}, delais, self.options.easing);
			delais = delais + 10;
		});
		self.options.allCarousel.eq(self.options.elementCourant).addClass('active').siblings(".carousel").removeClass('active').css({
			'z-index' : 1
		});
		self.options.click = false;
	};
	/**
	 * Methode qui gere la transition smooth. Apparition de gauche a droite de chaque image.
	 */
	Plugin.prototype.smooth = function() {
		var self = this, delais = 300;
		$(self.element).find('.splitCarousel').eq(self.options.elementPrecedent).css({
			'z-index' : 1
		}).find('div').animate({
			'opacity' : 0
		}, 0);
		if(!self.options.click) {
			self.options.elementPrecedent = self.options.elementCourant;
			self.options.elementCourant = self.suivant();
		}
		else {
			$(self.element).find('.splitCarousel').eq(self.options.elementPrecedent).css({
				'z-index' : 1
			}).find('div').stop().animate({
				'opacity' : 1
			}, 0);
			self.options.allCarousel.eq(self.options.elementPrecedent).siblings(".carousel").find('div').stop().animate({
				'opacity' : 0
			}, 0);
		}
		$(self.element).find('.splitCarousel').eq(self.options.elementCourant).css({
			'z-index' : 2
		}).find('div').each(function() {
			$(this).stop().delay(delais).animate({
				'opacity' : 1
			}, 'slow', self.options.easing);
			delais = delais + 10;
		});
		self.options.allCarousel.eq(self.options.elementCourant).addClass('active').siblings(".carousel").removeClass('active');
		self.options.click = false;
		$(self.element).find('.splitCarousel').eq(self.options.elementPrecedent).css({
			'z-index' : 1
		});
	};
	/**
	 * Methode qui gere la transition slide. Les images defile les une a la suite des autre en horizontale.
	 */
	Plugin.prototype.slide = function() {
		var self = this;
		if(!self.options.click) {
			self.options.elementPrecedent = self.options.elementCourant;
			self.options.elementCourant = self.suivant();
		}
		$(self.element).find(".slideCarousel").stop().animate({
			'left' : '-' + (self.options.slideMouvementH * self.options.elementCourant) + 'px'
		}, 'slow', self.options.easing, function() {
			$(self.element).find(".slideCarousel").find(".carousel").eq(self.options.elementCourant).addClass('active').siblings(".carousel").removeClass('active');
			self.options.click = false;
		});
	};
	/**
	 * Methode qui gere le decompte de chaque image pour chaque transition.
	 */
	Plugin.prototype.suivant = function() {
		var self = this;
		var num = 0;
		num = Number(self.options.elementCourant) + 1;
		if(num === self.options.nbElement) {
			num = 0;
		}
		return num;
	};
	/**
	 * Methode qui gere la mise a jour de chaque element du carousel a chaque fin de transition.
	 */
	Plugin.prototype.update = function() {
		var self = this;

		for(var i = 0; i < self.options.update.length; i++) {
			self.options.update[i]();
			//lancement de chacune des fonctions contenues dans le tableau update
		}
		if(self.callback) {
			self.callback(self);
		}
	};
	/**
	 * Methode qui gere les error.
	 */
	Plugin.prototype.error = function(type) {
		var self = this;

	};
	$.fn[pluginName] = function(options, callback) {
		return this.each(function() {
			if(!$.data(this, 'plugin_' + pluginName)) {
				$.data(this, 'plugin_' + pluginName, new Plugin(this, options, callback));
			}
		});
	};
})(jQuery, window);