// fittingEngine.js — Calculate recommended bike fit values from rider measurements
(function () {
  'use strict';

  window.BikeFit = window.BikeFit || {};

  /**
   * Calculate recommended fit values based on rider body measurements.
   *
   * @param {Object} rider - { height (cm), legLength (cm), armLength (cm) }
   * @returns {Object} Recommended values with ranges where applicable
   */
  function calculateRecommendations(rider) {
    var height = rider.height;
    var legLength = rider.legLength;
    var armLength = rider.armLength;
    var torso = height - legLength; // rough upper body length in cm

    // Seat height (BB to top of saddle) in mm
    // MTB coefficient ~0.87 of inseam
    var seatHeight = Math.round(legLength * 8.7);

    // Recommended reach range (mm)
    // Calibrated via linear regression on Giant Trance 29 (2024) sizing data.
    // Height-based prediction plus individual proportion adjustments.
    var baseReach = height * 3.33 - 128;
    var avgTorso = height * 0.534;
    var avgArm = height * 0.365;
    var reachCenter = Math.round(
      baseReach + (torso - avgTorso) * 4.0 + (armLength - avgArm) * 2.0
    );
    var reachRange = {
      min: reachCenter - 15,
      max: reachCenter + 15
    };

    // Recommended stack range (mm)
    // Calibrated via linear regression on Giant Trance 29 (2024) sizing data.
    // Stack increases slowly with height (~1.08 mm per cm of rider height).
    var legProportion = legLength / height;
    var baseStack = height * 1.08 + 423;
    var stackCenter = Math.round(
      baseStack + (legProportion - 0.466) * height * 0.5
    );
    var stackRange = {
      min: stackCenter - 15,
      max: stackCenter + 15
    };

    return {
      seatHeight: seatHeight,
      reachRange: reachRange,
      stackRange: stackRange,
      reachCenter: reachCenter,
      stackCenter: stackCenter
    };
  }

  /**
   * Compare current bike geometry with recommendations.
   * Returns an array of comparison rows for the table.
   *
   * @param {Object} recommendations - from calculateRecommendations
   * @param {Object} bikeParams - current bike geometry values
   * @returns {Array} Comparison rows [{ label, actual, recommended, status }]
   */
  function compareWithBike(recommendations, bikeParams) {
    var rows = [];

    // Reach
    var reachStatus = getStatus(
      bikeParams.reach,
      recommendations.reachRange.min,
      recommendations.reachRange.max
    );
    rows.push({
      label: 'Reach',
      actual: bikeParams.reach + ' mm',
      recommended:
        recommendations.reachRange.min +
        ' – ' +
        recommendations.reachRange.max +
        ' mm',
      status: reachStatus
    });

    // Stack
    var stackStatus = getStatus(
      bikeParams.stack,
      recommendations.stackRange.min,
      recommendations.stackRange.max
    );
    rows.push({
      label: 'Stack',
      actual: bikeParams.stack + ' mm',
      recommended:
        recommendations.stackRange.min +
        ' – ' +
        recommendations.stackRange.max +
        ' mm',
      status: stackStatus
    });

    // Stem length suggestion
    var suggestedStem = suggestStem(recommendations, bikeParams);
    var stemLenStatus =
      Math.abs(bikeParams.stemLength - suggestedStem.length) <= 5
        ? 'good'
        : Math.abs(bikeParams.stemLength - suggestedStem.length) <= 15
        ? 'warn'
        : 'bad';
    rows.push({
      label: 'Stem Length',
      actual: bikeParams.stemLength + ' mm',
      recommended: suggestedStem.length + ' mm',
      status: stemLenStatus
    });

    // Stem angle suggestion
    var stemAngStatus =
      Math.abs(bikeParams.stemAngle - suggestedStem.angle) <= 2
        ? 'good'
        : Math.abs(bikeParams.stemAngle - suggestedStem.angle) <= 5
        ? 'warn'
        : 'bad';
    rows.push({
      label: 'Stem Angle',
      actual: bikeParams.stemAngle + '°',
      recommended: suggestedStem.angle + '°',
      status: stemAngStatus
    });

    // Seat height
    rows.push({
      label: 'Seat Height',
      actual: '—',
      recommended: recommendations.seatHeight + ' mm',
      status: 'info'
    });

    return rows;
  }

  /**
   * Determine status based on whether actual value falls within range.
   */
  function getStatus(actual, min, max) {
    if (actual >= min && actual <= max) return 'good';
    var dist = actual < min ? min - actual : actual - max;
    return dist <= 15 ? 'warn' : 'bad';
  }

  /**
   * Suggest stem length and angle based on reach/stack mismatch.
   */
  function suggestStem(recommendations, bikeParams) {
    var reachDiff = recommendations.reachCenter - bikeParams.reach;
    // Positive reachDiff means bike reach is SHORT → need longer stem
    var suggestedLength = Math.round(
      Math.max(35, Math.min(70, 50 + reachDiff * 0.4))
    );

    var stackDiff = recommendations.stackCenter - bikeParams.stack;
    // Positive stackDiff means bike stack is LOW → suggest positive stem angle
    var suggestedAngle = Math.round(
      Math.max(-6, Math.min(6, stackDiff * 0.1))
    );

    return {
      length: suggestedLength,
      angle: suggestedAngle
    };
  }

  window.BikeFit.calculateRecommendations = calculateRecommendations;
  window.BikeFit.compareWithBike = compareWithBike;
})();
