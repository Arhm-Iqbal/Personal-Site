/* Motion scores are placed in each original photograph's coordinates.
   These are stylised interpretations, not simulations of astronomical speed.
   Shared drawing primitives are arranged and timed separately for every image.

   Each score is also compiled into lanes that follow its structures. A lane
   carries its symbols along at its own speed, so every photograph moves in
   its own way: symbols climbing a pillar rim, orbiting a disk, leaving a shell. */
(() => {
  const stream = (points, width, amount, seconds, phase = 0) => ({ type: 'stream', points, width, amount, seconds, phase });
  const ring = (center, radius, tilt, width, amount, seconds, phase = 0) => ({ type: 'ring', center, radius, tilt, width, amount, seconds, phase });
  const shell = (center, radius, tilt, width, amount, seconds, phase = 0) => ({ type: 'shell', center, radius, tilt, width, amount, seconds, phase });
  // A shell that takes its shape from the photograph itself, not from an
  // ellipse: its fronts expand in the outline of the object (see outline below).
  const traced = (center, width, amount, seconds, phase = 0) => ({ type: 'shell', traced: true, center, radius: [.3, .3], tilt: 0, width, amount, seconds, phase });
  // A shell whose fronts start at a light source and spread through the cloud,
  // bending around its bright and dark regions (see spread below).
  const glow = (center, amount, seconds, phase = 0) => ({ type: 'shell', glow: true, center, radius: [.3, .3], tilt: 0, width: .5, amount, seconds, phase });
  // A spiral: lanes wind out of (or into) an event horizon along logarithmic
  // arms, the way Hawking radiation might peel away from a black hole. wind
  // sets how tightly the arms coil; a negative period sends symbols inward.
  const spiral = (center, radius, tilt, width, amount, seconds, phase = 0, wind = 2) => ({ type: 'spiral', center, radius, tilt, width, amount, seconds, phase, wind });
  const score = (name, stars, layers) => ({ name, stars, layers });
  const profiles = {
    'eagle-nebula': score('Three rising pillar rims', .10, [
      stream([[.26,.79],[.25,.52],[.28,.35],[.29,.20],[.40,.13],[.46,.18]],.075,9,8),
      stream([[.43,.91],[.47,.66],[.49,.45],[.54,.34],[.60,.27]],.065,8,10,1.4),
      stream([[.68,.72],[.69,.58],[.67,.49],[.70,.42]],.045,6,7,3),
      stream([[.12,.57],[.23,.41],[.20,.23],[.30,.04]],.18,4,15,2)]),
    'orion-nebula': score('Trapezium cavity and sweeping dust fan', .16, [
      glow([.453,.445],7,13),
      stream([[.49,.48],[.59,.39],[.79,.44],[.91,.63]],.12,8,10,1),
      stream([[.47,.47],[.34,.63],[.30,.87]],.10,7,8,2.6),
      ring([.32,.19],[.12,.10],.1,.35,4,9)]),
    'whirlpool-galaxy': score('M51 arms and companion bridge', .06, [
      stream([[.39,.49],[.47,.56],[.43,.69],[.30,.71],[.21,.58],[.21,.40],[.32,.23],[.51,.17],[.70,.21],[.82,.30]],.065,9,12),
      stream([[.39,.49],[.30,.41],[.31,.29],[.48,.25],[.63,.39],[.61,.62],[.43,.82],[.21,.87],[.06,.76]],.055,7,10,2.5),
      stream([[.65,.20],[.74,.24],[.82,.31]],.06,5,15,1.2),
      ring([.83,.32],[.10,.13],0,.35,3,18)]),
    'crab-nebula': score('Pulsar cavity and branching filaments', .13, [
      traced([.52,.50],.5,9,10),
      stream([[.51,.54],[.35,.59],[.22,.72],[.10,.69]],.065,7,8),
      stream([[.55,.46],[.65,.31],[.78,.24],[.83,.12]],.07,8,9,2),
      stream([[.56,.55],[.73,.62],[.82,.72]],.08,6,12,4)]),
    'helix-nebula': score('Helix inner ring and outer envelope', .10, [
      ring([.50,.49],[.28,.32],.30,.34,8,15),
      shell([.50,.49],[.34,.38],.30,.22,5,21,2.1),
      ring([.50,.49],[.20,.23],.30,.25,4,-18,3.2)]),
    'sombrero-galaxy': score('Thin dust lane and luminous bulge', .08, [
      stream([[.10,.43],[.30,.49],[.52,.54],[.76,.57],[.92,.57]],.035,8,13),
      ring([.51,.49],[.37,.075],.15,.33,5,21,1),
      shell([.51,.43],[.18,.14],.1,.45,2.5,19,3)]),
    'space-heic2007a': score('Red reef currents and blue satellite whirl', .12, [
      stream([[.02,.06],[.16,.27],[.32,.46],[.54,.54],[.75,.43],[.88,.21]],.09,9,12),
      stream([[.38,.08],[.40,.29],[.54,.51],[.77,.63]],.08,6,9,2),
      ring([.19,.75],[.115,.085],.3,.45,6,-11),
      stream([[.66,.10],[.75,.22],[.82,.38]],.1,4,15,4)]),
    'space-heic1509a': score('Westerlund star chorus and illuminated ridge', .28, [
      stream([[.26,.07],[.23,.30],[.29,.50],[.49,.62],[.73,.71]],.105,8,11),
      stream([[.31,.35],[.48,.34],[.53,.45],[.65,.52]],.065,5,8,2.2),
      shell([.57,.43],[.22,.27],-.15,.36,3.5,17)]),
    'space-heic1608a': score('Bubble wall circulation and upper plume', .14, [
      ring([.54,.58],[.30,.31],-.2,.20,8,17),
      shell([.54,.58],[.28,.29],-.2,.20,4,23,2),
      stream([[.08,.12],[.28,.24],[.37,.39],[.54,.43]],.11,7,10,3)]),
    'space-potw1345a': score('Antennae collision knots and opposing tails', .11, [
      stream([[.57,.41],[.67,.27],[.59,.16],[.39,.21],[.30,.40],[.36,.59],[.53,.71],[.57,.90]],.085,9,13),
      stream([[.54,.41],[.44,.46],[.37,.62],[.40,.79]],.07,7,-10,1),
      ring([.52,.39],[.16,.18],.3,.45,5,9,3)]),
    'space-heic1307a': score('Horsehead crest and drifting illuminated veil', .09, [
      stream([[.17,.78],[.25,.48],[.23,.30],[.38,.16],[.67,.19],[.80,.30]],.06,9,11),
      stream([[.71,.88],[.67,.62],[.70,.40],[.79,.29]],.075,6,-14,2),
      stream([[.04,.61],[.24,.59],[.39,.50],[.46,.34]],.15,4,18,4)]),
    'space-heic0817a': score('Perseus red filaments around a steady core', .16, [
      stream([[.49,.51],[.37,.38],[.33,.20],[.43,.08]],.045,7,11),
      stream([[.54,.50],[.65,.58],[.68,.77],[.75,.90]],.05,8,13,1.6),
      stream([[.47,.56],[.41,.73],[.28,.84]],.04,5,9,3),
      shell([.50,.48],[.17,.15],0,.4,2,19)]),
    'space-heic0406a': score('Deep-field islands with independent stellar cadence', .32, [
      ring([.31,.22],[.045,.055],.3,.7,2.5,13),
      ring([.57,.67],[.06,.035],-.4,.6,2,17,2),
      ring([.76,.46],[.035,.06],.2,.6,2.5,-15,4)]),
    'space-potw2049a': score('NGC 1792 blue lanes around its orange spine', .08, [
      ring([.51,.51],[.36,.20],-.40,.38,8,17),
      stream([[.15,.66],[.34,.54],[.58,.42],[.82,.36]],.055,6,10,2),
      stream([[.25,.74],[.49,.67],[.73,.54],[.90,.37]],.06,5,13,4)]),
    'space-heic1917a': score('Saturn counter-moving cloud belts and ring shear', 0, [
      stream([[.40,.47],[.49,.49],[.60,.47]],.018,6,10),
      stream([[.40,.51],[.50,.53],[.60,.51]],.016,5,-13,2),
      stream([[.42,.55],[.50,.57],[.58,.55]],.014,4,15,3),
      ring([.50,.51],[.22,.115],-.16,.12,5,22)]),
    'space-heic0702a': score('NGC 602 cavity rim and local young-star glints', .26, [
      ring([.51,.49],[.31,.36],.12,.19,7,16),
      stream([[.78,.20],[.84,.40],[.80,.61],[.64,.78]],.05,6,10,1),
      stream([[.21,.51],[.26,.29],[.43,.18]],.06,5,-14,3)]),
    'space-heic1808a': score('Lagoon vertical dust channels and central eddy', .16, [
      stream([[.58,.91],[.57,.68],[.52,.47],[.44,.27],[.50,.06]],.10,10,13),
      stream([[.19,.73],[.32,.53],[.35,.28],[.28,.05]],.085,7,11,2),
      ring([.50,.43],[.17,.12],-.4,.45,5,9,4)]),
    'space-potw1811a': score('NGC 1015 bar-fed inner ring and outer arms', .07, [
      ring([.51,.50],[.24,.31],.12,.35,7,19),
      stream([[.38,.51],[.48,.48],[.61,.51]],.06,5,10),
      ring([.51,.50],[.36,.43],.12,.16,4,-27,2)]),
    'space-heic0910h': score('Butterfly paired lobes and pinched waist', .05, [
      stream([[.48,.51],[.60,.41],[.69,.25],[.73,.08]],.085,10,10),
      stream([[.48,.51],[.37,.62],[.28,.79],[.24,.94]],.08,10,12,1.6),
      stream([[.46,.49],[.55,.61],[.59,.77]],.045,5,8,3)]),
    'space-heic0514a': score('NGC 346 arched ridge and star-lit interior', .25, [
      stream([[.13,.62],[.29,.38],[.52,.27],[.77,.20],[.87,.39]],.07,8,13),
      stream([[.25,.78],[.43,.58],[.63,.44],[.83,.47]],.07,6,11,2.5),
      shell([.50,.49],[.25,.23],-.3,.32,3.5,17)]),
    'space-heic0506b': score('Eagle spire ascending rim and bowed cap', .11, [
      stream([[.36,.91],[.42,.69],[.46,.47],[.47,.24],[.51,.08]],.055,10,12),
      stream([[.62,.88],[.58,.64],[.58,.41],[.63,.23],[.54,.10]],.05,7,-15,2),
      ring([.53,.19],[.13,.09],.3,.4,4,9,4)]),
    'space-opo0511a': score('NGC 1316 dust hooks in a quiet stellar envelope', .08, [
      stream([[.35,.25],[.49,.38],[.57,.48],[.63,.59],[.60,.73]],.035,7,12),
      stream([[.29,.53],[.42,.44],[.53,.47],[.49,.61]],.045,6,-14,2.5),
      ring([.50,.48],[.21,.24],.3,.35,2,23)]),
    'space-heic0503a': score('V838 nested light-echo arcs', .22, [
      shell([.51,.48],[.19,.18],.2,.20,6,13),
      shell([.51,.48],[.31,.29],.2,.18,7,18,2),
      ring([.51,.48],[.38,.36],.2,.18,4,-23,4)]),
    'space-opo0501a': score('NGC 1300 long bar and two returning arms', .06, [
      stream([[.29,.36],[.45,.43],[.60,.51],[.73,.55]],.05,7,14),
      stream([[.73,.55],[.77,.34],[.60,.23],[.35,.23],[.17,.37]],.055,9,18,1),
      stream([[.29,.36],[.20,.56],[.39,.73],[.68,.75],[.84,.62]],.055,8,-20,3)]),
    'space-heic0206a': score('Tadpole winding head and long tidal wake', .10, [
      ring([.27,.24],[.12,.08],.65,.36,5,13),
      stream([[.31,.28],[.43,.44],[.55,.66],[.69,.91]],.045,10,18,1.5),
      stream([[.36,.25],[.47,.35],[.61,.51]],.035,4,12,3)]),
    'space-heic0206c': score('Cone cap abrasion and rising illuminated edges', .14, [
      stream([[.24,.94],[.32,.70],[.38,.43],[.40,.20],[.54,.13],[.62,.24]],.055,9,14),
      stream([[.73,.87],[.68,.65],[.65,.41],[.62,.24]],.06,7,-12,2),
      shell([.50,.19],[.14,.10],0,.4,4,17,4)]),
    'space-heic0206b': score('Mice opposing tidal tails and shared bridge', .08, [
      stream([[.39,.48],[.32,.59],[.23,.72],[.10,.76]],.035,8,13),
      stream([[.55,.51],[.67,.40],[.81,.27],[.97,.15]],.035,9,17,1.5),
      stream([[.38,.50],[.46,.55],[.55,.51]],.045,4,9,3)]),
    'space-heic0109a': score('Red Spider four unequal outflow branches', .06, [
      stream([[.49,.49],[.35,.35],[.22,.33],[.10,.43]],.04,10,10),
      stream([[.49,.49],[.66,.36],[.82,.30],[.94,.35]],.04,8,12,2),
      stream([[.49,.50],[.35,.62],[.18,.62],[.05,.55]],.04,7,13,3),
      stream([[.49,.50],[.62,.65],[.80,.70],[.96,.63]],.04,9,11,4.5)]),
    'space-opo0006a': score('Carina ragged front and blue-lit western wall', .10, [
      stream([[.88,.93],[.71,.73],[.59,.48],[.60,.25],[.54,.04]],.10,9,14),
      stream([[.28,.92],[.34,.68],[.30,.43],[.21,.24]],.08,7,-12,2),
      stream([[.14,.55],[.29,.39],[.49,.32],[.64,.42]],.07,5,10,4)]),
    'space-heic2105a': score('AG Carinae compact asymmetric shell', .15, [
      shell([.52,.50],[.19,.22],-.25,.27,7,14),
      ring([.52,.50],[.23,.26],-.25,.22,5,-19,2),
      shell([.52,.50],[.11,.13],-.25,.3,3,10,4)]),
    'space-heic1302a': score('Messier 106 dusty disk and anomalous red arms', .08, [
      ring([.51,.48],[.37,.20],-.57,.30,7,20),
      stream([[.49,.49],[.46,.32],[.59,.20],[.76,.16]],.035,9,12),
      stream([[.51,.51],[.53,.66],[.39,.80],[.22,.83]],.035,8,15,2.5)]),
    'space-heic1105a': score('Tarantula converging web around the central cluster', .29, [
      stream([[.12,.18],[.32,.34],[.50,.49],[.69,.59],[.87,.83]],.055,8,11),
      stream([[.87,.14],[.71,.31],[.50,.49],[.34,.69],[.13,.86]],.055,9,-13,2),
      ring([.51,.49],[.24,.29],.2,.30,4,18,4)]),
    'space-heic1104a': score('NGC 2841 fine flocculent lanes around a stable bulge', .06, [
      ring([.50,.49],[.36,.18],.60,.30,5,24),
      ring([.50,.49],[.27,.12],.60,.22,6,18,2),
      stream([[.18,.24],[.34,.43],[.57,.58],[.81,.70]],.035,4,-13,4)]),
    'space-heic1007a': score('Mystic Mountain three ridges and upper jet', .15, [
      stream([[.23,.93],[.30,.72],[.25,.58],[.40,.48],[.47,.58]],.05,8,12),
      stream([[.59,.94],[.59,.69],[.64,.48],[.63,.29],[.68,.13]],.045,10,14,1.7),
      stream([[.83,.90],[.78,.70],[.86,.53],[.76,.46]],.05,6,-10,3.5),
      stream([[.65,.27],[.72,.18],[.78,.08]],.025,7,8,2)]),
    'space-heic0910s': score('NGC 6217 compact S arms', .10, [
      stream([[.51,.50],[.58,.35],[.49,.20],[.31,.24]],.05,7,13),
      stream([[.51,.50],[.43,.65],[.56,.78],[.72,.69]],.05,8,16,2),
      ring([.51,.50],[.14,.25],.37,.25,3,-20,4)]),
    'space-heic0910i': score('Stephan quintet separate disks and interaction bridges', .12, [
      ring([.28,.37],[.11,.18],-.65,.4,5,16),
      ring([.68,.24],[.09,.12],.2,.4,4,-19,1),
      ring([.64,.63],[.12,.15],.3,.4,5,14,3),
      stream([[.38,.39],[.50,.43],[.63,.54],[.65,.65]],.04,7,12,2)]),
    'space-heic0719a': score('Messier 74 multiple loose spiral lanes', .09, [
      stream([[.36,.45],[.30,.30],[.45,.17],[.69,.23],[.82,.42],[.78,.68]],.05,8,18),
      stream([[.36,.45],[.47,.54],[.41,.70],[.21,.71],[.10,.48],[.15,.24]],.05,7,-21,2),
      ring([.36,.45],[.16,.17],0,.3,4,13,4)]),
    'space-heic0707a': score('Carina panoramic channels and central excavation', .24, [
      stream([[.02,.35],[.19,.44],[.37,.52],[.56,.43],[.76,.29],[.98,.37]],.075,8,16),
      stream([[.34,.95],[.39,.73],[.42,.52],[.47,.29],[.43,.03]],.08,9,-13,2),
      shell([.42,.51],[.13,.21],-.2,.3,4,19,4)]),
    'space-heic0706a': score('NGC 1672 bar with offset star-forming ends', .11, [
      stream([[.35,.64],[.48,.52],[.62,.38]],.045,6,12),
      stream([[.62,.38],[.70,.25],[.48,.17],[.24,.32],[.21,.57]],.055,8,19,1.5),
      stream([[.35,.64],[.48,.79],[.73,.69],[.84,.42]],.055,9,-22,3)]),
    'space-heic0604a': score('M82 disk shear and two narrow red superwinds', .08, [
      stream([[.18,.64],[.36,.57],[.53,.46],[.80,.33]],.035,7,15),
      stream([[.48,.49],[.43,.32],[.40,.13]],.065,10,11),
      stream([[.51,.50],[.57,.67],[.62,.89]],.065,9,13,2.6)]),
    'space-heic0602a': score('Pinwheel uneven outer arms and clustered knots', .13, [
      stream([[.50,.51],[.39,.42],[.39,.23],[.64,.15],[.85,.32],[.78,.60]],.05,8,20),
      stream([[.50,.51],[.61,.58],[.52,.78],[.25,.79],[.12,.51],[.23,.26]],.055,9,-23,2),
      ring([.50,.51],[.16,.16],0,.28,4,14,4)]),
    'space-heic1520a': score('Veil separated red and blue braided shock filaments', .12, [
      stream([[.02,.91],[.23,.70],[.46,.54],[.67,.29],[.98,.08]],.025,11,14),
      stream([[.03,.97],[.28,.80],[.52,.63],[.76,.40],[.99,.28]],.025,8,-17,1.8),
      stream([[.16,.89],[.38,.77],[.58,.67],[.82,.51],[.97,.41]],.023,6,12,3.5)]),
    // Black holes. Each horizon sheds a spiral of symbols, wound differently for each.
    'space-svs13326': score('Hawking spiral shed from a lensed accretion disk', .04, [
      spiral([.50,.52],[.085,.065],0,.9,10,8,0,2.4),
      ring([.50,.53],[.31,.12],0,.22,8,-13),
      ring([.50,.47],[.14,.11],0,.16,5,9,2),
      spiral([.50,.52],[.36,.15],0,.45,5,-17,3,-1.3)]),
    'space-eso1907a': score('M87* photon ring shedding a slow outward spiral', .03, [
      spiral([.50,.44],[.075,.13],0,1.1,10,9,0,2.8),
      ring([.50,.44],[.09,.155],0,.3,7,-11,1),
      spiral([.50,.44],[.17,.29],0,.5,4,-19,2,-1.7)]),
    'space-eso2208-eht-mwa': score('Sagittarius A* knots orbiting a counter-wound spiral', .03, [
      spiral([.50,.49],[.11,.11],0,1,10,10,1,-2.5),
      ring([.50,.49],[.22,.22],0,.28,8,12),
      glow([.61,.36],4,16,2),
      glow([.61,.66],3,18,3.5)]),
    'space-eso2105a': score('Polarised M87* field lines coiling off the horizon', .03, [
      spiral([.50,.43],[.10,.10],0,1.1,11,9,0,3.4),
      ring([.50,.45],[.24,.24],0,.25,6,-15,2),
      stream([[.71,.38],[.67,.57],[.53,.66],[.36,.62]],.07,7,8,3)]),
    'space-opo0020a': score('M87 core spiral launching its blue jet', .14, [
      spiral([.18,.185],[.04,.04],0,1.4,8,7,1,2.2),
      stream([[.18,.18],[.27,.28],[.37,.36],[.46,.47],[.56,.54],[.63,.60],[.67,.67]],.045,10,7),
      shell([.18,.18],[.32,.32],0,.4,3,21,2)]),
    'space-weic2615a': score('Centaurus A warped disk around a radiating core', .10, [
      ring([.49,.52],[.42,.20],-.10,.30,7,20),
      stream([[.12,.62],[.32,.56],[.49,.50],[.66,.45],[.88,.40]],.06,8,13,1),
      spiral([.49,.50],[.05,.12],0,.9,8,8,2,2.2)]),
    // Planets. Bands, storms and rings each keep their own motion.
    'space-heic1708a': score('Jupiter counter-flowing zonal jets and Great Red Spot', .02, [
      stream([[.16,.30],[.50,.28],[.84,.30]],.025,6,11),
      stream([[.12,.38],[.50,.36],[.88,.38]],.03,7,-9,1),
      stream([[.11,.47],[.50,.46],[.89,.47]],.025,5,13,2),
      stream([[.12,.56],[.50,.56],[.88,.56]],.03,7,-10,3),
      stream([[.15,.66],[.50,.67],[.85,.66]],.025,5,12,4),
      ring([.265,.605],[.05,.035],0,.5,7,-6),
      ring([.67,.68],[.025,.02],0,.5,4,-5,2)]),
    'space-opo0124a': score('Mars turning under its polar caps and dust', .02, [
      stream([[.10,.40],[.50,.37],[.90,.40]],.08,6,16),
      stream([[.08,.60],[.50,.62],[.92,.60]],.08,6,18,2),
      ring([.50,.11],[.20,.05],0,.35,5,-10,1),
      ring([.50,.90],[.24,.05],0,.35,4,12,3),
      traced([.50,.50],.4,4,19,2)]),
    'space-weic2214a': score('Neptune ring shear and Triton’s starburst spikes', .2, [
      ring([.555,.62],[.17,.05],-.05,.12,8,12),
      ring([.555,.615],[.06,.05],0,.4,5,-9,1),
      stream([[.38,.23],[.38,.02]],.02,6,7),
      stream([[.38,.23],[.38,.45]],.02,6,7,1),
      stream([[.38,.23],[.12,.23]],.02,5,8,2),
      stream([[.38,.23],[.64,.23]],.02,5,8,3)]),
    'space-weic2332a': score('Uranus nested rings counter-rotating around a bright pole', .1, [
      ring([.49,.52],[.19,.27],0,.12,8,15),
      ring([.49,.52],[.215,.30],0,.1,5,-21,1),
      ring([.49,.52],[.07,.10],0,.5,5,9,2),
      glow([.52,.48],4,14,3)])
  };

  const KIND = { stream: 1, ring: 2, shell: 3, spiral: 4 };
  const LANE = 15;   // width of one lane, in screen pixels
  const STEP = 10;   // distance a symbol travels before the next one takes its cell
  const hash2 = (a, b) => {
    let n = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x45d9f3b); n ^= n >>> 13;
    return (n >>> 0) / 4294967296;
  };

  // Measure the object's edge from the photograph: for each bearing around
  // the centre, how far out its light reaches. Stars poking past the edge are
  // filtered out, and the result is smoothed into one closed outline.
  function outline(photo, center) {
    const { light, w, h } = photo, K = 120;
    const sorted = Float32Array.from(light).sort();
    const level = Math.max(.06, sorted[Math.floor(sorted.length * .98)] * .22);
    const cx = center[0] * w, cy = center[1] * h;
    let reachOf = new Float32Array(K);
    for (let k = 0; k < K; k++) {
      const a = k / K * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
      let last = 1;
      for (let r = 1; ; r += .5) {
        const x = Math.floor(cx + ca * r), y = Math.floor(cy + sa * r);
        if (x < 0 || y < 0 || x >= w || y >= h) break;
        if (light[y * w + x] > level) last = r;
      }
      reachOf[k] = last;
    }
    const at = (list, k) => list[((k % K) + K) % K];
    // median of five, then three rounds of averaging
    reachOf = reachOf.map((_, k) => [at(reachOf, k-2), at(reachOf, k-1), at(reachOf, k), at(reachOf, k+1), at(reachOf, k+2)].sort((p, q) => p - q)[2]);
    for (let pass = 0; pass < 3; pass++) {
      reachOf = reachOf.map((_, k) => (at(reachOf, k-2) + at(reachOf, k-1) + at(reachOf, k) + at(reachOf, k+1) + at(reachOf, k+2)) / 5);
    }
    const mean = reachOf.reduce((sum, r) => sum + r, 0) / K;
    return {
      mean: mean / w, rim: true, // mean as a fraction of the photograph's width
      // distance from the centre as a fraction of the way to the edge, and the bearing
      locate(nx, ny, out) {
        const dx = (nx - center[0]) * w, dy = (ny - center[1]) * h;
        let angle = Math.atan2(dy, dx); if (angle < 0) angle += Math.PI * 2;
        const slot = angle / (Math.PI * 2) * K, k = Math.floor(slot), f = slot - k;
        const edge = at(reachOf, k) * (1 - f) + at(reachOf, k + 1) * f;
        out[0] = Math.hypot(dx, dy) / Math.max(1, edge); out[1] = angle;
      }
    };
  }

  // Light leaving a source inside a cloud. "How far out" a point is combines
  // its real distance from the source with how dim the cloud is there, so a
  // front hugs the bright core and body of the object instead of drawing a circle.
  function spread(photo, center) {
    const { w, h } = photo;
    if (!photo.soft) {
      // the brightness map, blurred, and stretched between sky and brightest gas
      let soft = Float32Array.from(photo.light);
      for (let pass = 0; pass < 2; pass++) {
        const next = new Float32Array(soft.length);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          let sum = 0, count = 0;
          for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
            const xx = x + i, yy = y + j;
            if (xx >= 0 && yy >= 0 && xx < w && yy < h) { sum += soft[yy * w + xx]; count++; }
          }
          next[y * w + x] = sum / count;
        }
        soft = next;
      }
      const sorted = Float32Array.from(soft).sort();
      const lo = sorted[Math.floor(sorted.length * .1)], hi = sorted[Math.floor(sorted.length * .99)];
      photo.soft = soft.map(v => Math.max(0, Math.min(1, (v - lo) / (hi - lo || 1))));
    }
    const soft = photo.soft, cx = center[0] * w, cy = center[1] * h;
    const far = Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy));
    return {
      mean: far / w, rim: false,
      locate(nx, ny, out) {
        const x = Math.max(0, Math.min(w - 1.001, nx * w - .5)), y = Math.max(0, Math.min(h - 1.001, ny * h - .5));
        const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, o = iy * w + ix;
        const level = soft[o] * (1 - fx) * (1 - fy) + soft[o + 1] * fx * (1 - fy) + soft[o + w] * (1 - fx) * fy + soft[o + w + 1] * fx * fy;
        const dx = nx * w - cx, dy = ny * h - cy;
        let angle = Math.atan2(dy, dx); if (angle < 0) angle += Math.PI * 2;
        out[0] = .5 * Math.hypot(dx, dy) / far + .5 * (1 - level); out[1] = angle;
      }
    };
  }

  function compile(info, crop, cols, rows, cellW, cellH, W, H, photo) {
    const key = info.src.split('/').pop().replace(/\.jpg$/, '');
    const profile = profiles[key];
    if (!profile) throw new Error(`Missing motion score for ${key}`);
    const n = cols * rows;
    // Screen pixels per unit of the photograph's width and height.
    const sxp = crop.iw / crop.sw * W, syp = crop.ih / crop.sh * H, unit = (sxp + syp) / 2;

    // Every cell belongs to a lane of the layer that dominates it. A lane is a
    // strip that follows that layer's structure: alongside a stream's path,
    // around a ring at one radius, or outward from a shell at one bearing.
    //   lane   which strip (unique across layers)
    //   along  distance travelled along the strip, in pixels
    //   pace   how fast that strip carries its symbols, signed, pixels a second
    //   reach  how many steps of symbol weight the strip may shift a cell by
    //   pull   how strongly the layer holds this cell, 0 to 1
    const lane = new Int32Array(n), along = new Float32Array(n), pace = new Float32Array(n);
    const reach = new Float32Array(n), pull = new Float32Array(n), kindOf = new Uint8Array(n);
    const turn = new Float32Array(n), claim = new Float32Array(n);
    const wave = new Float32Array(n).fill(150), surge = new Float32Array(n).fill(2);
    const spot = new Float32Array(2);
    const flowX = new Float32Array(n), flowY = new Float32Array(n);

    const fields = profile.layers.map((layer, index) => {
      const values = new Float32Array(n * 4);
      const segments = layer.points?.slice(1).map((p, i) => {
        const a = layer.points[i], dx = p[0] - a[0], dy = p[1] - a[1];
        return { a, dx, dy, length: Math.hypot(dx, dy) };
      });
      const total = segments?.reduce((sum, s) => sum + s.length, 0);
      const ca = Math.cos(layer.tilt || 0), sa = Math.sin(layer.tilt || 0);
      const heading = layer.seconds < 0 ? -1 : 1, period = Math.abs(layer.seconds);
      const kind = KIND[layer.type];
      // Size of the structure on screen, and the speed its own period gives it.
      const edge = !photo ? null : layer.traced ? outline(photo, layer.center) : layer.glow ? spread(photo, layer.center) : null;
      const span = segments
        ? segments.reduce((sum, g) => sum + Math.hypot(g.dx * sxp, g.dy * syp), 0)
        : edge ? edge.mean * sxp
        : Math.sqrt(((layer.radius[0] * sxp) ** 2 + (layer.radius[1] * syp) ** 2) / 2);
      let speed = kind === 1 ? span / period : kind === 2 ? Math.PI * 2 * span / period * .55 : kind === 4 ? span * 3.2 / period : span / period * 1.6;
      speed = Math.max(14, Math.min(120, speed)) * .45;

      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const nx = (crop.sx + (c + .5) * cellW / W * crop.sw) / crop.iw;
        const ny = (crop.sy + (r + .5) * cellH / H * crop.sh) / crop.ih;
        let distance = Infinity, progress = 0, vx = 0, vy = 0;
        let strip = 0, travelled = 0, gait = 1;
        if (segments) {
          let walked = 0, side = 1;
          for (const seg of segments) {
            const px = nx - seg.a[0], py = ny - seg.a[1];
            const t = Math.max(0, Math.min(1, (px*seg.dx + py*seg.dy)/(seg.length*seg.length)));
            const d = Math.hypot(px - t*seg.dx, py - t*seg.dy);
            if (d < distance) {
              distance = d; progress = (walked + t * seg.length) / total; vx = seg.dx; vy = seg.dy;
              side = px * seg.dy - py * seg.dx < 0 ? -1 : 1;
            }
            walked += seg.length;
          }
          // Stream: fastest down the middle of its channel, dragging at the banks.
          strip = Math.round(side * distance * unit / LANE);
          travelled = progress * span;
          const centre = Math.abs(strip) * LANE / unit;
          gait = .4 + .6 * Math.exp(-2 * (centre / layer.width) ** 2);
        } else if (edge) {
          // Shaped shell: "how far out" comes from the photograph. Traced: measured
          // against the object's own edge, so a front reaches every part of the
          // rim at the same moment, and the shell is strongest at that rim.
          // Glow: measured from the light source through the cloud, strongest at the source.
          edge.locate(nx, ny, spot);
          const radius = spot[0], angle = spot[1];
          distance = edge.rim ? Math.abs(radius - 1) : radius * .5;
          progress = radius * .65 + angle * .08;
          vx = nx - layer.center[0] || 1e-6; vy = ny - layer.center[1];
          strip = Math.round(angle * span * (edge.rim ? 1 : .5) / LANE);
          travelled = radius * span;
        } else if (kind === 4) {
          // Spiral: each lane is one logarithmic arm (constant angle minus
          // wind times log radius). Symbols ride the arm out of the horizon,
          // brightest just outside it and fading as they escape.
          const x = nx - layer.center[0], y = ny - layer.center[1];
          const ex = (x*ca + y*sa)/layer.radius[0], ey = (-x*sa + y*ca)/layer.radius[1];
          const radius = Math.max(.04, Math.hypot(ex, ey)), angle = Math.atan2(ey, ex);
          const log = Math.log(radius), wind = layer.wind;
          let arm = (angle - wind * log) % (Math.PI * 2); if (arm < 0) arm += Math.PI * 2;
          distance = radius < 1 ? (1 - radius) * 1.6 : (radius - 1) * .3;
          progress = log * .65 + arm * .08;
          const tx = (Math.cos(angle) - wind * Math.sin(angle)) * layer.radius[0];
          const ty = (Math.sin(angle) + wind * Math.cos(angle)) * layer.radius[1];
          vx = tx*ca - ty*sa; vy = tx*sa + ty*ca;
          strip = Math.round(arm * span * 1.4 / LANE);
          travelled = log * span * Math.hypot(1, wind);
        } else {
          const x = nx - layer.center[0], y = ny - layer.center[1];
          const ex = (x*ca + y*sa)/layer.radius[0], ey = (-x*sa + y*ca)/layer.radius[1];
          const radius = Math.hypot(ex, ey), angle = Math.atan2(ey, ex);
          distance = Math.abs(radius - 1);
          progress = layer.type === 'shell' ? radius * .65 + angle * .08 : angle / (Math.PI*2);
          const tx = layer.type === 'shell' ? Math.cos(angle)*layer.radius[0] : -Math.sin(angle)*layer.radius[0];
          const ty = layer.type === 'shell' ? Math.sin(angle)*layer.radius[1] : Math.cos(angle)*layer.radius[1];
          vx = tx*ca - ty*sa; vy = tx*sa + ty*ca;
          if (kind === 2) {
            // Ring: each lane is one orbit, and the inner orbits lap the outer ones.
            strip = Math.round((radius - 1) * span / LANE);
            const orbit = Math.max(.15, 1 + strip * LANE / span);
            travelled = angle * orbit * span;
            gait = Math.max(.55, Math.min(1.8, 1 / Math.sqrt(orbit)));
          } else {
            // Shell: each lane is one bearing, and everything on it moves outward together.
            strip = Math.round(angle * span / LANE);
            travelled = radius * span;
          }
        }
        const envelope = Math.exp(-2 * (distance/layer.width)**2);
        // Transform directions through the same crop as the photograph.
        vx *= sxp; vy *= syp;
        const length = Math.hypot(vx, vy) || 1;
        const amount = layer.amount * envelope * Math.min(1, W / 1000 + .35);
        const i = r*cols+c, at = i*4;
        values[at] = vx / length * amount; values[at+1] = vy / length * amount;
        values[at+2] = progress * Math.PI * 4 + layer.phase;
        values[at+3] = envelope;

        // The layer with the strongest hold on this cell owns it. Its hold
        // reaches well past its band, so the space between structures still
        // moves, only more slowly the further it is from anything.
        const hold = Math.exp(-.5 * (distance / (layer.width * 2.5)) ** 2);
        const bid = hold * (.4 + layer.amount / 10);
        if (bid > claim[i]) {
          claim[i] = bid;
          const id = index * 8192 + strip + 4096;
          // Neighbouring lanes never move at quite the same speed.
          const own = kind >= 3 ? 1 : .75 + .5 * hash2(id, 71);
          lane[i] = id; along[i] = travelled; kindOf[i] = kind === 4 ? 3 : kind;
          // Nothing stands still: even the furthest cell keeps a slow walk.
          pace[i] = heading * Math.max(5.5, speed * gait * own * (.45 + .55 * hold));
          reach[i] = (1.5 + layer.amount * .55) * (.45 + .55 * hold);
          pull[i] = envelope; turn[i] = layer.phase;
          // A traced shell sends two or three slow fronts across its own radius.
          wave[i] = edge ? span / (edge.rim ? 2.4 : 3) : kind === 4 ? span * .9 : 150; surge[i] = edge ? 1.1 : kind === 4 ? 1.4 : 2;
          flowX[i] = vx / length * pace[i] / .45; flowY[i] = vy / length * pace[i] / .45;
        }
      }
      return { values, speed: -Math.PI*2/layer.seconds, cross: layer.type === 'stream' ? .22 : .12 };
    });

    // Where a cell is on its lane right now, which symbol shift that slot of the
    // lane carries, and how hot that stretch is.
    //   stream  long hot runs that slide down the channel
    //   ring    shorter hot arcs, sheared by the different orbital speeds
    //   shell   hot fronts that leave the centre together and expand
    function flow(i, time, out) {
      const here = along[i] - pace[i] * time, slot = here / STEP, id = lane[i];
      out[0] = (hash2(Math.floor(slot), id) - .5) * 2 * reach[i];
      let hot;
      if (kindOf[i] === 3) {
        const front = Math.sin((along[i] - pace[i] * surge[i] * time) / wave[i] * Math.PI * 2 + turn[i]);
        hot = front > 0 ? front ** 6 : 0;
      } else {
        const v = slot / (kindOf[i] === 2 ? 7 : 11), a = Math.floor(v), f = v - a;
        const level = hash2(a, id + 977) + (hash2(a + 1, id + 977) - hash2(a, id + 977)) * f * f * (3 - 2 * f);
        const k = Math.max(0, Math.min(1, (level - .56) / .24));
        hot = k * k * (3 - 2 * k);
      }
      out[1] = hot * (.3 + .7 * pull[i]);
    }

    // The pointer is felt directly: cells under it take dye at once, and
    // drops of dye are carried off along whatever lane they land in.
    const dye = new Float32Array(n);
    const loose = [];

    function step(dt) {
      if (dt <= 0) return;
      const fade = Math.exp(-dt / .7);
      for (let i = 0; i < n; i++) dye[i] *= fade;
      for (let k = loose.length - 1; k >= 0; k--) {
        const p = loose[k];
        p.age += dt;
        const c = Math.floor(p.x / cellW), r = Math.floor(p.y / cellH);
        if (p.age >= p.life || c < 0 || r < 0 || c >= cols || r >= rows) { loose.splice(k, 1); continue; }
        const i = r * cols + c, slow = Math.exp(-dt / .45);
        p.vx *= slow; p.vy *= slow;
        p.x += (p.vx + flowX[i]) * dt; p.y += (p.vy + flowY[i]) * dt;
        const glow = Math.sin(Math.PI * p.age / p.life);
        if (glow > dye[i]) dye[i] = glow;
      }
    }

    function inject(x, y, vx, vy) {
      const c0 = Math.floor(x / cellW), r0 = Math.floor(y / cellH), radius = 34;
      const dc = Math.ceil(radius / cellW), dr = Math.ceil(radius / cellH);
      for (let r = Math.max(0, r0 - dr); r <= Math.min(rows - 1, r0 + dr); r++) {
        for (let c = Math.max(0, c0 - dc); c <= Math.min(cols - 1, c0 + dc); c++) {
          const touch = 1 - Math.hypot((c + .5) * cellW - x, (r + .5) * cellH - y) / radius;
          if (touch > 0 && touch * touch * .85 > dye[r * cols + c]) dye[r * cols + c] = touch * touch * .85;
        }
      }
      const speed = Math.hypot(vx, vy), cap = speed > 240 ? 240 / speed : 1;
      for (let k = 0; k < 3 && loose.length < 260; k++) {
        loose.push({ x: x + (Math.random() - .5) * cellW * 2, y: y + (Math.random() - .5) * cellH * 2,
          vx: vx * cap * .4, vy: vy * cap * .4, age: 0, life: 1.1 + Math.random() * 1.4 });
      }
    }

    return {
      name: profile.name, stars: profile.stars,
      dye, pace, pull, kindOf, flow, step, inject,
      sample(i, time, out) {
        let x = 0, y = 0, energy = 0, weight = 0;
        const at = i*4;
        for (const field of fields) {
          const f = field.values, e = f[at+3];
          if (e < .005) continue;
          const phase = f[at+2] + time*field.speed;
          const along = Math.sin(phase), cross = Math.cos(phase*.7 + time*field.speed*.3)*field.cross;
          x += f[at]*along - f[at+1]*cross;
          y += f[at+1]*along + f[at]*cross;
          energy += e * Math.max(0, along)**4; weight += e;
        }
        const bound = Math.max(1, Math.hypot(x, y)/12);
        out[0] = x/bound; out[1] = y/bound;
        out[2] = 1 + .13 * energy/Math.max(1, weight);
      }
    };
  }
  window.SpaceMotion = { profiles, compile };
})();
