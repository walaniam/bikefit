// bikeGeometry.js — Calculate bike frame key points from geometry parameters
(function () {
  'use strict';

  window.BikeFit = window.BikeFit || {};

  function degToRad(deg) {
    return (deg * Math.PI) / 180;
  }

  /**
   * Calculate all bike frame key points.
   * Coordinate system: BB at origin, X+ = forward (right), Y+ = upward.
   *
   * @param {Object} params - Bike geometry parameters
   * @returns {Object} Named 2D points { x, y } for each key location
   */
  function calculateBikePoints(params) {
    var htAngle = degToRad(params.headTubeAngle);
    var stAngle = degToRad(params.seatTubeAngle);

    // Bottom Bracket — origin
    var bb = { x: 0, y: 0 };

    // Rear Axle: chainstay distance from BB, raised by bbDrop
    var rearAxleHoriz = Math.sqrt(
      params.chainstay * params.chainstay - params.bbDrop * params.bbDrop
    );
    var rearAxle = { x: -rearAxleHoriz, y: params.bbDrop };

    // Front Axle: wheelbase forward from rear axle, same height
    var frontAxle = { x: rearAxle.x + params.wheelbase, y: rearAxle.y };

    // Head Tube Top: defined by reach and stack from BB
    var headTubeTop = { x: params.reach, y: params.stack };

    // Head Tube Bottom: down along head tube axis from top
    // Head tube direction (top → bottom): forward and down = (cos(HTA), -sin(HTA))
    var headTubeBottom = {
      x: headTubeTop.x + params.headTubeLength * Math.cos(htAngle),
      y: headTubeTop.y - params.headTubeLength * Math.sin(htAngle)
    };

    // Seat Tube Top: from BB, up and rearward along seat tube angle
    var seatTubeTop = {
      x: -params.seatTubeLength * Math.cos(stAngle),
      y: params.seatTubeLength * Math.sin(stAngle)
    };

    // Stem end (handlebar position)
    // Effective stem angle from horizontal = (90° - HTA) + stemAngle
    var effectiveAngle = degToRad(90 - params.headTubeAngle + params.stemAngle);
    var stemEnd = {
      x: headTubeTop.x + params.stemLength * Math.cos(effectiveAngle),
      y: headTubeTop.y + params.stemLength * Math.sin(effectiveAngle)
    };

    // Ground level = axle height (both axles at same Y)
    var groundY = rearAxle.y;

    return {
      bb: bb,
      rearAxle: rearAxle,
      frontAxle: frontAxle,
      headTubeTop: headTubeTop,
      headTubeBottom: headTubeBottom,
      seatTubeTop: seatTubeTop,
      stemEnd: stemEnd,
      groundY: groundY
    };
  }

  window.BikeFit.calculateBikePoints = calculateBikePoints;
})();
