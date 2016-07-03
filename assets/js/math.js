/********************************************************************************************/
/* Implement the basic trig functions such that radian 0 is directly up - like a clock face */
/********************************************************************************************/
var sin = function(angle) {
   return Math.sin(angle - Math.PI / 2);
};

var cos = function(angle) {
   return Math.cos(angle - Math.PI / 2);
};

var atan2 = function(y, x) {
   return Math.atan2(y, x) + Math.PI / 2;
};

module.exports = {
	sin: sin,
	cos: cos,
	atan2: atan2
};