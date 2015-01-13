TimePicki
=========

Based on the non-keyboard friendly version of the TimePicki jQuery plugin originally developed by Senthil Raj 
###[Click to see Demo](http://senthilraj.github.io/TimePicki/)

It is Time picker plugin based on jQuery. The primary reason for developing it was to allow users of mobiles to easily enter times in text boxes.
It was also developed to target the 1.5.1 version of jQuery which was initially supplied with ASP.NET MVC2 projects. The plugin is suitable for any jQuery version after 1.5.1

How to use
==========

- 1)Include jQuery plugin and TimePicki Plugin
- 2)Call Timepicki function with input element selector

```html
<script src="js/jquery.js"></script>
<script src="js/timepicki.js"></script>
<script>
  $(document).ready(function(){
    $(".time_element").timepicki();
  });
</script>
```

- 3)Write a time input like something below::
```html
<input type="text" name="timepicker" class="time_element"/>
```        

- 4)Add the CSS stylesheet for TimePicki
```html
<link rel="stylesheet" type="text/css" href="css/timepicki.css">
```
