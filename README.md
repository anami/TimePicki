TimePickr
=========

Based on the non-keyboard friendly version of the TimePicki jQuery plugin originally developed by Senthil Raj 

It is a timepicker plugin based on jQuery. The primary reason for developing it was to allow users of mobiles to easily enter times in text boxes.
It was also developed to target the 1.5.1 version of jQuery which was initially supplied with ASP.NET MVC2 projects. The plugin is suitable for any jQuery version from 1.5.1 to up to 2.1 (current)

How to use
==========

- 1) Include jQuery and TimePickr Plugin
- 2) Call timepickr function with input element selector

```html
<script src="js/jquery.js"></script>
<script src="js/timepickr.js"></script>
<script>
  $(document).ready(function(){
    $(".time_element").timepickr();
  });
</script>
```

- 3) Write a time input field like something below::
```html
<input type="text" name="timepicker" class="time_element"/>
```        

- 4) Add the CSS stylesheet for TimePickr
```html
<link rel="stylesheet" type="text/css" href="css/timepickr.css">
```



