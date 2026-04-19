// riderGeometry.js — Calculate rider body joint positions
(function () {
  'use strict';

  window.BikeFit = window.BikeFit || {};

  function degToRad(deg) {
    return (deg * Math.PI) / 180;
  }

  /**
   * 2-segment inverse kinematics: given two endpoints and segment lengths,
   * find the middle joint position (elbow or knee).
   * Returns the joint position that bends in the preferred direction.
   *
   * @param {Object} p1 - Start point { x, y }
   * @param {Object} p2 - End point { x, y }
   * @param {number} len1 - Length of first segment (p1 → joint)
   * @param {number} len2 - Length of second segment (joint → p2)
   * @param {number} side - +1 for joint to the right/forward, -1 for left/backward
   * @returns {Object} Joint position { x, y }
   */
  function solveIK(p1, p2, len1, len2, side) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    // Clamp if endpoints are too far apart
    if (dist > len1 + len2) {
      dist = len1 + len2 - 0.1;
    }
    // Clamp if endpoints are too close
    if (dist < Math.abs(len1 - len2)) {
      dist = Math.abs(len1 - len2) + 0.1;
    }

    // Law of cosines to find angle at p1
    var cosAngle = (len1 * len1 + dist * dist - len2 * len2) / (2 * len1 * dist);
    cosAngle = Math.max(-1, Math.min(1, cosAngle));
    var angle = Math.acos(cosAngle);

    // Angle from p1 to p2
    var baseAngle = Math.atan2(dy, dx);

    // Joint position
    var jointAngle = baseAngle + side * angle;
    return {
      x: p1.x + len1 * Math.cos(jointAngle),
      y: p1.y + len1 * Math.sin(jointAngle)
    };
  }

  /**
   * Calculate rider joint positions.
   *
   * @param {Object} rider - { height (cm), legLength (cm), armLength (cm) }
   * @param {Object} bikePoints - from calculateBikePoints
   * @param {number} seatHeight - seat height in mm (from BB along seat tube)
   * @param {number} seatTubeAngleDeg - seat tube angle in degrees
   * @returns {Object} Named 2D points for rider joints
   */
  function calculateRiderPoints(rider, bikePoints, seatHeight, seatTubeAngleDeg) {
    // Convert rider measurements to mm
    var heightMm = rider.height * 10;
    var legLengthMm = rider.legLength * 10;
    var armLengthMm = rider.armLength * 10;

    var stAngle = degToRad(seatTubeAngleDeg);

    // Segment proportions
    var upperLeg = legLengthMm * 0.45;
    var lowerLeg = legLengthMm * 0.55;
    var upperArm = armLengthMm * 0.45;
    var lowerArm = armLengthMm * 0.55;
    var torsoLength = (heightMm - legLengthMm) * 0.48;
    var headRadius = heightMm * 0.065;

    // Foot at BB (pedal at bottom of stroke)
    var foot = { x: bikePoints.bb.x, y: bikePoints.bb.y };

    // Hip/saddle at seat height along seat tube angle from BB
    var hip = {
      x: -seatHeight * Math.cos(stAngle),
      y: seatHeight * Math.sin(stAngle)
    };

    // Hands at handlebar position
    var hand = { x: bikePoints.stemEnd.x, y: bikePoints.stemEnd.y };

    // Knee: IK from foot to hip, knee bends forward (-1 side = clockwise from foot→hip direction)
    var knee = solveIK(foot, hip, lowerLeg, upperLeg, -1);

    // Shoulder: from hip, torso leans forward
    // Calculate angle from hip toward handlebars, then adjust for riding position
    var hipToHand = {
      x: hand.x - hip.x,
      y: hand.y - hip.y
    };

    // Torso angle: blend between upright and reaching toward bars
    // MTB riders lean forward enough to comfortably reach handlebars
    var uprightAngle = degToRad(75);
    var toHandAngle = Math.atan2(hipToHand.y, hipToHand.x);
    var shoulderAngle = uprightAngle * 0.5 + toHandAngle * 0.5;

    var shoulder = {
      x: hip.x + torsoLength * Math.cos(shoulderAngle),
      y: hip.y + torsoLength * Math.sin(shoulderAngle)
    };

    // Elbow: positioned between shoulder and hand with natural bend
    // Place elbow along the shoulder-hand line, offset below for natural arm drop
    var shToHandDx = hand.x - shoulder.x;
    var shToHandDy = hand.y - shoulder.y;
    var shToHandDist = Math.sqrt(shToHandDx * shToHandDx + shToHandDy * shToHandDy);
    var totalArm = upperArm + lowerArm;

    // Position along the shoulder-hand line (closer to shoulder)
    var t = 0.42;
    var midX = shoulder.x + shToHandDx * t;
    var midY = shoulder.y + shToHandDy * t;

    // Perpendicular offset: below the shoulder-hand line
    // Clockwise perpendicular from sh→hand direction
    var perpX, perpY;
    if (shToHandDist > 0) {
      perpX = shToHandDy / shToHandDist;
      perpY = -shToHandDx / shToHandDist;
    } else {
      perpX = 0;
      perpY = -1;
    }

    // Scale bend based on arm slack
    var armSlack = Math.max(0, totalArm - shToHandDist);
    var bendAmount = Math.min(armSlack * 0.35, totalArm * 0.2);

    var elbow = {
      x: midX + perpX * bendAmount,
      y: midY + perpY * bendAmount
    };

    // Head: above shoulder
    var head = {
      x: shoulder.x + headRadius * 0.3,
      y: shoulder.y + headRadius * 2
    };

    return {
      foot: foot,
      knee: knee,
      hip: hip,
      shoulder: shoulder,
      elbow: elbow,
      hand: hand,
      head: head,
      headRadius: headRadius
    };
  }

  window.BikeFit.calculateRiderPoints = calculateRiderPoints;
})();
