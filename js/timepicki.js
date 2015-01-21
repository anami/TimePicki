/*
*	TimePicki - jquery timepicker addon 
*	
*/

(function($){
	
	// ENTRY POINT
	// Extend $.fn.timepicki
	$.fn.timepicki = function(opts) {
		var args = Array.prototype.slice.call(arguments, 1);
		return this.each(function(){
			var $this = $(this),
				data = $this.data('timepicki');
			if (! data) {
				var options = $.extend({}, TimePicki.DEFAULTS, $this.data(), typeof opts == 'object' && opts);
				$this.data('timepicki', new TimePicki($this, options));
			} else {
				// Manual operations. show, hide, remove, e.g.
				if (typeof data[opts] === 'function') {
					data[option].apply(data, args);
				}
			}
		});
	};

	// PRIVATE MEMBERS AND UTILITY FUNCTIONS
	var $doc = $(document);

	// Get a unique id
	var idCounter = 0;
	function getUniqueId(prefix) {
		var id = ++idCounter + '';
		return prefix ? prefix + id : id;
	}

	// check for old jQuery - 
	// jQuery 1.6 and below is considered old.
	function isjQueryOld() {
		// only checks for 1.x and not 1.xx
		var verReg = /1\.(\d){1}\.\d/i,
			result = verReg.exec($.fn.jquery);
		if (result && Number(result[1]) < 7) {
			return true;		
		}

		return false;			
	}

	// LOGIC
	// TimePicki defaults
	TimePicki.DEFAULTS = {
		// format the output as a string.
		format_output: function(tim, mini, secs, meri, show_seconds) {
			if (show_seconds) {
				return tim + ":" + mini + ":" + secs + " " + meri;
			}
			return tim + ":" + mini + " " + meri;
		},
		// function to format the input - part of the settings 
		// in case it needs to be overridden
		format_input: function(input) {
			
			// format the input value of the control that timepicker is attached to.
			var d = new Date(),
				today = (input) ? new Date(d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate() + " " + input) : d,
				time = [],
				ti = today.getHours(),
				mi = today.getMinutes(),
				se = today.getSeconds(),
				mer = "AM";
	
			if (12 < ti) {
				ti -= 12;
				mer = "PM";
			}

			if (ti === 0) { ti = 12; }

			// return the time part as an array.
			time.push(ti);
			time.push(mi);
			time.push(se);
			time.push(mer);
			return time;
		},
		// 'control' to use the value of the input element 
		// 'current' to use the current time.
		// 'preset' to use a preset time as specified by preset_start_time
		start_time_origin: 'control', 
		// preset time used when 'start_time_origin' is set to 'preset'
		preset_start_time: undefined,
		// show seconds in the control
		show_seconds: true,
		// the 'up' buttons increase the value - 'down' buttons to increase the value 
		increase_direction: 'up',
		// custom CSS classes 
		custom_classes: '',
		// make the initial textbox readonly so not to invoke any on screen keyboards
		no_keyboard: true
	};
	
	// TimePicki class
	function TimePicki(element, options) {
		var isInput = element.attr("tagName") === "INPUT",
			input = isInput ? element : element.find("input");

		this.id 				= getUniqueId('tp');		
		this.clickHandlers 	= [];
		this.parent			= $('<div/>').addClass('time_pick');
		this.options			= options;
		this.element			= element;
		this.displayed 		= false;
		this.input 			= input;
		self = this;
		
	    // force the control not to use the onscreen keyboard
		if (options.no_keyboard) {
		    element.attr("readonly", "readonly");
		}

		// build markup
		if (options.show_seconds) {
			this.element.wrap("<div class='time_pick with-seconds'>");
		} else {
			this.element.wrap("<div class='time_pick'>");
		}

		// add an identifier to the containing div.
		this.parent = this.element.parents(".time_pick");
		this.parent.addClass(this.id);

		// developer can specify which arrow makes the numbers go up or down
		var top_arrow_button = (options.increase_direction === 'down') ?
			"<div class='prev action-prev'></div>" :
			"<div class='prev action-next'></div>";
		var bottom_arrow_button = (options.increase_direction === 'down') ?
			"<div class='next action-next'></div>" :
			"<div class='next action-prev'></div>";

		var time_markup = "<div class='timepicker_wrap " + options.custom_classes + "'>" +
				"<div class='arrow_top'></div>" +
				"<div class='time'>" +
					top_arrow_button +
					"<div class='ti_tx'></div>" +
					bottom_arrow_button +
				"</div>" +
				"<div class='mins'>" +
					top_arrow_button +
					"<div class='mi_tx'></div>" +
					bottom_arrow_button +
				"</div>{{SECONDS}}" +
				"<div class='meridian'>" +
					top_arrow_button +
					"<div class='mer_tx'></div>" +
					bottom_arrow_button +
				"</div>" +
				"<div class=\"close-timepicker\">x</div>" +
			"</div>";

		if (options.show_seconds) {
		    time_markup = time_markup.replace("{{SECONDS}}", "<div class='secs'>" +
					top_arrow_button +
					"<div class='se_tx'></div>" +
					bottom_arrow_button +
				"</div>");
		} else {
		    time_markup = time_markup.replace("{{SECONDS}}", "");
		}		

		// append the markup
		this.parent.append(time_markup);
		this.picker = this.parent.find('.timepicker_wrap');

		// click add event to open the popup...
		this.element.bind("click", $.proxy(this.toggleView, this));
				

		// bind the click events
		this.picker.find('.action-next').bind("click", $.proxy(this.change, this));
		this.picker.find('.action-prev').bind("click", $.proxy(this.change, this));
		this.picker.find('.close-timepicker').bind("click", $.proxy(this.close, this));
		
		this.picker.find('.action-next').bind("touchstart", this.touch);
		this.picker.find('.action-prev').bind("touchstart", this.touch);

	}//end of TimePicki class

	// Set the initial time value;
	TimePicki.prototype.set_date = function(start_time) {
		var d, ti, mi, se, mer, ele = this.element;

		// if a value was already picked we will remember that value
		if (ele.is('[data-timepicki-tim]')) {
			ti = Number(ele.attr('data-timepicki-tim'));
			mi = Number(ele.attr('data-timepicki-mini'));
			se = Number(ele.attr('data-timepicki-secs'));
			mer = ele.attr('data-timepicki-meri');

		// developer can specify a custom starting value
		} else if (typeof start_time === 'object') {
			ti = Number(start_time[0]);
			mi = Number(start_time[1]);
			se = Number(start_time[2]);
			mer = start_time[3];

		// default is we will use the current time
		} else {
			d = new Date();
			ti = d.getHours();
			mi = d.getMinutes();
			se = d.getSeconds();
			mer = "AM";
			if (12 < ti) {
				ti -= 12;
				mer = "PM";
			}
		}

		ti = (ti < 10) ? "0" + ti : ti;
		mi = (mi < 10) ? "0" + mi : mi;
		se = (se < 10) ? "0" + se : se;
		mer = (mer < 10) ? "0" + mer : mer;

		this.picker.find(".ti_tx").text(ti);
		this.picker.find(".mi_tx").text(mi);
	    this.picker.find(".se_tx").text(se);
		this.picker.find(".mer_tx").text(mer);
	};

	// Arrow click handler.
	TimePicki.prototype.change = function(e) {
		this.click(e);
		this.set_value(e);	
	};

	// Touch event handler
	TimePicki.prototype.touch = function(e) {
		var t2 = e.timeStamp
      		, t1 = $(this).data('lastTouch') || t2
      		, dt = t2 - t1
      		, fingers = e.originalEvent.touches.length;
    		$(this).data('lastTouch', t2);
    		if (!dt || dt > 500 || fingers > 1) return; // not double-tap

    		e.preventDefault(); // double tap - prevent the zoom
    		
		// trigger only a single click..
    		$(this).trigger('click');	
	};

	// Update value
	TimePicki.prototype.set_value = function(e) {
		var tim = this.picker.find(".ti_tx").text(),
	    		mini = this.picker.find(".mi_tx").text(),
	    		secs = this.picker.find(".se_tx").text(),
	    		meri = this.picker.find(".mer_tx").text();

		if (tim.length != 0 && mini.length != 0 && meri.length != 0) {

            // if the seconds are not available..
		    if (!this.options.show_seconds || secs.length == 0) {
		        secs = "00";
		    } 

			// store the value so we can set the initial value
			// next time the picker is opened
			this.element.attr('data-timepicki-tim', tim);
			this.element.attr('data-timepicki-mini', mini);
			this.element.attr('data-timepicki-secs', secs);
			this.element.attr('data-timepicki-meri', meri);

			// set the formatted value
			this.element.val(this.options.format_output(tim, mini, secs, meri, this.options.show_seconds));
		}	
	};

	// Click handler
	TimePicki.prototype.click = function(e) {
		var cur_ele = $(e.target);
		var ele_next = this.picker;
		var cur_cli = null;
		var ele_st = 0;
		var ele_en = 0;
		if (cur_ele.parent().attr("class") == "time") {
			//alert("time");
			cur_cli = "time";
			ele_en = 12;
			var cur_time = null;
			cur_time = ele_next.find("." + cur_cli + " .ti_tx").text();
			cur_time = Number(cur_time);
			//console.log(ele_next.find("." + cur_cli + " .ti_tx"));
			if ($(cur_ele).hasClass('action-next')) {
				//alert("nex");
				if (cur_time == 12) {
					ele_next.find("." + cur_cli + " .ti_tx ").text("01");
				} else {
					cur_time++;

					if (cur_time < 10) {
						ele_next.find("." + cur_cli + " .ti_tx").text("0" + cur_time);
					} else {
						ele_next.find("." + cur_cli + " .ti_tx").text(cur_time);
					}
				}

			} else {
				if (cur_time == 1) {
					ele_next.find("." + cur_cli + " .ti_tx").text("12");
				} else {
					cur_time--;
					if (cur_time < 10) {
						ele_next.find("." + cur_cli + " .ti_tx").text("0" + cur_time);
					} else {
						ele_next.find("." + cur_cli + " .ti_tx").text(cur_time);
					}
				}
			}

		} else if (cur_ele.parent().attr("class") == "mins") {
			//alert("mins");
			cur_cli = "mins";
			ele_en = 59;
			var cur_mins = null;
			cur_mins = ele_next.find("." + cur_cli + " .mi_tx").text();
			cur_mins = parseInt(cur_mins);
			if ($(cur_ele).hasClass('action-next')) {
				//alert("nex");
				if (cur_mins == 59) {
					ele_next.find("." + cur_cli + " .mi_tx").text("00");
				} else {
					cur_mins++;
					if (cur_mins < 10) {
						ele_next.find("." + cur_cli + " .mi_tx").text("0" + cur_mins);
					} else {
						ele_next.find("." + cur_cli + " .mi_tx").text(cur_mins);
					}
				}
			} else {

				if (cur_mins == 0) {
					ele_next.find("." + cur_cli + " .mi_tx").text("59");
				} else {
					cur_mins--;

					if (cur_mins < 10) {
						ele_next.find("." + cur_cli + " .mi_tx").text("0" + cur_mins);
					} else {
						ele_next.find("." + cur_cli + " .mi_tx").text(cur_mins);
					}

				}

			}
		} else if (cur_ele.parent().attr("class") == "secs") {
		    //alert("secs");
		    cur_cli = "secs";
		    ele_en = 59;
		    var cur_secs = null;
		    cur_secs = ele_next.find("." + cur_cli + " .se_tx").text();
		    cur_secs = parseInt(cur_secs);
		    if ($(cur_ele).hasClass('action-next')) {
		        //alert("nex");
		        if (cur_secs == 59) {
		            ele_next.find("." + cur_cli + " .se_tx").text("00");
		        } else {
		            cur_secs++;
		            if (cur_secs < 10) {
		                ele_next.find("." + cur_cli + " .se_tx").text("0" + cur_secs);
		            } else {
		                ele_next.find("." + cur_cli + " .se_tx").text(cur_secs);
		            }
		        }
		    } else {

		        if (cur_secs == 0) {
		            ele_next.find("." + cur_cli + " .se_tx").text("59");
		        } else {
		            cur_secs--;

		            if (cur_secs < 10) {
		                ele_next.find("." + cur_cli + " .se_tx").text("0" + cur_secs);
		            } else {
		                ele_next.find("." + cur_cli + " .se_tx").text(cur_secs);
		            }

		        }

		    }
		} else {
			//alert("meridian");
			ele_en = 1;
			cur_cli = "meridian";
			var cur_mer = null;
			cur_mer = ele_next.find("." + cur_cli + " .mer_tx").text();
			if ($(cur_ele).hasClass('action-next')) {
				//alert(cur_mer);
				if (cur_mer == "AM") {
					ele_next.find("." + cur_cli + " .mer_tx").text("PM");
				} else {
					ele_next.find("." + cur_cli + " .mer_tx").text("AM");
				}
			} else {
				if (cur_mer == "AM") {
					ele_next.find("." + cur_cli + " .mer_tx").text("PM");
				} else {
					ele_next.find("." + cur_cli + " .mer_tx").text("AM");
				}
			}
		}
	};

	// Open/show the picker.
	TimePicki.prototype.open = function(e) {
		this.displayed = true;
	
		// position the picker
		this.picker.css("top", this.element.outerHeight() + "px").css("left", this.element.position().left + "px");

		this.picker.fadeIn("fast");
		
		var input_time;

	    if (this.options.start_time_origin) {
			switch(this.options.start_time_origin) {
				case 'control':
				    input_time = this.options.format_input($(e.currentTarget).val());
					break;
			    case 'current':
                    // leave it alone.
					break;
			    case 'preset':
			        input_time = this.options.preset_start_time;
					break;
			    default:
			        break;
			}
		}

		this.set_date(input_time);

		// scroll into view
		$('html body').animate({ scrollTop : this.picker.offset().top + 300}, 1000);

		// unfocus so it can clicked again
		this.element.blur();

		// hide all the other timepickers
		$doc.find('.time_pick').not(this.parent).find('input').each(function(index){
			$(this).data('timepicki').close()
		});

	};

	// Close the picker
	TimePicki.prototype.close = function(e) {
		this.displayed = false;
		this.picker.fadeOut();

		console.log('closing picker... ' + this.id);
		// unfocus so it can be clicked again.
		this.element.blur();
	};

	TimePicki.prototype.toggleView = function(e) {
		this[this.displayed ? "close" : "open"](e);		
	};

	TimePicki.prototype.remove = function() {
	};

})(jQuery);
