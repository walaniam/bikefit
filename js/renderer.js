// renderer.js — SVG rendering of bike frame, wheels, and rider
(function () {
  'use strict';

  window.BikeFit = window.BikeFit || {};

  var NS = 'http://www.w3.org/2000/svg';
  var WHEEL_RADIUS = window.BikeFit.WHEEL_RADIUS || 368.5;

  // Colors
  var FRAME_COLOR = '#333333';
  var WHEEL_COLOR = '#888888';
  var WHEEL_FILL = '#f5f5f5';
  var TIRE_COLOR = '#555555';
  var RIDER_COLOR = '#2196F3';
  var RIDER_JOINT = '#1976D2';
  var STEM_COLOR = '#666666';
  var FORK_COLOR = '#555555';
  var GROUND_COLOR = '#cccccc';

  function svgEl(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    for (var key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        el.setAttribute(key, attrs[key]);
      }
    }
    return el;
  }

  /**
   * Render the complete bike + rider visualization.
   *
   * @param {SVGElement} svg - The SVG element to draw into
   * @param {Object} bikePoints - from calculateBikePoints
   * @param {Object} riderPoints - from calculateRiderPoints
   * @param {Object} bikeParams - raw bike geometry params (for wheel info)
   */
  function render(svg, bikePoints, riderPoints, bikeParams) {
    // Clear
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Calculate viewBox to fit everything with padding
    var allPoints = [];
    for (var key in bikePoints) {
      if (bikePoints[key] && typeof bikePoints[key].x === 'number') {
        allPoints.push(bikePoints[key]);
      }
    }
    for (var rkey in riderPoints) {
      if (riderPoints[rkey] && typeof riderPoints[rkey].x === 'number') {
        allPoints.push(riderPoints[rkey]);
      }
    }

    // Add wheel edges
    allPoints.push({ x: bikePoints.rearAxle.x - WHEEL_RADIUS, y: bikePoints.rearAxle.y - WHEEL_RADIUS });
    allPoints.push({ x: bikePoints.rearAxle.x + WHEEL_RADIUS, y: bikePoints.rearAxle.y + WHEEL_RADIUS });
    allPoints.push({ x: bikePoints.frontAxle.x - WHEEL_RADIUS, y: bikePoints.frontAxle.y - WHEEL_RADIUS });
    allPoints.push({ x: bikePoints.frontAxle.x + WHEEL_RADIUS, y: bikePoints.frontAxle.y + WHEEL_RADIUS });

    // Add head point
    if (riderPoints.head) {
      var hr = riderPoints.headRadius || 50;
      allPoints.push({ x: riderPoints.head.x - hr, y: riderPoints.head.y + hr });
    }

    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allPoints.forEach(function (p) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    var padding = 100;
    var width = maxX - minX + padding * 2;
    var height = maxY - minY + padding * 2;

    // SVG Y is inverted: we flip by using a negative scaleY in the transform
    // viewBox uses the flipped coordinates
    var vbX = minX - padding;
    var vbY = -(maxY + padding);
    svg.setAttribute('viewBox', vbX + ' ' + vbY + ' ' + width + ' ' + height);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Create main group with Y-flip
    var g = svgEl('g', { transform: 'scale(1, -1)' });
    svg.appendChild(g);

    // Ground line
    var groundY = bikePoints.groundY - WHEEL_RADIUS;
    g.appendChild(
      svgEl('line', {
        x1: minX - padding,
        y1: groundY,
        x2: maxX + padding,
        y2: groundY,
        stroke: GROUND_COLOR,
        'stroke-width': '2',
        'stroke-dasharray': '10,5'
      })
    );

    drawBike(g, bikePoints, bikeParams, riderPoints);
    drawRider(g, riderPoints);
  }

  function drawBike(g, pts, params, riderPts) {
    // Wheels
    drawWheel(g, pts.rearAxle);
    drawWheel(g, pts.frontAxle);

    // Frame tubes
    var frameWidth = '4';

    // Chainstays: BB → Rear Axle
    drawLine(g, pts.bb, pts.rearAxle, FRAME_COLOR, frameWidth);

    // Seat stays: Seat Tube Top → Rear Axle
    drawLine(g, pts.seatTubeTop, pts.rearAxle, FRAME_COLOR, frameWidth);

    // Seat tube: BB → Seat Tube Top
    drawLine(g, pts.bb, pts.seatTubeTop, FRAME_COLOR, frameWidth);

    // Seatpost: Seat Tube Top → Saddle (rider hip)
    if (riderPts && riderPts.hip) {
      drawLine(g, pts.seatTubeTop, riderPts.hip, STEM_COLOR, '3');
      // Saddle (small horizontal line at hip)
      g.appendChild(
        svgEl('line', {
          x1: riderPts.hip.x - 40,
          y1: riderPts.hip.y,
          x2: riderPts.hip.x + 40,
          y2: riderPts.hip.y,
          stroke: FRAME_COLOR,
          'stroke-width': '5',
          'stroke-linecap': 'round'
        })
      );
    }

    // Down tube: BB → Head Tube Bottom
    drawLine(g, pts.bb, pts.headTubeBottom, FRAME_COLOR, frameWidth);

    // Top tube: Seat Tube Top → Head Tube Top
    drawLine(g, pts.seatTubeTop, pts.headTubeTop, FRAME_COLOR, frameWidth);

    // Head tube
    drawLine(g, pts.headTubeBottom, pts.headTubeTop, FRAME_COLOR, '6');

    // Fork: Head Tube Bottom → Front Axle
    drawLine(g, pts.headTubeBottom, pts.frontAxle, FORK_COLOR, '3');

    // Stem: Head Tube Top → Handlebar
    drawLine(g, pts.headTubeTop, pts.stemEnd, STEM_COLOR, '3');

    // Handlebar (short horizontal line at stem end)
    g.appendChild(
      svgEl('circle', {
        cx: pts.stemEnd.x,
        cy: pts.stemEnd.y,
        r: '8',
        fill: STEM_COLOR,
        stroke: 'none'
      })
    );

    // BB dot
    g.appendChild(
      svgEl('circle', {
        cx: pts.bb.x,
        cy: pts.bb.y,
        r: '10',
        fill: FRAME_COLOR,
        stroke: 'none'
      })
    );
  }

  function drawWheel(g, center) {
    // Tire
    g.appendChild(
      svgEl('circle', {
        cx: center.x,
        cy: center.y,
        r: WHEEL_RADIUS,
        fill: 'none',
        stroke: TIRE_COLOR,
        'stroke-width': '20'
      })
    );
    // Rim
    g.appendChild(
      svgEl('circle', {
        cx: center.x,
        cy: center.y,
        r: WHEEL_RADIUS - 15,
        fill: WHEEL_FILL,
        stroke: WHEEL_COLOR,
        'stroke-width': '3'
      })
    );
    // Hub
    g.appendChild(
      svgEl('circle', {
        cx: center.x,
        cy: center.y,
        r: '12',
        fill: WHEEL_COLOR,
        stroke: 'none'
      })
    );
    // Spokes (simplified — 8 spokes)
    for (var i = 0; i < 8; i++) {
      var angle = (i * Math.PI) / 4;
      g.appendChild(
        svgEl('line', {
          x1: center.x + 12 * Math.cos(angle),
          y1: center.y + 12 * Math.sin(angle),
          x2: center.x + (WHEEL_RADIUS - 17) * Math.cos(angle),
          y2: center.y + (WHEEL_RADIUS - 17) * Math.sin(angle),
          stroke: WHEEL_COLOR,
          'stroke-width': '1',
          opacity: '0.5'
        })
      );
    }
  }

  function drawRider(g, pts) {
    var lineWidth = '5';

    // Leg: foot → knee → hip
    drawLine(g, pts.foot, pts.knee, RIDER_COLOR, lineWidth);
    drawLine(g, pts.knee, pts.hip, RIDER_COLOR, lineWidth);

    // Torso: hip → shoulder
    drawLine(g, pts.hip, pts.shoulder, RIDER_COLOR, lineWidth);

    // Arms: shoulder → elbow → hand
    drawLine(g, pts.shoulder, pts.elbow, RIDER_COLOR, lineWidth);
    drawLine(g, pts.elbow, pts.hand, RIDER_COLOR, lineWidth);

    // Joints
    var joints = [pts.foot, pts.knee, pts.hip, pts.shoulder, pts.elbow, pts.hand];
    joints.forEach(function (pt) {
      g.appendChild(
        svgEl('circle', {
          cx: pt.x,
          cy: pt.y,
          r: '6',
          fill: RIDER_JOINT,
          stroke: '#ffffff',
          'stroke-width': '2'
        })
      );
    });

    // Head
    g.appendChild(
      svgEl('circle', {
        cx: pts.head.x,
        cy: pts.head.y,
        r: pts.headRadius,
        fill: 'none',
        stroke: RIDER_COLOR,
        'stroke-width': '4'
      })
    );
  }

  function drawLine(g, p1, p2, color, width) {
    g.appendChild(
      svgEl('line', {
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        stroke: color,
        'stroke-width': width,
        'stroke-linecap': 'round'
      })
    );
  }

  window.BikeFit.render = render;
})();
