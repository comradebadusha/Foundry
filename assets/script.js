(function(){

  /* ---------------- custom cursor ---------------- */
  const dot = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  let mx=innerWidth/2, my=innerHeight/2, rx=mx, ry=my;
  window.addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; dot.style.left=mx+'px'; dot.style.top=my+'px'; });
  (function tick(){ rx += (mx-rx)*0.18; ry += (my-ry)*0.18; ring.style.left=rx+'px'; ring.style.top=ry+'px'; requestAnimationFrame(tick); })();
  document.querySelectorAll('a,button,.tilt').forEach(el=>{
    el.addEventListener('mouseenter', ()=>ring.classList.add('big'));
    el.addEventListener('mouseleave', ()=>ring.classList.remove('big'));
  });

  /* ---------------- scroll reveal ---------------- */
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, {threshold:0.15});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  /* ---------------- card tilt ---------------- */
  document.querySelectorAll('.tilt').forEach(card=>{
    card.addEventListener('mousemove', e=>{
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left)/r.width - 0.5;
      const py = (e.clientY - r.top)/r.height - 0.5;
      card.style.transform = `rotateX(${py*-8}deg) rotateY(${px*10}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', ()=>{ card.style.transform = 'rotateX(0) rotateY(0)'; });
  });

  /* ---------------- statement word reveal ---------------- */
  const phrase = "Every project moves through the same forge: a rough idea, put under real pressure, cast into a site, a system, a campaign that runs on its own and actually changes the number you cared about.";
  const hlWords = ["forge:","cast"];
  const statementEl = document.getElementById('statement-text');
  const words = phrase.split(' ').map(w=>{
    const clean = w.replace(/[.,:]/g,'').toLowerCase();
    const isHl = hlWords.some(h=>h.replace(/[.,:]/g,'').toLowerCase()===clean);
    return `<span class="word${isHl?' hl':''}">${w}</span>`;
  });
  statementEl.innerHTML = words.join(' ');
  const wordEls = statementEl.querySelectorAll('.word');

  function updateStatement(){
    const sec = statementEl.closest('section');
    const r = sec.getBoundingClientRect();
    const total = r.height + innerHeight;
    const progressed = innerHeight - r.top;
    const progress = Math.min(Math.max(progressed/total, 0), 1);
    const activeCount = Math.floor(progress * wordEls.length * 1.3);
    wordEls.forEach((w,i)=>{ w.classList.toggle('on', i < activeCount); });
  }
  window.addEventListener('scroll', ()=>requestAnimationFrame(updateStatement));
  updateStatement();

  /* ---------------- magnetic buttons ---------------- */
  document.querySelectorAll('.magnetic').forEach(el=>{
    el.addEventListener('mousemove', e=>{
      const r = el.getBoundingClientRect();
      const mx2 = (e.clientX - r.left - r.width/2) * 0.25;
      const my2 = (e.clientY - r.top - r.height/2) * 0.25;
      el.style.transform = `translate(${mx2}px, ${my2}px)`;
    });
    el.addEventListener('mouseleave', ()=>{ el.style.transform = 'translate(0,0)'; });
  });

  /* ---------------- 3D hero ---------------- */
  try {
    if (typeof THREE === 'undefined') throw new Error('three.js not loaded');

    const canvas = document.getElementById('hero-canvas');
    const heroSection = document.querySelector('.hero');
    document.getElementById('hero-fallback-mark').style.display = 'none';

    const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    function sizeRenderer(){
      const w = heroSection.clientWidth, h = heroSection.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w/h;
      camera.updateProjectionMatrix();
    }
    sizeRenderer();
    window.addEventListener('resize', sizeRenderer);

    // lights
    scene.add(new THREE.AmbientLight(0x2a2a2e, 1.1));
    const key = new THREE.DirectionalLight(0xfff3e6, 1.0);
    key.position.set(3, 4, 5);
    scene.add(key);
    const glow = new THREE.PointLight(0xff6a1f, 6, 12, 2);
    glow.position.set(1.4, -0.6, 2.2);
    scene.add(glow);
    const rim = new THREE.PointLight(0xffddb0, 1.4, 14, 2);
    rim.position.set(-3, 2, -3);
    scene.add(rim);

    // build F-mark facet shapes
    function facetShape(pts){
      const s = new THREE.Shape();
      s.moveTo(pts[0][0], pts[0][1]);
      for(let i=1;i<pts.length;i++) s.lineTo(pts[i][0], pts[i][1]);
      s.closePath();
      return s;
    }
    const topPts = [[-1.0,0.62],[0.85,0.62],[0.5,0.14],[-1.0,0.14]];
    const botPts = [[-1.0,0.02],[0.32,0.02],[-0.02,-0.62],[-1.0,-0.62]];

    const extrudeSettings = { depth:0.4, bevelEnabled:true, bevelThickness:0.05, bevelSize:0.04, bevelSegments:3 };
    const topGeo = new THREE.ExtrudeGeometry(facetShape(topPts), extrudeSettings);
    const botGeo = new THREE.ExtrudeGeometry(facetShape(botPts), extrudeSettings);

    const topMat = new THREE.MeshStandardMaterial({color:0xff6a1f, metalness:0.55, roughness:0.32, emissive:0x461600, emissiveIntensity:0.5});
    const botMat = new THREE.MeshStandardMaterial({color:0xb23a0e, metalness:0.55, roughness:0.38, emissive:0x2c0d02, emissiveIntensity:0.5});

    const topMesh = new THREE.Mesh(topGeo, topMat);
    const botMesh = new THREE.Mesh(botGeo, botMat);

    const group = new THREE.Group();
    group.add(topMesh, botMesh);
    group.scale.setScalar(1.15);
    scene.add(group);

    // entrance animation: fly in from opposite sides with overshoot
    const startTop = new THREE.Vector3(-6, 2.4, -3);
    const startBot = new THREE.Vector3(6, -2.4, -3);
    const endTop = new THREE.Vector3(0,0,0);
    const endBot = new THREE.Vector3(0,0,0);
    topMesh.position.copy(startTop);
    botMesh.position.copy(startBot);

    function easeOutBack(t){ const c=1.70158; return 1+c*Math.pow(t-1,3)+ (c)*Math.pow(t-1,2); }

    let startTime = null;
    const entranceDuration = 1400;

    // particle field
    const PCOUNT = 260;
    const posArr = new Float32Array(PCOUNT*3);
    for(let i=0;i<PCOUNT;i++){
      posArr[i*3]   = (Math.random()-0.5)*14;
      posArr[i*3+1] = (Math.random()-0.5)*8 - 2;
      posArr[i*3+2] = (Math.random()-0.5)*6 - 2;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(posArr,3));
    const pMat = new THREE.PointsMaterial({color:0xff8a3d, size:0.035, transparent:true, opacity:0.55, blending:THREE.AdditiveBlending, depthWrite:false});
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    // mouse parallax
    let mouseNX=0, mouseNY=0;
    window.addEventListener('mousemove', e=>{
      mouseNX = (e.clientX/innerWidth - 0.5);
      mouseNY = (e.clientY/innerHeight - 0.5);
    });

    function animate(t){
      requestAnimationFrame(animate);
      if(startTime===null) startTime = t;
      const el = t - startTime;
      const p = Math.min(el/entranceDuration, 1);
      const eased = easeOutBack(p);
      topMesh.position.lerpVectors(startTop, endTop, eased);
      botMesh.position.lerpVectors(startBot, endBot, eased);

      group.rotation.y += 0.0022;
      group.rotation.x += (mouseNY*0.35 - group.rotation.x)*0.04;
      group.rotation.y += (mouseNX*0.5 - group.rotation.y*0.0)*0.0; // keep continuous spin, parallax on x only

      glow.intensity = 5 + Math.sin(t*0.0016)*1.6;

      const posAttr = pGeo.attributes.position;
      for(let i=0;i<PCOUNT;i++){
        posAttr.array[i*3+1] += 0.0022;
        if(posAttr.array[i*3+1] > 4) posAttr.array[i*3+1] = -4;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);

  } catch(err){
    console.warn('3D hero disabled:', err.message);
  }

})();
