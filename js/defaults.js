// defaults.js — Default values for trail MTB (size L) and average male rider
(function () {
  'use strict';

  window.BikeFit = window.BikeFit || {};

  window.BikeFit.defaults = {
    bike: {
      headTubeLength: 110,    // mm
      headTubeAngle: 65.5,    // degrees
      seatTubeLength: 450,    // mm
      seatTubeAngle: 77.0,    // degrees
      topTubeEffective: 620,  // mm
      reach: 475,             // mm
      wheelbase: 1250,        // mm
      chainstay: 435,         // mm
      stack: 625,             // mm
      bbDrop: 35,             // mm
      stemLength: 50,         // mm
      stemAngle: 0            // degrees
    },
    rider: {
      height: 178,            // cm
      legLength: 83,          // cm
      armLength: 65           // cm
    }
  };

  // 29" wheel: 622mm rim + ~115mm tire diameter = ~737mm total → 368.5mm radius
  window.BikeFit.WHEEL_RADIUS = 368.5; // mm
})();
