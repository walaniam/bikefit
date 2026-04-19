// app.js — Main app initialization, event binding, render pipeline
(function () {
  'use strict';

  var BF = window.BikeFit;

  // Input field IDs mapped to parameter paths
  var bikeFields = [
    'headTubeLength',
    'headTubeAngle',
    'seatTubeLength',
    'seatTubeAngle',
    'topTubeEffective',
    'reach',
    'wheelbase',
    'chainstay',
    'stack',
    'bbDrop',
    'stemLength',
    'stemAngle'
  ];

  var riderFields = [
    { id: 'riderHeight', key: 'height' },
    { id: 'riderLegLength', key: 'legLength' },
    { id: 'riderArmLength', key: 'armLength' }
  ];

  var svgEl = document.getElementById('bikeSvg');
  var tableBody = document.getElementById('fitTableBody');
  var resetBtn = document.getElementById('resetBtn');

  /**
   * Populate all input fields from defaults.
   */
  function populateDefaults() {
    var bikeDefs = BF.defaults.bike;
    var riderDefs = BF.defaults.rider;

    bikeFields.forEach(function (field) {
      document.getElementById(field).value = bikeDefs[field];
    });

    riderFields.forEach(function (f) {
      document.getElementById(f.id).value = riderDefs[f.key];
    });
  }

  /**
   * Read all current values from input fields.
   */
  function readValues() {
    var bike = {};
    bikeFields.forEach(function (field) {
      bike[field] = parseFloat(document.getElementById(field).value) || 0;
    });

    var rider = {};
    riderFields.forEach(function (f) {
      rider[f.key] = parseFloat(document.getElementById(f.id).value) || 0;
    });

    return { bike: bike, rider: rider };
  }

  /**
   * Full render pipeline: calculate geometry, recommendations, draw SVG, update table.
   */
  function update() {
    var vals = readValues();

    // Calculate bike frame geometry
    var bikePoints = BF.calculateBikePoints(vals.bike);

    // Calculate fitting recommendations
    var recommendations = BF.calculateRecommendations(vals.rider);

    // Calculate rider geometry (hip at recommended seat height)
    var riderPoints = BF.calculateRiderPoints(
      vals.rider,
      bikePoints,
      recommendations.seatHeight,
      vals.bike.seatTubeAngle
    );

    // Render SVG
    BF.render(svgEl, bikePoints, riderPoints, vals.bike);

    // Update comparison table
    var comparison = BF.compareWithBike(recommendations, vals.bike);
    updateTable(comparison);
  }

  /**
   * Update the comparison table rows.
   */
  function updateTable(rows) {
    tableBody.innerHTML = '';
    rows.forEach(function (row) {
      var tr = document.createElement('tr');

      var tdLabel = document.createElement('td');
      tdLabel.textContent = row.label;
      tr.appendChild(tdLabel);

      var tdActual = document.createElement('td');
      tdActual.textContent = row.actual;
      tr.appendChild(tdActual);

      var tdRec = document.createElement('td');
      tdRec.textContent = row.recommended;
      tr.appendChild(tdRec);

      var tdStatus = document.createElement('td');
      var badge = document.createElement('span');
      badge.className = 'status-badge status-' + row.status;
      badge.textContent = statusLabel(row.status);
      tdStatus.appendChild(badge);
      tr.appendChild(tdStatus);

      tableBody.appendChild(tr);
    });
  }

  function statusLabel(status) {
    switch (status) {
      case 'good':
        return '✓ Good';
      case 'warn':
        return '~ Close';
      case 'bad':
        return '✗ Off';
      case 'info':
        return 'ℹ Info';
      default:
        return status;
    }
  }

  // Event listeners
  bikeFields.forEach(function (field) {
    document.getElementById(field).addEventListener('input', update);
  });
  riderFields.forEach(function (f) {
    document.getElementById(f.id).addEventListener('input', update);
  });

  resetBtn.addEventListener('click', function () {
    populateDefaults();
    update();
  });

  // Initialize
  populateDefaults();
  update();
})();
