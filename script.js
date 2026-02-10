/*
  Main front-end controller:
  - Initializes Three.js hero animation with mouse + scroll interaction
  - Applies GSAP ScrollTrigger parallax and reveal effects
  - Adds 3D tilt behavior to project cards
  - Includes graceful fallback for non-WebGL devices
*/

(() => {
  const canvas = document.getElementById("hero-canvas");
  const fallback = document.getElementById("webgl-fallback");
  const year = document.getElementById("year");
  year.textContent = new Date().getFullYear();

  let renderer;
  let scene;
  let camera;
  let group;
  let mouseX = 0;
  let mouseY = 0;

  const webglSupported = (() => {
    try {
      const testCanvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl"))
      );
    } catch {
      return false;
    }
  })();

  // Three.js setup with rotating/floating geometry in hero section
  function initThreeHero() {
    if (!webglSupported || !window.THREE) {
      canvas.hidden = true;
      fallback.hidden = false;
      return;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 10;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    group = new THREE.Group();
    scene.add(group);

    const geometries = [
      new THREE.IcosahedronGeometry(0.9, 0),
      new THREE.TorusGeometry(0.68, 0.18, 16, 70),
      new THREE.OctahedronGeometry(0.7),
      new THREE.TetrahedronGeometry(0.75)
    ];

    for (let i = 0; i < 26; i += 1) {
      const geo = geometries[i % geometries.length];
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${190 + i * 8}, 90%, 60%)`),
        roughness: 0.35,
        metalness: 0.55
      });
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 11, (Math.random() - 0.5) * 8);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.scale.setScalar(Math.random() * 0.75 + 0.55);
      group.add(mesh);
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.58);
    const pointA = new THREE.PointLight(0x59f4ff, 1.1, 40);
    const pointB = new THREE.PointLight(0x8b6aff, 1, 40);
    pointA.position.set(4, 4, 7);
    pointB.position.set(-4, -3, 6);
    scene.add(ambient, pointA, pointB);

    window.addEventListener("mousemove", (event) => {
      mouseX = event.clientX / window.innerWidth - 0.5;
      mouseY = event.clientY / window.innerHeight - 0.5;
    });

    window.addEventListener("resize", onResize);

    animate();
  }

  // Resize renderer and camera when viewport changes
  function onResize() {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Frame loop: floating motion + pointer interaction + scroll response
  function animate() {
    requestAnimationFrame(animate);
    const t = performance.now() * 0.001;

    group.rotation.y += 0.0016;
    group.rotation.x += 0.0007;
    group.position.x += (mouseX * 1.5 - group.position.x) * 0.03;
    group.position.y += (-mouseY * 1.2 - group.position.y) * 0.03;
    group.position.z = -window.scrollY * 0.0035;

    group.children.forEach((mesh, i) => {
      mesh.position.y += Math.sin(t + i * 0.55) * 0.002;
      mesh.rotation.x += 0.003;
      mesh.rotation.y += 0.003;
    });

    renderer.render(scene, camera);
  }

  // GSAP ScrollTrigger animations for reveal effects and layered parallax
  function initScrollAnimations() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 82%"
        }
      });
    });

    gsap.utils.toArray("[data-speed]").forEach((el) => {
      const speed = Number(el.dataset.speed) || 0.15;
      gsap.to(el, {
        y: () => -window.innerHeight * speed,
        ease: "none",
        scrollTrigger: {
          trigger: el.closest("section") || el,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });

    gsap.utils.toArray(".skill-bar span").forEach((bar) => {
      gsap.to(bar, {
        width: bar.style.getPropertyValue("--value"),
        duration: 1.4,
        ease: "power2.out",
        scrollTrigger: {
          trigger: bar,
          start: "top 90%"
        }
      });
    });

    gsap.to(".orb-1", {
      y: -120,
      scrollTrigger: { trigger: "#contact", scrub: true, start: "top bottom", end: "bottom top" }
    });

    gsap.to(".orb-2", {
      y: 100,
      scrollTrigger: { trigger: "#contact", scrub: true, start: "top bottom", end: "bottom top" }
    });
  }

  // Pointer tilt effect for project cards to create a 3D hover interaction
  function initTiltCards() {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateY = ((x / rect.width) - 0.5) * 14;
        const rotateX = -((y / rect.height) - 0.5) * 14;
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)";
      });
    });
  }

  initThreeHero();
  initScrollAnimations();
  initTiltCards();
})();
