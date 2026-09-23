/* ==========================================================================
   Aardvark Book Club - Motion Design & Interactive Engine
   ========================================================================== */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// Helper function to split text into word spans while preserving line wrappers and child markup
function splitWords(element) {
  if (!element) return [];
  const splitSpans = [];

  function processNode(node, container) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = node.textContent.split(/(\s+)/);
      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          container.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.className = 'split-word';
          span.textContent = part;
          container.appendChild(span);
          splitSpans.push(span);
        }
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const isStructuralWrapper = node.classList.contains('hero-flatlay__title-line') || node.children.length > 0;
      if (isStructuralWrapper) {
        const wrapper = node.cloneNode(false);
        Array.from(node.childNodes).forEach((child) => {
          processNode(child, wrapper);
        });
        container.appendChild(wrapper);
      } else {
        const extraClass = node.className ? ` ${node.className}` : '';
        const parts = node.textContent.split(/(\s+)/);
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            container.appendChild(document.createTextNode(part));
          } else {
            const span = document.createElement('span');
            span.className = `split-word${extraClass}`;
            span.textContent = part;
            container.appendChild(span);
            splitSpans.push(span);
          }
        });
      }
    }
  }

  const fragment = document.createDocumentFragment();
  Array.from(element.childNodes).forEach((node) => {
    processNode(node, fragment);
  });

  element.innerHTML = '';
  element.appendChild(fragment);
  return splitSpans;
}

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Initialize Lenis Smooth Scroll ---
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  window.__lenis = lenis;

  function raf(time) {
    lenis.raf(time);
    ScrollTrigger.update();
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // --- 2. Sync --header-h with actual rendered header height ---
  const headerElement = document.querySelector('.header');
  if (headerElement) {
    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty('--header-h', headerElement.offsetHeight + 'px');
    };
    syncHeaderHeight();
    window.addEventListener('resize', syncHeaderHeight);
  }

  // --- 3. Page Intro Transition & Curtain Animation ---
  const transitionWrap = document.getElementById('pageTransition');
  const transitionLogo = document.getElementById('transitionLogo');
  const transitionPath = document.getElementById('transitionPath');
  const header = document.querySelector('.header');
  const heroImages = document.querySelectorAll('.hero-flatlay__image');
  const heroBadge = document.querySelector('.hero-flatlay__badge');
  const heroTitle = document.querySelector('.hero-flatlay__title') || document.querySelector('.hero__title');
  const heroParagraph = document.querySelector('.hero-flatlay__desc') || document.querySelector('.hero__paragraph');
  const heroCta = document.querySelector('.hero-flatlay__actions') || document.querySelector('.hero__cta-wrap');
  const heroCircleBtn = document.querySelector('.hero-circle-btn');

  const boxStage = document.getElementById('interactiveBox');
  const easterEgg = document.querySelector('.easter-egg');
  const heroHandwritten = document.querySelector('.hero-flatlay__handwritten') || document.querySelector('.hero .u-handwritten');

  // Prepare split words for hero title
  const heroWords = splitWords(heroTitle);

  // Setup initial states before intro animation
  gsap.set(header, { yPercent: -100 });
  if (heroImages.length) gsap.set(heroImages, { opacity: 0, scale: 0.96 });
  if (heroBadge) gsap.set(heroBadge, { opacity: 0, y: 15 });
  if (heroWords.length) {
    gsap.set(heroWords, {
      opacity: 0,
      y: 30,
      rotate: 6,
      scaleY: 0.3,
      transformOrigin: 'top left',
    });
  }
  if (heroParagraph) gsap.set(heroParagraph, { opacity: 0, y: 15 });
  if (heroCta) gsap.set(heroCta, { opacity: 0, y: 15 });
  if (heroCircleBtn) gsap.set(heroCircleBtn, { opacity: 0, scale: 0.7, rotate: -15, xPercent: -50, yPercent: -50 });
  if (heroHandwritten) gsap.set(heroHandwritten, { opacity: 0, scale: 0.7, rotate: -10 });

  if (boxStage) gsap.set(boxStage, { opacity: 0, y: 70, scale: 0.9 });
  if (easterEgg) gsap.set(easterEgg, { scale: 0 });

  // Timeline for Intro Page Transition
  const introTl = gsap.timeline({
    defaults: { ease: 'power2.out' },
  });

  if (transitionWrap && transitionLogo) {
    // Initial logo setup
    gsap.set(transitionLogo, {
      scale: 0,
      rotate: -45,
      opacity: 0,
    });

    if (transitionPath) {
      const pathLength = transitionPath.getTotalLength() || 2000;
      gsap.set(transitionPath, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
      });

      // Draw spiral path
      introTl.to(transitionPath, {
        strokeDashoffset: 0,
        duration: 1.1,
        ease: 'power1.inOut',
      }, 0);
    }

    // Aardvark Logo bounces into view
    introTl.to(transitionLogo, {
      scale: 1,
      rotate: 0,
      opacity: 1,
      duration: 0.75,
      ease: 'elastic.out(1, 0.7)',
    }, 0.1);

    // Pause briefly to display branding, then spin-exit
    introTl.to(transitionLogo, {
      scale: 0.2,
      rotate: 45,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
    }, 1.1);

    // Organic circular unmasking / wipe of the purple transition screen
    introTl.to(transitionWrap, {
      clipPath: 'circle(0% at 50% 50%)',
      duration: 0.85,
      ease: 'power3.inOut',
      onComplete: () => {
        transitionWrap.classList.add('is-hidden');
      },
    }, 1.4);
  }

  // Reveal Header from top
  introTl.to(header, {
    yPercent: 0,
    duration: 0.6,
    ease: 'power3.out',
  }, 1.7);

  // Reveal Flat-Lay Hero Images
  if (heroImages.length) {
    introTl.to(heroImages, {
      opacity: 1,
      scale: 1,
      duration: 0.9,
      ease: 'power2.out',
    }, 1.6);
  }

  // Reveal Badge
  if (heroBadge) {
    introTl.to(heroBadge, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'back.out(1.5)',
    }, 1.8);
  }

  // Stagger bouncy reveal of Hero Title words
  if (heroWords.length) {
    introTl.to(heroWords, {
      opacity: 1,
      y: 0,
      rotate: 0,
      scaleY: 1,
      duration: 0.7,
      stagger: 0.05,
      ease: 'elastic.out(1, 0.72)',
    }, 1.9);
  }

  // Reveal Hero Description and Actions
  if (heroParagraph) {
    introTl.to(heroParagraph, {
      opacity: 1,
      y: 0,
      duration: 0.45,
    }, 2.05);
  }

  if (heroCta) {
    introTl.to(heroCta, {
      opacity: 1,
      y: 0,
      duration: 0.45,
    }, 2.15);
  }

  if (heroCircleBtn) {
    introTl.to(heroCircleBtn, {
      opacity: 1,
      scale: 1,
      rotate: 0,
      xPercent: -50,
      yPercent: -50,
      duration: 0.65,
      ease: 'back.out(1.7)',
      onComplete: () => {
        /* Libérer complètement les styles inline pour que les transitions CSS :hover fonctionnent */
        gsap.set(heroCircleBtn, { clearProps: 'transform,opacity' });
      },
    }, 2.15);
  }

  if (heroHandwritten) {
    introTl.to(heroHandwritten, {
      opacity: 1,
      scale: 1,
      rotate: -2,
      duration: 0.55,
      ease: 'back.out(1.8)',
    }, 2.25);
  }

  // Hero Glass Metric Cards Staggered Reveal
  const heroMetricsCards = document.querySelectorAll('.hero-metric-card');
  if (heroMetricsCards.length) {
    gsap.set(heroMetricsCards, { opacity: 0, y: 18, scale: 0.96 });
    introTl.to(heroMetricsCards, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      stagger: 0.08,
      ease: 'back.out(1.5)',
    }, 2.2);
  }

  // Hero Box drops in with 3D bounce
  if (boxStage) {
    introTl.to(boxStage, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.95,
      ease: 'elastic.out(1, 0.7)',
    }, 2.0);
  }

  // Easter Egg Mascot Button pops in
  if (easterEgg) {
    introTl.to(easterEgg, {
      scale: 1,
      duration: 0.6,
      ease: 'elastic.out(1.2, 0.5)',
    }, 2.4);
  }

  // --- Golden Hour Ambient Dust Motes (Desktop Only) ---
  const particlesTrack = document.querySelector('.hero-particles');
  if (particlesTrack && window.innerWidth > 768) {
    const moteCount = 20;
    for (let i = 0; i < moteCount; i++) {
      const mote = document.createElement('div');
      mote.className = 'hero-particle';

      const diameter = Math.random() * 1.8 + 1.2; // 1.2px to 3.0px
      // Positioned across the sunlit quadrant
      const posX = 56 + Math.random() * 34; // 56% to 90%
      const posY = 10 + Math.random() * 48; // 10% to 58%
      const baseAlpha = Math.random() * 0.35 + 0.2; // Soft, non-blinding

      mote.style.width = `${diameter}px`;
      mote.style.height = `${diameter}px`;
      mote.style.left = `${posX}%`;
      mote.style.top = `${posY}%`;
      mote.style.opacity = baseAlpha;

      particlesTrack.appendChild(mote);

      // Gentle floating physics with sine.inOut (8-14s cycle)
      const floatDuration = 8 + Math.random() * 6;
      const driftX = (Math.random() - 0.5) * 35;
      const driftY = -18 - Math.random() * 25;

      gsap.to(mote, {
        x: driftX,
        y: driftY,
        opacity: baseAlpha * 0.35,
        duration: floatDuration,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 3,
      });

      // Subtle atmospheric pulsing
      gsap.to(mote, {
        scale: 1.35,
        duration: 2.8 + Math.random() * 2.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 2,
      });
    }
  }

  // --- 2b. Hero ScrollTrigger Parallax (0.7x Speed Ratio & Particle Lift) ---
  const heroSection = document.querySelector('.hero--flatlay');
  const heroPictures = document.querySelectorAll('.hero-flatlay__picture');
  const heroParticlesTrack = document.querySelector('.hero-particles');

  if (heroSection && heroPictures.length) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 769px)', () => {
      // Background Flat-Lay Parallax (0.7x speed ratio relative to page scroll)
      gsap.to(heroPictures, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: heroSection,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.25,
          fastScrollEnd: true,
        },
      });

      // Ambient Dust Particles: subtle upward acceleration / lift on scroll
      if (heroParticlesTrack) {
        gsap.to(heroParticlesTrack, {
          yPercent: -15,
          ease: 'none',
          scrollTrigger: {
            trigger: heroSection,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.2,
            fastScrollEnd: true,
          },
        });
      }
    });
  }

  // --- 2b-bis. Thematic Section Parallaxes (Books, Stationery, Goodies, Events) ---
  const thematicSections = [
    { selector: '#livres', type: 'books' },
    { selector: '#papeterie', type: 'stationery' },
    { selector: '#goodies', type: 'goodies' },
    { selector: '#evenements', type: 'events' },
  ];

  const sectionParallaxMM = gsap.matchMedia();
  sectionParallaxMM.add('(min-width: 769px)', () => {
    thematicSections.forEach(({ selector, type }) => {
      const sectionEl = document.querySelector(selector);
      if (!sectionEl) return;

      const parallaxWrap = sectionEl.querySelector('.section-parallax');
      if (!parallaxWrap) return;

      const sectionPictures = parallaxWrap.querySelectorAll('.section-parallax__picture');
      const particlesTrack = parallaxWrap.querySelector('.section-parallax__particles');

      // 1. Generate Ambient Thematic Particles (Only once)
      if (particlesTrack && particlesTrack.children.length === 0) {
        const particleCount = 16;
        for (let i = 0; i < particleCount; i++) {
          const particle = document.createElement('div');
          particle.className = `section-particle section-particle--${type}`;

          const diameter = Math.random() * 2 + 1.2; // 1.2px to 3.2px
          const posX = Math.random() * 100;
          const posY = Math.random() * 100;
          const baseAlpha = Math.random() * 0.35 + 0.25;

          particle.style.width = `${diameter}px`;
          particle.style.height = `${diameter}px`;
          particle.style.left = `${posX}%`;
          particle.style.top = `${posY}%`;
          particle.style.opacity = baseAlpha;

          particlesTrack.appendChild(particle);

          // Subtle ambient floating physics
          const floatDur = 7 + Math.random() * 6;
          const driftX = (Math.random() - 0.5) * 36;
          const driftY = (Math.random() - 0.5) * 36;

          gsap.to(particle, {
            x: driftX,
            y: driftY,
            opacity: baseAlpha * 0.4,
            duration: floatDur,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: Math.random() * 2.5,
          });
        }
      }

      // 2. Flatlay Pictures Scroll Parallax (Identique au Hero: 0.7x speed ratio relative to page scroll)
      if (sectionPictures.length) {
        gsap.to(sectionPictures, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.25,
            fastScrollEnd: true,
          },
        });
      }

      // 3. Ambient Dust Particles Lift on Scroll
      if (particlesTrack) {
        gsap.to(particlesTrack, {
          yPercent: -18,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.2,
            fastScrollEnd: true,
          },
        });
      }
    });
  });

  // --- 2c. Interactive 2.5D Layered Box Mockup Engine ---
  const interactiveBox = document.getElementById('interactiveBox');
  if (interactiveBox) {
    const boxWrapper = interactiveBox.querySelector('.box-wrapper');
    const boxLid = interactiveBox.querySelector('.box-lid');
    const boxFront = interactiveBox.querySelector('.box-front');
    const book1 = interactiveBox.querySelector('.box-item--book1');
    const book2 = interactiveBox.querySelector('.box-item--book2');
    const book3 = interactiveBox.querySelector('.box-item--book3');
    const bookmark = interactiveBox.querySelector('.box-item--bookmark');
    const gazette = interactiveBox.querySelector('.box-item--gazette');
    const groundShadow = interactiveBox.querySelector('.box-shadow-ground');
    const hintBadge = interactiveBox.querySelector('.box-hint-badge');

    // Subtle idle floating animation for the box
    gsap.to(boxWrapper, {
      y: -8,
      rotateX: 8,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    // Master hover/open timeline (paused initially)
    const boxTl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.out' },
    });

    // 1. Lid hinges open in 3D perspective
    boxTl.to(boxLid, {
      rotateX: -130,
      duration: 0.6,
      ease: 'power3.inOut',
    }, 0);

    // 2. Front of box subtly dips
    boxTl.to(boxFront, {
      y: 10,
      duration: 0.45,
      ease: 'power2.out',
    }, 0.05);

    // 3. Ground shadow expands & diffuses
    boxTl.to(groundShadow, {
      scale: 1.25,
      opacity: 0.7,
      duration: 0.55,
      ease: 'power2.out',
    }, 0);

    // 4. Center hero book (Le Monde sans fin) elevates highest
    boxTl.to(book2, {
      y: -140,
      scale: 1.08,
      rotate: 0,
      duration: 0.75,
      ease: 'elastic.out(1.15, 0.68)',
    }, 0.1);

    // 5. Left book (Veiller sur elle) fans out to the left
    boxTl.to(book1, {
      x: -40,
      y: -105,
      rotate: -12,
      duration: 0.7,
      ease: 'elastic.out(1.1, 0.7)',
    }, 0.14);

    // 6. Right book (La Faille) fans out to the right
    boxTl.to(book3, {
      x: 40,
      y: -100,
      rotate: 13,
      duration: 0.7,
      ease: 'elastic.out(1.1, 0.7)',
    }, 0.16);

    // 7. Gold Bookmark pops high with playful tilt
    if (bookmark) {
      boxTl.to(bookmark, {
        x: -75,
        y: -145,
        rotate: -22,
        duration: 0.8,
        ease: 'elastic.out(1.2, 0.6)',
      }, 0.12);
    }

    // 8. Cultural Gazette card pops up
    if (gazette) {
      boxTl.to(gazette, {
        x: 75,
        y: -130,
        rotate: 19,
        duration: 0.75,
        ease: 'elastic.out(1.15, 0.65)',
      }, 0.18);
    }

    // 9. Hint badge state
    if (hintBadge) {
      boxTl.to(hintBadge, {
        y: -4,
        scale: 0.95,
        duration: 0.25,
      }, 0);
    }

    let isOpen = false;

    // Desktop Hover
    interactiveBox.addEventListener('mouseenter', () => {
      interactiveBox.classList.add('is-open');
      boxTl.timeScale(1).play();
    });

    interactiveBox.addEventListener('mouseleave', () => {
      interactiveBox.classList.remove('is-open');
      boxTl.timeScale(1.35).reverse();
    });

    // Touch / Click toggle (for mobile devices and accessibility)
    interactiveBox.addEventListener('click', () => {
      isOpen = !isOpen;
      if (isOpen) {
        interactiveBox.classList.add('is-open');
        boxTl.timeScale(1).play();
      } else {
        interactiveBox.classList.remove('is-open');
        boxTl.timeScale(1.35).reverse();
      }
    });

    // Keyboard accessibility (Space / Enter toggles)
    interactiveBox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        isOpen = !isOpen;
        if (isOpen) {
          interactiveBox.classList.add('is-open');
          boxTl.timeScale(1).play();
        } else {
          interactiveBox.classList.remove('is-open');
          boxTl.timeScale(1.35).reverse();
        }
      }
    });
  }

  // --- 3. ScrollTrigger In-View Motion Designs ---

  // Books Section Title & Handwritten note
  gsap.from('.books-section__title-group', {
    scrollTrigger: {
      trigger: '.books-section',
      start: 'top 75%',
    },
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: 'power3.out',
  });

  // Books Section Entry
  gsap.from('.books-slider-wrap', {
    scrollTrigger: {
      trigger: '.books-slider-wrap',
      start: 'top 85%',
    },
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: 'power2.out',
  });

  // Stationery Section Title & Filter Tabs
  gsap.from('.stationery-section__title-group, .stationery-filter-bar', {
    scrollTrigger: {
      trigger: '.stationery-section',
      start: 'top 75%',
    },
    opacity: 0,
    y: 35,
    stagger: 0.15,
    duration: 0.8,
    ease: 'power3.out',
  });

  // Stationery Section Entry
  gsap.from('.stationery-slider-wrap', {
    scrollTrigger: {
      trigger: '.stationery-slider-wrap',
      start: 'top 85%',
    },
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: 'power2.out',
  });

  // Goodies Section Title & Filters
  gsap.from('.goodies-section__title-group, .goodies-filter-bar', {
    scrollTrigger: {
      trigger: '.goodies-section',
      start: 'top 75%',
    },
    opacity: 0,
    y: 35,
    stagger: 0.15,
    duration: 0.8,
    ease: 'power2.out',
  });

  // Goodies Section Entry
  gsap.from('.goodies-slider-wrap', {
    scrollTrigger: {
      trigger: '.goodies-slider-wrap',
      start: 'top 85%',
    },
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: 'power2.out',
  });

  // Flow Steps Cards Staggered Entry
  gsap.from('.step-card', {
    scrollTrigger: {
      trigger: '.flow-steps',
      start: 'top 80%',
      once: true,
    },
    opacity: 0,
    y: 25,
    stagger: 0.08,
    duration: 0.6,
    ease: 'power2.out',
    clearProps: 'transform,opacity',
  });


  // FAQ Accordion Stagger
  gsap.from('.faq-item', {
    scrollTrigger: {
      trigger: '.faq-accordion',
      start: 'top 85%',
    },
    opacity: 0,
    y: 30,
    stagger: 0.1,
    duration: 0.6,
    ease: 'power2.out',
  });

  // Press Section Cards Stagger
  gsap.from('.press-card', {
    scrollTrigger: {
      trigger: '.press-section',
      start: 'top 80%',
    },
    opacity: 0,
    y: 45,
    stagger: 0.12,
    duration: 0.75,
    ease: 'power2.out',
  });

  // --- 4. Interactive Components Logic ---

  // --- 4.1. Floating Nav Pill Track: Liquid Sliding Indicator & Active Section Spy ---
  const navTrack = document.getElementById('navPillTrack');
  const navIndicator = document.getElementById('navPillIndicator');
  const navLinks = Array.from(document.querySelectorAll('.nav-pill-link'));
  const headerElem = document.querySelector('.header');

  if (navTrack && navIndicator && navLinks.length) {
    let activeLink = null;
    let isHoveringNav = false;

    let currentX = null;
    let currentW = null;

    // Helper: Liquid Ink Transfer to target element with squash-and-stretch fluid physics
    function moveIndicatorTo(targetLink, isVisible = true) {
      if (!targetLink) {
        gsap.killTweensOf(navIndicator);
        gsap.to(navIndicator, {
          opacity: 0,
          scaleX: 0.7,
          scaleY: 0.7,
          duration: 0.25,
          ease: 'power2.out',
          onComplete: () => {
            navIndicator.classList.remove('is-visible');
            currentX = null;
            currentW = null;
          },
        });
        return;
      }

      const trackRect = navTrack.getBoundingClientRect();
      const linkRect = targetLink.getBoundingClientRect();
      const targetX = linkRect.left - trackRect.left;
      const targetW = linkRect.width;

      gsap.killTweensOf(navIndicator);

      if (currentX === null || !navIndicator.classList.contains('is-visible')) {
        // Initial ink droplet emergence
        gsap.set(navIndicator, {
          x: targetX,
          width: targetW,
          scaleX: 0.75,
          scaleY: 0.75,
          opacity: 0,
        });
        navIndicator.classList.add('is-visible');
        gsap.to(navIndicator, {
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          duration: 0.35,
          ease: 'back.out(1.6)',
        });
      } else {
        // Fluid Ink Transfer: viscous stretch during flight, then elastic fill & settling
        const deltaX = targetX - currentX;
        const distance = Math.abs(deltaX);
        const duration = Math.min(0.48, Math.max(0.32, distance / 700 + 0.26));

        const tl = gsap.timeline();
        tl.to(navIndicator, {
          x: targetX,
          width: targetW,
          opacity: 1,
          duration: duration,
          ease: 'power3.inOut',
        }, 0)
        // Liquid elongation along the motion vector
        .to(navIndicator, {
          scaleX: 1.22,
          scaleY: 0.84,
          duration: duration * 0.45,
          ease: 'power2.out',
        }, 0)
        // Fluid absorption into target button shape with surface tension damping
        .to(navIndicator, {
          scaleX: 1,
          scaleY: 1,
          duration: duration * 0.55,
          ease: 'elastic.out(1.15, 0.6)',
        }, duration * 0.45);
      }

      currentX = targetX;
      currentW = targetW;
    }

    // Set active link and update styling & accessibility
    function setActiveLink(link, updateIndicator = true) {
      if (activeLink === link) return;

      navLinks.forEach((l) => {
        l.classList.remove('is-active');
        l.removeAttribute('aria-current');
      });

      activeLink = link;

      if (activeLink) {
        activeLink.classList.add('is-active');
        activeLink.setAttribute('aria-current', 'page');
        if (updateIndicator && !isHoveringNav) {
          moveIndicatorTo(activeLink, true);
        }
      } else if (!isHoveringNav) {
        moveIndicatorTo(null, false);
      }
    }

    // Mouse interactions: hover glides the pill, leaving returns to active link
    navLinks.forEach((link) => {
      link.addEventListener('mouseenter', () => {
        isHoveringNav = true;
        navLinks.forEach((l) => l.classList.remove('is-hovered'));
        link.classList.add('is-hovered');
        moveIndicatorTo(link, true);
      });
    });

    navTrack.addEventListener('mouseenter', () => {
      isHoveringNav = true;
    });

    navTrack.addEventListener('mouseleave', () => {
      isHoveringNav = false;
      navLinks.forEach((l) => l.classList.remove('is-hovered'));
      if (activeLink) {
        moveIndicatorTo(activeLink, true);
      } else {
        moveIndicatorTo(null, false);
      }
    });

    // Smooth scroll on click via Lenis
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            setActiveLink(link, true);
            lenis.scrollTo(target, { duration: 1.1 });
          }
        }
      });
    });

    // Active Section Spy via IntersectionObserver & Scroll Calculation
    const sectionsToTrack = navLinks
      .map((link) => {
        const sectionId = link.getAttribute('data-section') || link.getAttribute('href')?.replace('#', '');
        const elem = sectionId ? document.getElementById(sectionId) : null;
        return elem ? { link, elem } : null;
      })
      .filter(Boolean);

    function updateActiveSectionFromScroll() {
      if (isHoveringNav) return;
      const scrollY = window.scrollY || window.pageYOffset;
      const windowH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;

      // At very top (Hero section)
      if (scrollY < 120) {
        setActiveLink(null, true);
        return;
      }

      // At bottom of page (Footer / Horaires)
      if (windowH + scrollY >= docH - 80 && sectionsToTrack.length) {
        const lastSection = sectionsToTrack[sectionsToTrack.length - 1];
        setActiveLink(lastSection.link, true);
        return;
      }

      // Find section whose midpoint is closest to the focal line (top 35% of viewport)
      const focalY = windowH * 0.35;
      let closestItem = null;
      let minDistance = Infinity;

      sectionsToTrack.forEach((item) => {
        const rect = item.elem.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < windowH) {
          const sectionCenter = rect.top + rect.height / 2;
          const distance = Math.abs(sectionCenter - focalY);
          if (distance < minDistance) {
            minDistance = distance;
            closestItem = item;
          }
        }
      });

      if (closestItem) {
        setActiveLink(closestItem.link, true);
      }
    }

    if ('IntersectionObserver' in window && sectionsToTrack.length) {
      const sectionObserver = new IntersectionObserver(
        () => {
          updateActiveSectionFromScroll();
        },
        {
          root: null,
          rootMargin: '-10% 0px -40% 0px',
          threshold: [0, 0.25, 0.5, 0.75, 1],
        }
      );

      sectionsToTrack.forEach((item) => sectionObserver.observe(item.elem));
    }

    // Scroll listener for header elevation & smooth spy updates
    const heroSectionForHeader = document.querySelector('.hero');
    function updateHeaderGlassMode() {
      if (!headerElem) return;
      if (!heroSectionForHeader) {
        const scrollY = window.scrollY || window.pageYOffset;
        if (scrollY > 50) headerElem.classList.add('is-scrolled');
        else headerElem.classList.remove('is-scrolled');
        return;
      }
      const heroRect = heroSectionForHeader.getBoundingClientRect();
      // Keep luxurious dark glass mode throughout Hero; transition to luminous glass when entering liquid canvas
      if (heroRect.bottom <= 110) {
        headerElem.classList.add('is-scrolled');
      } else {
        headerElem.classList.remove('is-scrolled');
      }
    }

    window.addEventListener(
      'scroll',
      () => {
        updateHeaderGlassMode();
        updateActiveSectionFromScroll();
      },
      { passive: true }
    );

    // Initial check after intro animation completes
    setTimeout(() => {
      updateHeaderGlassMode();
      updateActiveSectionFromScroll();
    }, 1800);

    // Recalculate on window resize
    window.addEventListener('resize', () => {
      if (activeLink && !isHoveringNav) {
        moveIndicatorTo(activeLink, true);
      }
    });
  }

  // --- Universal 3D Cylindrical Carousel Engine (inspired by Envato 3D Media Carousel) ---
  function init3DCylinderCarousel({
    sliderId,
    prevBtnId,
    nextBtnId,
    cardSelector,
    refreshHookName,
  }) {
    const slider = document.getElementById(sliderId);
    const prevBtn = document.getElementById(prevBtnId);
    const nextBtn = document.getElementById(nextBtnId);
    if (!slider) return;

    let cards = Array.from(slider.querySelectorAll(cardSelector));
    let visibleCards = cards.filter((c) => window.getComputedStyle(c).display !== 'none');

    let currentIndex = 0;
    const animState = { progress: 0 };
    let isDragging = false;
    let dragStartX = 0;
    let dragStartProgress = 0;
    let hasDragged = false;

    function getCarouselMetrics(totalCount) {
      const vw = window.innerWidth;
      const isFew = (totalCount || 4) <= 4;
      if (vw <= 640) {
        return {
          radius: 440,
          angleStep: isFew ? 42 : 38,
          sensitivity: 220,
          cutOff: (totalCount || 4) >= 5 ? 2.4 : 1.35,
        };
      } else if (vw <= 1024) {
        return {
          radius: 750,
          angleStep: isFew ? 32 : 28,
          sensitivity: 300,
          cutOff: (totalCount || 4) >= 5 ? 2.4 : 1.35,
        };
      } else if (vw <= 1440) {
        return {
          radius: 980,
          angleStep: isFew ? 26 : 23,
          sensitivity: 380,
          cutOff: (totalCount || 4) >= 5 ? 2.4 : 1.35,
        };
      } else {
        return {
          radius: 1200,
          angleStep: isFew ? 24 : 19,
          sensitivity: 440,
          cutOff: (totalCount || 4) >= 5 ? 2.4 : 1.35,
        };
      }
    }

    function render() {
      visibleCards = cards.filter((c) => window.getComputedStyle(c).display !== 'none');
      const total = visibleCards.length;
      if (total === 0) return;

      const { radius, angleStep, cutOff } = getCarouselMetrics(total);
      const progress = animState.progress;

      // Update controls visibility
      if (prevBtn && nextBtn) {
        const controlsGroup = prevBtn.parentElement;
        if (controlsGroup) {
          controlsGroup.style.opacity = total > 1 ? '1' : '0';
          controlsGroup.style.pointerEvents = total > 1 ? 'auto' : 'none';
        }
      }

      visibleCards.forEach((card, idx) => {
        let diff = idx - progress;

        if (total > 2) {
          // Circular shortest path wrap-around
          diff = ((((diff + total / 2) % total) + total) % total) - total / 2;
        }

        const absDiff = Math.abs(diff);
        const angleDeg = diff * angleStep;
        const angleRad = (angleDeg * Math.PI) / 180;

        // Tangent cylindrical 3D geometry
        const transX = Math.round(radius * Math.sin(angleRad));
        const transZ = Math.round(radius * (Math.cos(angleRad) - 1));
        const rotY = -angleDeg;

        // Depth attenuation
        const distRatio = Math.min(1, (1 - Math.cos(angleRad)) / 2);
        const scale = Math.max(0.82, 1 - distRatio * 0.18);
        const brightness = Math.max(0.55, 1 - distRatio * 0.40);
        const zIndex = Math.round((1 - distRatio) * 100);

        // Smooth progressive edge fade so cards transition without popping
        let opacity = Math.max(0, 1 - distRatio * 0.65);
        const fadeMargin = 0.45;
        if (absDiff > cutOff - fadeMargin) {
          const fadeProgress = (cutOff - absDiff) / fadeMargin;
          opacity *= Math.max(0, Math.min(1, fadeProgress));
        }

        if (absDiff >= cutOff) {
          card.style.visibility = 'hidden';
          card.style.pointerEvents = 'none';
        } else {
          card.style.visibility = 'visible';
          card.style.pointerEvents = absDiff < 0.45 ? 'auto' : 'auto';
        }

        card.style.zIndex = zIndex;
        card.style.transform = `translate3d(-50%, 0, 0) translate3d(${transX}px, 0, ${transZ}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        card.style.opacity = opacity.toFixed(2);
        card.style.filter = `brightness(${brightness.toFixed(2)})`;

        if (absDiff < 0.45) {
          card.classList.add('is-active-card');
        } else {
          card.classList.remove('is-active-card');
        }
      });
    }

    function goTo(targetIdx, duration = 0.75) {
      visibleCards = cards.filter((c) => window.getComputedStyle(c).display !== 'none');
      const total = visibleCards.length;
      if (total <= 1) {
        targetIdx = 0;
      } else if (total === 2) {
        targetIdx = Math.max(0, Math.min(1, targetIdx));
      }

      currentIndex = targetIdx;
      gsap.to(animState, {
        progress: targetIdx,
        duration: duration,
        ease: 'power3.out',
        onUpdate: render,
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goTo(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goTo(currentIndex + 1);
      });
    }

    // Pointer Drag & Touch Swipe
    slider.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button, a, input, select, textarea, .js-trigger-drawer, .js-view-boosters-tab')) return;
      isDragging = true;
      hasDragged = false;
      dragStartX = e.clientX;
      dragStartProgress = animState.progress;
      gsap.killTweensOf(animState);
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartX;
      if (Math.abs(deltaX) > 10) {
        hasDragged = true;
      }
      if (hasDragged) {
        const { sensitivity } = getCarouselMetrics(visibleCards.length);
        animState.progress = dragStartProgress - deltaX / sensitivity;
        render();
      }
    });

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;

      if (hasDragged) {
        const target = Math.round(animState.progress);
        goTo(target, 0.45);
        setTimeout(() => {
          hasDragged = false;
        }, 120);
      }
    }

    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // Click handler: let modal and drawer clicks fire naturally; center side card if clicked
    slider.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // If clicked on an interactive trigger, let it execute freely
      if (e.target.closest('.js-open-book-modal, .js-trigger-drawer, .js-view-boosters-tab, button, a')) {
        return;
      }

      const clickedCard = e.target.closest(cardSelector);
      if (clickedCard && !clickedCard.classList.contains('is-active-card')) {
        const idx = visibleCards.indexOf(clickedCard);
        if (idx !== -1) {
          e.preventDefault();
          e.stopPropagation();
          const total = visibleCards.length;
          if (total > 2) {
            let diff = idx - (animState.progress % total);
            diff = ((((diff + total / 2) % total) + total) % total) - total / 2;
            goTo(animState.progress + diff);
          } else {
            goTo(idx);
          }
        }
      }
    });

    // Keyboard Arrow navigation when visible in viewport
    window.addEventListener('keydown', (e) => {
      const rect = slider.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
      if (e.key === 'ArrowLeft') {
        goTo(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        goTo(currentIndex + 1);
      }
    });

    // Immediate synchronous layout calculation
    render();
    slider.classList.add('is-ready');

    window.addEventListener('resize', render);
    setTimeout(render, 40);
    setTimeout(render, 250);

    // Expose refresh hook function for category filter tabs
    if (refreshHookName) {
      window[refreshHookName] = () => {
        cards = Array.from(slider.querySelectorAll(cardSelector));
        visibleCards = cards.filter((c) => window.getComputedStyle(c).display !== 'none');
        currentIndex = 0;
        animState.progress = 0;
        render();
      };
    }
  }

  // Initialize 3D cylindrical carousels for all 3 catalog sections
  init3DCylinderCarousel({
    sliderId: 'booksSlider',
    prevBtnId: 'sliderPrev',
    nextBtnId: 'sliderNext',
    cardSelector: '.book-card',
    refreshHookName: '_refreshBooks3DCarousel',
  });

  init3DCylinderCarousel({
    sliderId: 'stationerySlider',
    prevBtnId: 'stationeryPrev',
    nextBtnId: 'stationeryNext',
    cardSelector: '.stationery-card',
    refreshHookName: '_refreshStationery3DCarousel',
  });

  init3DCylinderCarousel({
    sliderId: 'goodiesSlider',
    prevBtnId: 'goodiesPrev',
    nextBtnId: 'goodiesNext',
    cardSelector: '.goodies-card',
    refreshHookName: '_refreshGoodies3DCarousel',
  });

  // FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        faqItems.forEach((other) => {
          if (other !== item) {
            other.classList.remove('is-open');
          }
        });

        if (isOpen) {
          item.classList.remove('is-open');
        } else {
          item.classList.add('is-open');
        }
      });
    }
  });

  // Easter Egg Mascot Popup
  const easterEggBtn = document.getElementById('easterEggBtn');
  const easterEggBubble = document.getElementById('easterEggBubble');

  if (easterEggBtn && easterEggBubble) {
    easterEggBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      easterEggBubble.classList.toggle('is-active');
    });

    document.addEventListener('click', (e) => {
      if (!easterEggBubble.contains(e.target) && !easterEggBtn.contains(e.target)) {
        easterEggBubble.classList.remove('is-active');
      }
    });
  }

  // Mobile Menu Drawer
  const menuToggle = document.getElementById('menuToggle');
  const menuClose = document.getElementById('menuClose');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileOverlay = document.getElementById('mobileOverlay');

  function openMenu() {
    mobileMenu?.classList.add('is-active');
    mobileOverlay?.classList.add('is-active');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu?.classList.remove('is-active');
    mobileOverlay?.classList.remove('is-active');
    document.body.style.removeProperty('overflow');
  }

  menuToggle?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  mobileOverlay?.addEventListener('click', closeMenu);

  // --- Category Filter Tabs for Books Carousel ---
  const bookFilterTabs = document.querySelectorAll('.books-section .filter-tab');
  const bookCards = document.querySelectorAll('.book-card');

  bookFilterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;

      bookFilterTabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      const tl = gsap.timeline({
        onComplete: () => {
          if (window._refreshBooks3DCarousel) {
            window._refreshBooks3DCarousel();
          }
          window.dispatchEvent(new Event('resize'));
        },
      });
      bookCards.forEach((card) => {
        const cardCategory = card.dataset.category;
        const isMatch = filter === 'all' || cardCategory === filter;

        if (isMatch) {
          card.style.display = 'flex';
          card.style.visibility = 'visible';
          tl.to(card, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
            clearProps: 'opacity',
          }, 0);
        } else {
          tl.to(card, {
            opacity: 0,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
              card.style.display = 'none';
              card.style.visibility = 'hidden';
              if (window._refreshBooks3DCarousel) {
                window._refreshBooks3DCarousel();
              }
            },
          }, 0);
        }
      });

      if (window._refreshBooks3DCarousel) {
        window._refreshBooks3DCarousel();
      }
    });
  });

  // --- Category Filter Tabs for Stationery Section ---
  const stationeryTabs = document.querySelectorAll('.stationery-tab');
  const stationeryCards = document.querySelectorAll('.stationery-card');

  stationeryTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.cat;

      stationeryTabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      const tl = gsap.timeline({
        onComplete: () => {
          if (window._refreshStationery3DCarousel) {
            window._refreshStationery3DCarousel();
          }
          window.dispatchEvent(new Event('resize'));
        },
      });
      stationeryCards.forEach((card) => {
        const itemCat = card.dataset.category;
        const isMatch = cat === 'all' || itemCat === cat;

        if (isMatch) {
          card.style.display = 'flex';
          card.style.visibility = 'visible';
          tl.to(card, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
            clearProps: 'opacity',
          }, 0);
        } else {
          tl.to(card, {
            opacity: 0,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
              card.style.display = 'none';
              card.style.visibility = 'hidden';
              if (window._refreshStationery3DCarousel) {
                window._refreshStationery3DCarousel();
              }
            },
          }, 0);
        }
      });

      if (window._refreshStationery3DCarousel) {
        window._refreshStationery3DCarousel();
      }
    });
  });

  // --- Category Filter Tabs for Goodies Section ---
  const goodiesTabs = document.querySelectorAll('.goodies-tab');
  const goodiesCards = document.querySelectorAll('.goodies-card');

  goodiesTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.cat;

      goodiesTabs.forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      const tl = gsap.timeline({
        onComplete: () => {
          if (window._refreshGoodies3DCarousel) {
            window._refreshGoodies3DCarousel();
          }
          window.dispatchEvent(new Event('resize'));
        },
      });
      goodiesCards.forEach((card) => {
        const itemCat = card.dataset.category;
        const view = card.dataset.goodiesView;

        let isMatch = false;
        if (cat === 'all') {
          // On 'all', show combo fan card, hide individual booster cards
          isMatch = view !== 'individual';
        } else if (cat === 'cartes') {
          // On 'cartes', show individual booster cards, hide combo fan card
          isMatch = itemCat === 'cartes' && view !== 'combo';
        } else {
          // Specific categories (bonbons, bijoux, kpop)
          isMatch = itemCat === cat;
        }

        if (isMatch) {
          card.style.display = 'flex';
          card.style.visibility = 'visible';
          tl.to(card, {
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
            clearProps: 'opacity',
          }, 0);
        } else {
          tl.to(card, {
            opacity: 0,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
              card.style.display = 'none';
              card.style.visibility = 'hidden';
              if (window._refreshGoodies3DCarousel) {
                window._refreshGoodies3DCarousel();
              }
            },
          }, 0);
        }
      });

      if (window._refreshGoodies3DCarousel) {
        window._refreshGoodies3DCarousel();
      }
    });
  });

  // Combo card action: switch to 'cartes' tab
  const viewBoostersBtns = document.querySelectorAll('.js-view-boosters-tab');
  viewBoostersBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cartesTab = document.querySelector('.goodies-tab[data-cat="cartes"]');
      if (cartesTab) {
        cartesTab.click();
      }
    });
  });

  // --- Toast Notification Engine ---
  const toastContainer = document.getElementById('toastContainer');

  function showToast(title, message) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="toast__icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </div>
      <div class="toast__content">
        <div class="toast__title">${title}</div>
        <div class="toast__desc">${message}</div>
      </div>
    `;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('is-show');
    });

    setTimeout(() => {
      toast.classList.remove('is-show');
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 4500);
  }

  // --- Sliding Drawer: Fiche Ouvrage & Réservation Express ---
  const bookDrawer = document.getElementById('bookDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerClose = document.getElementById('drawerClose');
  const drawerCover = document.getElementById('drawerCover');
  const drawerBadge = document.getElementById('drawerBadge');
  const drawerTitle = document.getElementById('drawerTitle');
  const drawerAuthor = document.getElementById('drawerAuthor');
  const drawerPublisher = document.getElementById('drawerPublisher');
  const drawerFormat = document.getElementById('drawerFormat');
  const drawerPages = document.getElementById('drawerPages');
  const drawerStock = document.getElementById('drawerStock');
  const drawerSynopsis = document.getElementById('drawerSynopsis');
  const drawerBookId = document.getElementById('drawerBookId');
  const drawerReservationForm = document.getElementById('drawerReservationForm');

  function openDrawer(data) {
    if (!bookDrawer) return;

    if (drawerCover) {
      let coverSrc = data.cover || '';
      if (data.id) {
        const sourceCard = document.querySelector(`[data-id="${data.id}"]`);
        const coverImg = sourceCard?.querySelector('.book-3d__cover-img') || sourceCard?.querySelector('img');
        if (coverImg && (coverImg.currentSrc || coverImg.src)) {
          coverSrc = coverImg.currentSrc || coverImg.src;
        }
      }
      drawerCover.src = coverSrc;
      drawerCover.alt = `Couverture de ${data.title || "l'ouvrage"}`;
    }
    if (drawerBadge) {
      drawerBadge.textContent = data.badge || 'Sélection Coup de Cœur';
      if (data.badgeColor) {
        drawerBadge.style.backgroundColor = data.badgeColor;
        drawerBadge.style.color = '#000000';
      } else {
        drawerBadge.style.backgroundColor = 'var(--color-yellow)';
        drawerBadge.style.color = 'var(--color-black)';
      }
    }
    if (drawerTitle) drawerTitle.textContent = data.title || '';
    if (drawerAuthor) drawerAuthor.textContent = data.author ? `Par ${data.author}` : '';
    if (drawerPublisher) drawerPublisher.textContent = data.publisher ? `Éditeur : ${data.publisher}` : '';
    if (drawerFormat) drawerFormat.textContent = data.format || 'Grand Format';
    if (drawerPages) drawerPages.textContent = data.pages || 'Disponible';
    if (drawerStock) drawerStock.textContent = data.stock || 'En stock au comptoir';
    if (drawerSynopsis) drawerSynopsis.textContent = data.synopsis || '';
    if (drawerBookId) drawerBookId.value = data.id || '';

    bookDrawer.removeAttribute('inert');
    bookDrawer.classList.add('is-active');
    drawerOverlay?.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    drawerClose?.focus();
  }

  function closeDrawer() {
    if (!bookDrawer) return;
    bookDrawer.classList.remove('is-active');
    drawerOverlay?.classList.remove('is-active');
    bookDrawer.setAttribute('inert', '');
    document.body.style.removeProperty('overflow');
  }

  drawerClose?.addEventListener('click', closeDrawer);
  drawerOverlay?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bookDrawer?.classList.contains('is-active')) {
      closeDrawer();
    }
  });

  // Attach .js-trigger-drawer click handlers
  document.querySelectorAll('.js-trigger-drawer').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.book-card') || btn.closest('.exclusive-card') || btn;
      const dataset = { ...card.dataset, ...btn.dataset };
      openDrawer(dataset);
    });

    // Keyboard support for cover wraps
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const card = btn.closest('.book-card') || btn.closest('.exclusive-card') || btn;
        const dataset = { ...card.dataset, ...btn.dataset };
        openDrawer(dataset);
      }
    });
  });

  // Drawer reservation form submit
  if (drawerReservationForm) {
    drawerReservationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const bookTitle = drawerTitle?.textContent || 'votre ouvrage';
      const nameInput = document.getElementById('reserName');
      const name = nameInput?.value || '';

      closeDrawer();

      showToast(
        'Réservation confirmée !',
        `Merci ${name}, « ${bookTitle} » est mis de côté au comptoir sous votre nom. Retrait sans frais sous 48h.`
      );

      drawerReservationForm.reset();
    });
  }

  // --- Module: 3D Open Book Modal (Option A - GSAP Animation) ---
  const bookOpenModal = document.getElementById('bookOpenModal');
  const bookModalOverlay = document.getElementById('bookModalOverlay');
  const bookModalClose = document.getElementById('bookModalClose');
  const openBook3D = document.getElementById('openBook3D');
  const openBookShadow = document.getElementById('openBookShadow');
  const openBookCoverWing = document.getElementById('openBookCoverWing');
  const openBookFlipPrompt = document.getElementById('openBookFlipPrompt');
  const openBookRecloseBtn = document.getElementById('openBookRecloseBtn');
  const openBookPageLeft = document.querySelector('.open-book__page--left');

  const modalBookBadge = document.getElementById('modalBookBadge');
  const modalBookCategory = document.getElementById('modalBookCategory');
  const modalBookCover = document.getElementById('modalBookCover');
  const modalCoverWingImg = document.getElementById('modalCoverWingImg');
  const modalBookTitleLeft = document.getElementById('modalBookTitleLeft');
  const modalBookAuthorLeft = document.getElementById('modalBookAuthorLeft');
  const modalBookPublisher = document.getElementById('modalBookPublisher');
  const modalBookFormat = document.getElementById('modalBookFormat');
  const modalBookPages = document.getElementById('modalBookPages');
  const modalBookStock = document.getElementById('modalBookStock');
  const modalBookPrice = document.getElementById('modalBookPrice');
  const modalBookRunningTitle = document.getElementById('modalBookRunningTitle');
  const modalBookSynopsis = document.getElementById('modalBookSynopsis');
  const modalBookReserveBtn = document.getElementById('modalBookReserveBtn');

  let currentModalBookData = null;
  let activeModalTrigger = null;
  let isBookModalAnimating = false;
  let isCoverOpen = false;

  function formatBookSynopsis(text) {
    if (!text) return '';
    const trimmed = text.trim();
    if (trimmed.length === 0) return '';
    const firstChar = trimmed.charAt(0);
    const remainder = trimmed.slice(1);
    return `<p><span class="open-book__drop-cap">${firstChar}</span>${remainder}</p>`;
  }

  function openBookModal(data, triggerEl) {
    if (!bookOpenModal || isBookModalAnimating) return;
    isBookModalAnimating = true;
    currentModalBookData = data;
    activeModalTrigger = triggerEl || null;

    // Populate data
    if (modalBookBadge) {
      modalBookBadge.textContent = data.badge || 'Sélection Coup de Cœur';
      if (data.badgeColor) {
        modalBookBadge.style.backgroundColor = data.badgeColor;
        modalBookBadge.style.color = '#000000';
      } else {
        modalBookBadge.style.backgroundColor = 'var(--color-yellow)';
        modalBookBadge.style.color = 'var(--color-black)';
      }
    }

    if (modalBookCategory) {
      modalBookCategory.textContent = data.category ? `Rayon ${data.category.toUpperCase()}` : 'Sélection Littéraire';
    }

    // Resolve cover from live rendered DOM image (which Vite has already resolved/hashed), fallback to data.cover
    let resolvedCover = data.cover || '';
    if (triggerEl) {
      const card = triggerEl.closest('.book-card') || triggerEl.closest('.exclusive-card') || triggerEl;
      const imgEl = card?.querySelector('.book-3d__cover-img') || triggerEl.querySelector('img') || card?.querySelector('img');
      if (imgEl && (imgEl.currentSrc || imgEl.src)) {
        resolvedCover = imgEl.currentSrc || imgEl.src;
      }
    } else if (data.id) {
      const card = document.querySelector(`[data-id="${data.id}"]`);
      const imgEl = card?.querySelector('.book-3d__cover-img') || card?.querySelector('img');
      if (imgEl && (imgEl.currentSrc || imgEl.src)) {
        resolvedCover = imgEl.currentSrc || imgEl.src;
      }
    }

    if (modalBookCover) {
      modalBookCover.src = resolvedCover;
      modalBookCover.alt = `Couverture de ${data.title || "l'ouvrage"}`;
    }

    if (modalCoverWingImg) {
      modalCoverWingImg.src = resolvedCover;
      modalCoverWingImg.alt = `Couverture de ${data.title || "l'ouvrage"}`;
    }

    if (modalBookTitleLeft) modalBookTitleLeft.textContent = data.title || '';
    if (modalBookRunningTitle) modalBookRunningTitle.textContent = data.title || '';
    if (modalBookAuthorLeft) modalBookAuthorLeft.textContent = data.author ? `Par ${data.author}` : '';
    if (modalBookPublisher) modalBookPublisher.textContent = data.publisher || 'Éditeur inconnu';
    if (modalBookFormat) modalBookFormat.textContent = data.format ? data.format.split('•')[0].trim() : 'Grand Format';
    if (modalBookPages) modalBookPages.textContent = data.pages || 'Disponible';
    if (modalBookStock) modalBookStock.textContent = data.stock || 'En stock au comptoir';
    
    if (modalBookPrice) {
      const priceMatch = (data.format || '').match(/\d+[\.,]\d+\s*€/);
      modalBookPrice.textContent = priceMatch ? priceMatch[0] : (data.price || '22,90 €');
    }

    if (modalBookSynopsis) {
      modalBookSynopsis.innerHTML = formatBookSynopsis(data.synopsis || '');
    }

    // Set spine color on 3D book
    const spineColor = data.spineColor || '#202731';
    if (openBook3D) {
      openBook3D.style.setProperty('--book-spine-bg', spineColor.trim());
    }

    // Activate modal accessibility & visual state
    bookOpenModal.removeAttribute('inert');
    bookOpenModal.classList.add('is-active');
    bookModalOverlay?.classList.add('is-active');
    document.body.style.overflow = 'hidden';

    // 3D GSAP animation
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      gsap.fromTo(openBook3D,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          ease: 'power3.out',
          onComplete: () => {
            isBookModalAnimating = false;
            bookModalClose?.focus();
          }
        }
      );
    } else {
      const tl = gsap.timeline({
        onComplete: () => {
          isBookModalAnimating = false;
          openBookFlipPrompt?.focus();
        }
      });

      // Start closed: cover sitting over right page, waiting for user click
      isCoverOpen = false;
      openBook3D.classList.remove('is-open');

      gsap.set(openBookCoverWing, { rotateY: 0 });
      if (openBookFlipPrompt) {
        gsap.set(openBookFlipPrompt, { opacity: 1, display: 'flex' });
      }
      if (openBookPageLeft) {
        gsap.set(openBookPageLeft, { opacity: 0.45, filter: 'brightness(0.75)' });
      }

      gsap.set(openBook3D, { scale: 0.85, opacity: 0, y: 35, rotateX: 16, rotateY: -6 });
      gsap.set(openBookShadow, { scale: 0.6, opacity: 0 });

      // Animate closed book rising smoothly to the center of the viewport
      tl.to(openBook3D, {
        scale: 1,
        opacity: 1,
        y: 0,
        rotateX: 8,
        rotateY: 0,
        duration: 0.55,
        ease: 'power3.out'
      })
      .to(openBookShadow, {
        scale: 1,
        opacity: 0.65,
        duration: 0.55,
        ease: 'power3.out'
      }, '<');
    }
  }

  // Manual Page Turn Action (User controlled)
  function turnCover(open) {
    if (isBookModalAnimating) return;
    isBookModalAnimating = true;

    if (open) {
      // User opens the book
      if (openBookFlipPrompt) {
        gsap.to(openBookFlipPrompt, {
          opacity: 0,
          scale: 0.88,
          duration: 0.25,
          onComplete: () => {
            openBookFlipPrompt.style.display = 'none';
          }
        });
      }

      gsap.to(openBookCoverWing, {
        rotateY: -180,
        duration: 0.85,
        ease: 'power2.inOut',
        onComplete: () => {
          isCoverOpen = true;
          isBookModalAnimating = false;
          openBook3D.classList.add('is-open');
        }
      });

      if (openBookPageLeft) {
        gsap.to(openBookPageLeft, {
          opacity: 1,
          filter: 'brightness(1)',
          duration: 0.75,
          ease: 'power2.out'
        });
      }
    } else {
      // User re-closes the book
      openBook3D.classList.remove('is-open');

      if (openBookFlipPrompt) {
        openBookFlipPrompt.style.display = 'flex';
        gsap.fromTo(openBookFlipPrompt,
          { opacity: 0, scale: 0.88 },
          { opacity: 1, scale: 1, duration: 0.35, delay: 0.4 }
        );
      }

      gsap.to(openBookCoverWing, {
        rotateY: 0,
        duration: 0.75,
        ease: 'power2.inOut',
        onComplete: () => {
          isCoverOpen = false;
          isBookModalAnimating = false;
        }
      });

      if (openBookPageLeft) {
        gsap.to(openBookPageLeft, {
          opacity: 0.45,
          filter: 'brightness(0.75)',
          duration: 0.65,
          ease: 'power2.in'
        });
      }
    }
  }

  // Click on closed cover or flip prompt to open
  openBookCoverWing?.addEventListener('click', (e) => {
    // If book is not open yet, click turns the page
    if (!isCoverOpen && !e.target.closest('#openBookRecloseBtn')) {
      turnCover(true);
    }
  });

  openBookFlipPrompt?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      turnCover(true);
    }
  });

  // Click on reclose button to turn back
  openBookRecloseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    turnCover(false);
  });

  function closeBookModal() {
    if (!bookOpenModal || isBookModalAnimating || !bookOpenModal.classList.contains('is-active')) return;
    isBookModalAnimating = true;

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      gsap.to(openBook3D, {
        opacity: 0,
        y: 20,
        scale: 0.95,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: finalizeBookModalClose
      });
    } else {
      const tl = gsap.timeline({ onComplete: finalizeBookModalClose });

      // Rotate cover back to closed if it was opened
      if (isCoverOpen) {
        tl.to(openBookCoverWing, {
          rotateY: 0,
          duration: 0.55,
          ease: 'power2.inOut'
        });
      }

      tl.to(openBook3D, {
        scale: 0.88,
        opacity: 0,
        y: 25,
        duration: 0.35,
        ease: 'power2.in'
      }, isCoverOpen ? '-=0.2' : 0)
      .to(openBookShadow, {
        opacity: 0,
        scale: 0.6,
        duration: 0.35
      }, '<');
    }

    function finalizeBookModalClose() {
      bookOpenModal.classList.remove('is-active');
      bookModalOverlay?.classList.remove('is-active');
      bookOpenModal.setAttribute('inert', '');
      document.body.style.removeProperty('overflow');
      isCoverOpen = false;
      isBookModalAnimating = false;
      if (activeModalTrigger && typeof activeModalTrigger.focus === 'function') {
        activeModalTrigger.focus();
      }
    }
  }

  bookModalClose?.addEventListener('click', closeBookModal);
  bookModalOverlay?.addEventListener('click', closeBookModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bookOpenModal?.classList.contains('is-active')) {
      closeBookModal();
    }
  });

  // Action button inside open book: Close book and open reservation drawer
  modalBookReserveBtn?.addEventListener('click', () => {
    const bookData = currentModalBookData;
    closeBookModal();
    if (bookData) {
      setTimeout(() => {
        openDrawer(bookData);
      }, 350);
    }
  });

  // Attach .js-open-book-modal trigger handlers
  document.querySelectorAll('.js-open-book-modal').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const card = trigger.closest('.book-card') || trigger.closest('.exclusive-card') || trigger;
      const dataset = { ...card.dataset, ...trigger.dataset };
      
      const book3dEl = trigger.querySelector('.book-3d');
      if (book3dEl) {
        const compStyle = getComputedStyle(book3dEl);
        dataset.spineColor = compStyle.getPropertyValue('--spine-color') || '#202731';
      }

      const coverImg = card.querySelector('.book-3d__cover-img') || trigger.querySelector('img') || card.querySelector('img');
      if (coverImg && (coverImg.currentSrc || coverImg.src)) {
        dataset.cover = coverImg.currentSrc || coverImg.src;
      }

      openBookModal(dataset, trigger);
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const card = trigger.closest('.book-card') || trigger.closest('.exclusive-card') || trigger;
        const dataset = { ...card.dataset, ...trigger.dataset };
        const book3dEl = trigger.querySelector('.book-3d');
        if (book3dEl) {
          const compStyle = getComputedStyle(book3dEl);
          dataset.spineColor = compStyle.getPropertyValue('--spine-color') || '#202731';
        }

        const coverImg = card.querySelector('.book-3d__cover-img') || trigger.querySelector('img') || card.querySelector('img');
        if (coverImg && (coverImg.currentSrc || coverImg.src)) {
          dataset.cover = coverImg.currentSrc || coverImg.src;
        }

        openBookModal(dataset, trigger);
      }
    });
  });

  // --- 3D Interactive Micro-interactions on 2.5D Book Mockups & Exclusive Book ---
  const bookStages = document.querySelectorAll('.book-3d-stage');
  bookStages.forEach((stage) => {
    const book = stage.querySelector('.book-3d');
    const shadow = stage.querySelector('.book-3d-shadow');
    if (!book) return;

    stage.addEventListener('mousemove', (e) => {
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(book, {
        rotateY: -16 + x * 22,
        rotateX: 4 - y * 16,
        y: -12,
        scale: 1.04,
        duration: 0.3,
        ease: 'power2.out',
      });

      if (shadow) {
        gsap.to(shadow, {
          x: x * 15,
          scale: 1.15,
          opacity: 0.6,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    });

    stage.addEventListener('mouseleave', () => {
      gsap.to(book, {
        rotateY: -24,
        rotateX: 8,
        rotateZ: -1.5,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'power2.out',
      });

      if (shadow) {
        gsap.to(shadow, {
          x: 0,
          scale: 1,
          opacity: 0.45,
          duration: 0.6,
          ease: 'power2.out',
        });
      }
    });
  });

  // --- 3D Interactive Micro-interactions on Stationery Mockups ---
  const stationeryStages = document.querySelectorAll('.stationery-3d-stage');

  stationeryStages.forEach((stage) => {
    const item = stage.querySelector('.stationery-3d-item');
    const shadow = stage.querySelector('.stationery-3d-shadow');
    if (!item) return;

    const base = { rY: -8, rX: 6 };

    stage.addEventListener('mousemove', (e) => {
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(item, {
        rotateY: base.rY + x * 20,
        rotateX: base.rX - y * 16,
        y: -10,
        scale: 1.04,
        duration: 0.3,
        ease: 'power2.out',
      });

      if (shadow) {
        gsap.to(shadow, {
          x: x * 15,
          scale: 1.18,
          opacity: 0.6,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    });

    stage.addEventListener('mouseleave', () => {
      gsap.to(item, {
        rotateY: base.rY,
        rotateX: base.rX,
        y: 0,
        scale: 0.97,
        duration: 0.6,
        ease: 'power2.out',
      });

      if (shadow) {
        gsap.to(shadow, {
          x: 0,
          scale: 1,
          opacity: 0.45,
          duration: 0.6,
          ease: 'power2.out',
        });
      }
    });
  });

  // --- 3D WebGL Showcase for Goodies (Lazy-Loaded for Performance) ---
  const goodiesSection = document.getElementById('goodies');
  if (goodiesSection) {
    const goodiesObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        goodiesObserver.disconnect();
        import('./three-goodies.js').then((module) => {
          module.initThreeGoodies();
        }).catch((err) => {
          console.warn('Could not load 3D goodies module:', err);
        });
      }
    }, { rootMargin: '300px' });
    goodiesObserver.observe(goodiesSection);
  }

  // --- Newsletter Form ---
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input');
      if (input && input.value) {
        const userEmail = input.value;
        input.value = '';
        input.placeholder = 'Merci pour votre inscription !';
        showToast('Inscription confirmée !', `La Gazette littéraire du mois sera envoyée à ${userEmail}.`);
      }
    });
  }

  // --- Liquid Animated Background Scroll Orchestrator (Multi-Color & Shape Morphing) ---
  function initLiquidBackgroundScroll() {
    const liquidBg = document.getElementById('liquidBackground');
    if (!liquidBg) return;

    const waveEl1 = liquidBg.querySelector('.liquid-bg__wave--1');
    const waveEl2 = liquidBg.querySelector('.liquid-bg__wave--2');
    const heroSection = document.querySelector('.hero');
    const sections = Array.from(document.querySelectorAll('[data-liquid-bg]'));
    if (!sections.length) return;

    // 1. Initial State Check (if user refreshes mid-page or below hero)
    function checkHeroPosition() {
      if (!heroSection) {
        liquidBg.classList.add('is--active');
        return;
      }
      const heroRect = heroSection.getBoundingClientRect();
      if (heroRect.bottom <= window.innerHeight * 0.45) {
        liquidBg.classList.add('is--active');
        const activeSection = sections.find((sec) => {
          const r = sec.getBoundingClientRect();
          return r.top <= window.innerHeight * 0.65 && r.bottom >= window.innerHeight * 0.35;
        }) || sections[0];
        if (activeSection) {
          updateLiquidWave(activeSection, 0.4);
        }
      } else {
        liquidBg.classList.remove('is--active');
      }
    }

    // 2. Hide liquid background when inside Hero, fade in when leaving Hero
    if (heroSection) {
      ScrollTrigger.create({
        trigger: heroSection,
        start: 'top top',
        end: 'bottom 45%',
        onEnter: () => liquidBg.classList.remove('is--active'),
        onEnterBack: () => liquidBg.classList.remove('is--active'),
        onLeave: () => liquidBg.classList.add('is--active'),
      });
    }

    // 3. Update colors and morph SVG paths smoothly when crossing each section
    function updateLiquidWave(section, duration = 1.25) {
      const bg = section.dataset.liquidBg;
      const wave1 = section.dataset.liquidWave1;
      const wave2 = section.dataset.liquidWave2;
      const path1 = section.dataset.liquidPath1;
      const path2 = section.dataset.liquidPath2;

      // Update color tokens
      if (bg) liquidBg.style.setProperty('--liquid-bg', bg);
      if (wave1) liquidBg.style.setProperty('--liquid-wave-1', wave1);
      if (wave2) liquidBg.style.setProperty('--liquid-wave-2', wave2);

      // Morph SVG wave paths smoothly
      if (path1 && waveEl1) {
        gsap.to(waveEl1, {
          attr: { d: path1 },
          duration: duration,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
      }
      if (path2 && waveEl2) {
        gsap.to(waveEl2, {
          attr: { d: path2 },
          duration: duration + 0.1,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });
      }
    }

    sections.forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 65%',
        end: 'bottom 35%',
        onEnter: () => updateLiquidWave(section),
        onEnterBack: () => updateLiquidWave(section),
      });
    });

    checkHeroPosition();
  }

  initLiquidBackgroundScroll();
});
