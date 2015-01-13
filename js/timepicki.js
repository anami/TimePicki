/* 
 * Author: senthil
 * plugin: timepicker
 */
(function($) {

	$.fn.timepicki = function(options) {

	    var defaults = {
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
					today = new Date(d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate() + " " + input),
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

	    var settings = $.extend({}, defaults, options);

	    // check if the jQuery is older than 1.7
        // when .on was introduced
	    function checkForOldjQuery() {
	        var ver_reg = /1\.(\d){1}\.\d/i,
                result = ver_reg.exec($.fn.jquery);
	        if (result) {
	            if (Number(result[1]) < 7) {
	                return true;
	            }
	        }

	        // presume it is a newer jQuery
	        return false;
	    }
        
	    var isjQueryOld = checkForOldjQuery();

		return this.each(function() {

		    var ele = $(this),
			    ele_hei = ele.outerHeight(),
			    ele_lef = ele.position().left;

			ele_hei += 10;
			if (settings.show_seconds) {
			    $(ele).wrap("<div class='time_pick with-seconds'>");
			} else {
			    $(ele).wrap("<div class='time_pick'>");
			}
			var ele_par = $(this).parents(".time_pick");

		    // force the control not to use the onscreen keyboard
			if (settings.no_keyboard) {
			    ele.attr("readonly", "readonly");
			}

			// developer can specify which arrow makes the numbers go up or down
			var top_arrow_button = (settings.increase_direction === 'down') ?
				"<div class='prev action-prev'></div>" :
				"<div class='prev action-next'></div>";
			var bottom_arrow_button = (settings.increase_direction === 'down') ?
				"<div class='next action-next'></div>" :
				"<div class='next action-prev'></div>";

			var time_markup = "<div class='timepicker_wrap " + settings.custom_classes + "'>" +
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
				"</div>";

			if (settings.show_seconds) {
			    time_markup = time_markup.replace("{{SECONDS}}", "<div class='secs'>" +
						top_arrow_button +
						"<div class='se_tx'></div>" +
						bottom_arrow_button +
					"</div>");
			} else {
			    time_markup = time_markup.replace("{{SECONDS}}", "");
			}

			ele_par.append(time_markup);
			var ele_next = $(this).next(".timepicker_wrap");
			var ele_next_all_child = ele_next.find("div");
			ele_next.css({
				"top": ele_hei + "px",
				"left": ele_lef + "px"
			});



		    // open or close time picker when clicking
			if (isjQueryOld) {
			    //console.info("using old jquery click");
			    $(document).click(handleDocumentClickOld);
			} else {
			    $(document).on("click", handleDocumentClick);
			}
			
			/* document click event handler for jQuery >= 1.7 and 2 */
			function handleDocumentClick(event) {
			    if (!$(event.target).is(ele_next)) {
			        if (!$(event.target).is(ele)) {
			            set_value(event, !is_element_in_timepicki($(event.target)));
			        } else {
			            open_timepicki(event);
			        }
			    }
			}

			/* document click event handler for jQuery < 1.7 */
			function handleDocumentClickOld(event) {
                // check if the click is in a timepicker..
			    if ($(event.target).parents().is(".time_pick")) {
					
					var parent = $(event.target).parents().find(".time_pick");

					// check if the element that was clicked is in the parent.
					if ($.contains(parent[0], event.target)){

						// check if the picker is already open
						if (ele_next.is(":visible")) {
							//console.info("picker is open");

							// if the clicked element is the actual textbox 
							if ($(event.target).is("input")) {
								// keep the picker open.
								set_value(event, false);
							} else {
								// check if the click landed on the control first
								set_value(event, !$.contains(ele_next[0], event.target));	
							}
						} 
					}
				} else {
					close_timepicki();
				}
			}

		    // open the modal when the user focuses on the input
			ele.focus(open_timepicki);

			// close the modal when the time picker loses keyboard focus
			// ele_par.find('input').on('blur', function() {
			// 	setTimeout(function() {
			// 		console.log("input onblur...");
			// 		var focused_element = $(document.activeElement);
			// 		console.log(focused_element);
			// 		if (!is_element_in_timepicki(focused_element)) {
			// 			close_timepicki();
			// 		}
			// 	}, 0);
			// });

			function is_element_in_timepicki(jquery_element) {
			    var element_in = $.contains(ele_par[0], jquery_element[0]) || ele_par.is(jquery_element);
			    console.log(element_in);
			    return element_in;
			}

			function set_value(event, close) {
				// use input values to set the time
				var tim = ele_next.find(".ti_tx").text(),
				    mini = ele_next.find(".mi_tx").text(),
				    secs = ele_next.find(".se_tx").text(),
				    meri = ele_next.find(".mer_tx").text();

				if (tim.length != 0 && mini.length != 0 && meri.length != 0) {

                    // if the seconds are not available..
				    if (!settings.show_seconds || secs.length == 0) {
				        secs = "00";
				    } 

					// store the value so we can set the initial value
					// next time the picker is opened
					ele.attr('data-timepicki-tim', tim);
					ele.attr('data-timepicki-mini', mini);
					ele.attr('data-timepicki-secs', secs);
					ele.attr('data-timepicki-meri', meri);

					// set the formatted value
					ele.val(settings.format_output(tim, mini, secs, meri, settings.show_seconds));
				}

				if (close) {
				    //console.info("closing timepicker");
					close_timepicki();
				}
			}

			function open_timepicki(event) {
			    //console.log("opening timepicker");
			    var input_time;

			    if (settings.start_time_origin) {
					switch(settings.start_time_origin) {
						case 'control':
						    input_time = settings.format_input($(event.currentTarget).val());
							break;
					    case 'current':
                            // leave it alone.
							break;
					    case 'preset':
					        input_time = settings.preset_start_time;
							break;
					    default:
					        break;
					}
				}

				set_date(input_time);
				ele_next.fadeIn();
				// focus on the first input and select its contents
				ele_next.find('input:visible').first().focus().select();
			}

			function close_timepicki() {
				ele_next.fadeOut();
			}

			function set_date(start_time) {
				var d, ti, mi, se, mer;

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

				ele_next.find(".ti_tx").text(ti);
				ele_next.find(".mi_tx").text(mi);
			    ele_next.find(".se_tx").text(se);
				ele_next.find(".mer_tx").text(mer);
			
			}


			var cur_next = ele_next.find(".action-next");
			var cur_prev = ele_next.find(".action-prev");


			$(cur_prev).add(cur_next).click(function(event) {
				//console.log("click");
				var cur_ele = $(this);
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
			});

		});
	};

}(jQuery));