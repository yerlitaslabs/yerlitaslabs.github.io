/*
 * Playable teaser: a real Tessera board in miniature. Three mirrors stand wrong; each tap turns one 90 degrees, and three
 * taps carry the light from the pulsar to the galaxy. Nothing is stored or sent, and no library is used.
 * When the game is live on Google Play: set PLAY_LINK, and the last line of the board becomes the way to it.
 */
(function () {
  'use strict';
  var PLAY_LINK = '';
  var T = {
    en: { goal: 'Try it: bring the light to the galaxy in 3 turns', hint: 'Tap a mirror to turn it', status: 'Turns {n} · fewest 3', perfect: 'Perfect! Three stars', solved: 'Circuit complete in {n} turns. The fewest is 3', again: 'Play again', soon: '1,000 levels are coming to Google Play', play: 'Play 1,000 levels on Google Play', mirror: 'Mirror {n}' },
    tr: { goal: 'Dene: ışığı 3 döndürmede gökadaya ulaştır', hint: 'Döndürmek için aynaya dokun', status: 'Döndürme {n} · en az 3', perfect: 'Kusursuz! Üç yıldız', solved: 'Devre {n} döndürmede tamamlandı. En azı 3', again: 'Tekrar oyna', soon: "1000 seviye yakında Google Play'de", play: "1000 seviyeyi Google Play'de oyna", mirror: 'Ayna {n}' },
    de: { goal: 'Probier es: Bring das Licht in 3 Zügen zur Galaxie', hint: 'Tippe auf einen Spiegel, um ihn zu drehen', status: 'Züge {n} · mindestens 3', perfect: 'Perfekt! Drei Sterne', solved: 'Stromkreis in {n} Zügen geschlossen. Mindestens sind es 3', again: 'Nochmal spielen', soon: '1.000 Level kommen bald zu Google Play', play: '1.000 Level bei Google Play spielen', mirror: 'Spiegel {n}' },
    fr: { goal: 'Essayez : menez la lumière à la galaxie en 3 rotations', hint: 'Touchez un miroir pour le tourner', status: 'Rotations {n} · minimum 3', perfect: 'Parfait ! Trois étoiles', solved: 'Circuit fermé en {n} rotations. Le minimum est 3', again: 'Rejouer', soon: '1 000 niveaux bientôt sur Google Play', play: 'Jouer aux 1 000 niveaux sur Google Play', mirror: 'Miroir {n}' },
    es: { goal: 'Pruébalo: lleva la luz a la galaxia en 3 giros', hint: 'Toca un espejo para girarlo', status: 'Giros {n} · mínimo 3', perfect: '¡Perfecto! Tres estrellas', solved: 'Circuito cerrado en {n} giros. El mínimo es 3', again: 'Jugar otra vez', soon: '1000 niveles pronto en Google Play', play: 'Juega 1000 niveles en Google Play', mirror: 'Espejo {n}' }
  };
  var t = T[(document.documentElement.lang || 'en').slice(0, 2)] || T.en;
  var fill = function (text, n) { return text.replace('{n}', n); };

  var N = 6;
  var SOURCE = { x: -1, y: 1, dx: 1, dy: 0 };
  var SOCKET = { x: 5, y: N };
  /* slash: true is "/", false is "\". Only the first three stand on the way; the two others are there to be left alone. */
  var START = [
    { x: 3, y: 1, slash: true }, { x: 3, y: 4, slash: true }, { x: 5, y: 4, slash: true },
    { x: 1, y: 3, slash: false }, { x: 4, y: 2, slash: true }
  ];
  var AMBER = '#ffb45c', GOLD = '#ffd873', PEARL = '#f4ebd9';

  var root = document.getElementById('demo');
  if (!root) return;
  var canvas = root.querySelector('canvas');
  var note = root.querySelector('.d-note');
  var done = root.querySelector('.d-done');
  var cta = root.querySelector('.d-cta');
  var again = root.querySelector('.d-again');
  root.querySelector('.d-goal').textContent = t.goal;
  again.textContent = t.again;
  if (PLAY_LINK) {
    cta.href = PLAY_LINK;
    cta.textContent = t.play;
  } else {
    cta.removeAttribute('href');
    cta.textContent = t.soon;
    cta.classList.add('d-soon');
  }

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var g = canvas.getContext('2d');
  var mirrors, turns, solvedAt, size, cell, pad, frame = 0;

  /* The ray from the pulsar: its corners, and whether it reached the socket. */
  function trace() {
    var x = SOURCE.x, y = SOURCE.y, dx = SOURCE.dx, dy = SOURCE.dy, points = [[x, y]];
    for (var i = 0; i < 40; i++) {
      x += dx; y += dy;
      if (x === SOCKET.x && y === SOCKET.y) { points.push([x, y]); return { points: points, lit: true }; }
      if (x < 0 || y < 0 || x >= N || y >= N) { points.push([x, y]); return { points: points, lit: false }; }
      for (var m = 0; m < mirrors.length; m++) {
        if (mirrors[m].x === x && mirrors[m].y === y) {
          var ox = dx, oy = dy;
          if (mirrors[m].slash) { dx = -oy; dy = -ox; } else { dx = oy; dy = ox; }
          points.push([x, y]);
          break;
        }
      }
    }
    return { points: points, lit: false };
  }

  function px(c) { return pad + (c + 0.5) * cell; }

  function drawBoard() {
    g.fillStyle = '#10121b';
    roundRect(pad - 2, pad - 2, cell * N + 4, cell * N + 4, cell * 0.25);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.05)';
    g.lineWidth = 1;
    for (var i = 1; i < N; i++) {
      line(pad + i * cell, pad, pad + i * cell, pad + N * cell);
      line(pad, pad + i * cell, pad + N * cell, pad + i * cell);
    }
  }

  function line(x1, y1, x2, y2) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }

  function roundRect(x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function drawRay(points, now) {
    var run = function (width, color, blur) {
      g.save();
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.lineWidth = width;
      g.strokeStyle = color;
      g.shadowColor = AMBER;
      g.shadowBlur = blur;
      g.beginPath();
      points.forEach(function (p, i) {
        var x = px(p[0]), y = px(p[1]);
        if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
      });
      g.stroke();
      g.restore();
    };
    run(cell * 0.2, 'rgba(255,180,92,0.22)', cell * 0.5);
    run(cell * 0.07, AMBER, cell * 0.3);
    run(cell * 0.03, '#fff6e6', 0);
    if (still) return;
    /* The light flows: small beads run along the ray, as in the game. */
    var total = 0, lengths = [];
    for (var i = 1; i < points.length; i++) {
      var d = Math.abs(points[i][0] - points[i - 1][0]) + Math.abs(points[i][1] - points[i - 1][1]);
      lengths.push(d); total += d;
    }
    for (var b = 0; b < 4; b++) {
      var along = ((now / 700 + b * total / 4) % total), at = along, s = 0;
      while (s < lengths.length - 1 && at > lengths[s]) { at -= lengths[s]; s++; }
      var k = at / lengths[s], from = points[s], to = points[s + 1];
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(px(from[0] + (to[0] - from[0]) * k), px(from[1] + (to[1] - from[1]) * k), cell * 0.045, 0, 7);
      g.fill();
    }
  }

  function drawMirror(m, now) {
    var turn = m.turnAt ? Math.min(1, (now - m.turnAt) / 170) : 1;
    if (still) turn = 1;
    var eased = 1 - Math.pow(1 - turn, 3);
    var angle = (m.slash ? -45 : 45) + (1 - eased) * -90;
    var x = px(m.x), y = px(m.y);
    g.fillStyle = 'rgba(255,255,255,0.05)';
    roundRect(x - cell * 0.42, y - cell * 0.42, cell * 0.84, cell * 0.84, cell * 0.14);
    g.fill();
    g.save();
    g.translate(x, y);
    g.rotate(angle * Math.PI / 180);
    g.lineCap = 'round';
    g.strokeStyle = PEARL;
    g.lineWidth = cell * 0.075;
    g.shadowColor = 'rgba(255,255,255,0.5)';
    g.shadowBlur = cell * 0.12;
    line(-cell * 0.34, 0, cell * 0.34, 0);
    g.restore();
  }

  function glow(x, y, r, color) {
    var grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'rgba(255,180,92,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, 7);
    g.fill();
  }

  function drawPulsar(now) {
    var x = px(SOURCE.x) + cell * 0.1, y = px(SOURCE.y);
    glow(x, y, cell * 0.8, 'rgba(255,180,92,0.5)');
    g.strokeStyle = AMBER;
    g.lineWidth = cell * 0.035;
    for (var i = 0; i < 2; i++) {
      g.save();
      g.translate(x, y);
      g.rotate((still ? 0.6 : now / 900) + i * 1.57);
      g.beginPath();
      g.ellipse(0, 0, cell * 0.36, cell * 0.14, 0, 0, 7);
      g.stroke();
      g.restore();
    }
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(x, y, cell * 0.1, 0, 7);
    g.fill();
  }

  function drawGalaxy(lit, now) {
    var x = px(SOCKET.x), y = px(SOCKET.y) - cell * 0.1;
    if (!lit) {
      g.strokeStyle = AMBER;
      g.lineWidth = cell * 0.07;
      g.beginPath();
      g.arc(x, y, cell * 0.28, 0, 7);
      g.stroke();
      g.fillStyle = '#05060b';
      g.beginPath();
      g.arc(x, y, cell * 0.25, 0, 7);
      g.fill();
      return;
    }
    glow(x, y, cell * 1.1, 'rgba(255,216,115,0.7)');
    g.save();
    g.translate(x, y);
    g.rotate(still ? 0 : now / 700);
    g.strokeStyle = GOLD;
    g.lineWidth = cell * 0.05;
    for (var arm = 0; arm < 3; arm++) {
      g.rotate(2.094);
      g.beginPath();
      for (var a = 0; a < 26; a++) {
        var r = cell * 0.06 + a * cell * 0.016, th = a * 0.2;
        if (a === 0) g.moveTo(Math.cos(th) * r, Math.sin(th) * r); else g.lineTo(Math.cos(th) * r, Math.sin(th) * r);
      }
      g.stroke();
    }
    g.restore();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(x, y, cell * 0.11, 0, 7);
    g.fill();
  }

  /* The nova: a ring of light opening from the galaxy once the circuit closes. */
  function drawNova(now) {
    var k = (now - solvedAt) / 1200;
    if (k >= 1 || k < 0) return;
    var x = px(SOCKET.x), y = px(SOCKET.y);
    g.strokeStyle = 'rgba(255,216,115,' + (1 - k) + ')';
    g.lineWidth = cell * 0.2 * (1 - k);
    g.beginPath();
    g.arc(x, y, size * 1.1 * (1 - Math.pow(1 - k, 3)), 0, 7);
    g.stroke();
  }

  function draw(now) {
    g.clearRect(0, 0, size, size);
    var ray = trace();
    drawBoard();
    drawRay(ray.points, now);
    mirrors.forEach(function (m) { drawMirror(m, now); });
    drawPulsar(now);
    drawGalaxy(ray.lit, now);
    if (solvedAt) drawNova(now);
  }

  function loop(now) {
    draw(now);
    frame = requestAnimationFrame(loop);
  }

  function resize() {
    var width = canvas.clientWidth || 340;
    var ratio = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(width * ratio);
    canvas.height = canvas.width;
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    size = width;
    pad = width * 0.11;
    cell = (width - pad * 2) / N;
    root.querySelectorAll('.d-mirror').forEach(function (b, i) {
      var m = START[i];
      b.style.left = (pad + m.x * cell) + 'px';
      b.style.top = (pad + m.y * cell) + 'px';
      b.style.width = b.style.height = cell + 'px';
    });
    if (still) draw(0);
  }

  function status() {
    if (solvedAt) {
      note.textContent = turns === 3 ? '★★★ ' + t.perfect : fill(t.solved, turns);
      done.hidden = false;
    } else {
      note.textContent = turns === 0 ? t.hint : fill(t.status, turns);
      done.hidden = true;
    }
  }

  function tap(i) {
    if (solvedAt) return;
    var m = mirrors[i];
    m.slash = !m.slash;
    m.turnAt = performance.now();
    turns++;
    if (trace().lit) solvedAt = performance.now();
    status();
    if (still) draw(0);
  }

  function start() {
    mirrors = START.map(function (m) { return { x: m.x, y: m.y, slash: m.slash, turnAt: 0 }; });
    turns = 0;
    solvedAt = 0;
    status();
    if (still) draw(0);
  }

  var board = root.querySelector('.d-board');
  START.forEach(function (m, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'd-mirror';
    b.setAttribute('aria-label', fill(t.mirror, i + 1));
    b.addEventListener('click', function () { tap(i); });
    board.appendChild(b);
  });
  again.addEventListener('click', start);
  window.addEventListener('resize', resize);
  start();
  resize();
  if (!still) frame = requestAnimationFrame(loop);
  /* Off screen, nothing is drawn. */
  document.addEventListener('visibilitychange', function () {
    if (still) return;
    cancelAnimationFrame(frame);
    if (!document.hidden) frame = requestAnimationFrame(loop);
  });
})();
