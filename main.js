/* Webforge shared behavior — loaded on every page. Handles: reveal-on-
   scroll, nav scroll state, mobile menu, lerp cursor, magnetic buttons,
   micro sound effects, and a text-scramble effect for .scramble headings. */
(function(){
  var reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.14,rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el);});

  /* Marquee backdrop — [data-marquee-phrase="X"] fills itself with two
     identical halves of "X · " repeated, each half wider than the screen, so
     translating by exactly -50% loops seamlessly with no visible seam. */
  document.querySelectorAll('[data-marquee-phrase]').forEach(function(track){
    var line=track.dataset.marqueePhrase+' · ';
    var repeated=line.repeat(8);
    track.innerHTML='<span>'+repeated+'</span><span>'+repeated+'</span>';
  });

  var nav=document.getElementById('nav'),prog=document.getElementById('progress');
  function onScroll(){
    var y=window.scrollY||0;
    if(nav) nav.classList.toggle('scrolled',y>40);
    if(prog){
      var h=document.documentElement.scrollHeight-window.innerHeight;
      prog.style.width=(h>0?(y/h*100):0)+'%';
    }
  }
  window.addEventListener('scroll',function(){requestAnimationFrame(onScroll);},{passive:true});
  onScroll();

  var menu=document.getElementById('menu'),burger=document.getElementById('burger'),menuClose=document.getElementById('menuClose');
  if(burger && menu){
    burger.addEventListener('click',function(){menu.classList.add('open');});
    if(menuClose) menuClose.addEventListener('click',function(){menu.classList.remove('open');});
    menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){menu.classList.remove('open');});});
  }

  var yr=document.getElementById('yr');
  if(yr) yr.textContent=new Date().getFullYear();

  var cursor=document.getElementById('cursorOrb');
  var fine=window.matchMedia('(pointer:fine)').matches;
  if(cursor && fine && !reduceMotion){
    document.documentElement.classList.add('has-custom-cursor');
    var mx=innerWidth/2, my=innerHeight/2, cx=mx, cy=my, cScale=1, cScaleTarget=1;
    window.addEventListener('mousemove',function(e){cursor.classList.add('on'); mx=e.clientX; my=e.clientY;},{passive:true});
    document.querySelectorAll('a,button,.pill').forEach(function(el){
      el.addEventListener('mouseenter',function(){cScaleTarget=1.8;});
      el.addEventListener('mouseleave',function(){cScaleTarget=1;});
    });
    (function tick(){
      cx+=(mx-cx)*.16; cy+=(my-cy)*.16; cScale+=(cScaleTarget-cScale)*.2;
      cursor.style.transform='translate('+cx+'px,'+cy+'px) translate(-50%,-50%) scale('+cScale.toFixed(2)+')';
      requestAnimationFrame(tick);
    })();
  }

  if(fine && window.gsap && !reduceMotion){
    document.querySelectorAll('.pill').forEach(function(btn){
      btn.addEventListener('mousemove',function(e){
        var r=btn.getBoundingClientRect();
        var bx=e.clientX-(r.left+r.width/2), by=e.clientY-(r.top+r.height/2);
        gsap.to(btn,{x:bx*.25,y:by*.4,duration:.4,ease:'power2.out'});
      });
      btn.addEventListener('mouseleave',function(){gsap.to(btn,{x:0,y:0,duration:.5,ease:'elastic.out(1,.4)'});});
    });
  }

  /* Micro sound effects — soft synthesized tones on hover/click for nav
     links and CTA buttons, not a music track. Generated with the Web Audio
     API rather than audio files, so there's nothing to source or license.
     Browsers won't play audio before a genuine user gesture, so the context
     is created lazily and also eagerly unlocked on the first pointerdown
     anywhere, so hover ticks work as soon as possible rather than staying
     silent until someone happens to click a sound-wired element first. */
  if(fine && !reduceMotion && (window.AudioContext||window.webkitAudioContext)){
    var actx;
    function audioCtx(){
      if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)();
      if(actx.state==='suspended') actx.resume();
      return actx;
    }
    document.addEventListener('pointerdown',audioCtx,{once:true});
    function tone(freq,duration,peak,type){
      var c=audioCtx();
      var osc=c.createOscillator(), gain=c.createGain();
      osc.type=type; osc.frequency.value=freq;
      gain.gain.setValueAtTime(0,c.currentTime);
      gain.gain.linearRampToValueAtTime(peak,c.currentTime+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);
      osc.connect(gain).connect(c.destination);
      osc.start(); osc.stop(c.currentTime+duration+.02);
    }
    function hoverTick(){ tone(1100,.06,.045,'sine'); }
    function clickTick(){ tone(680,.08,.09,'triangle'); setTimeout(function(){tone(920,.06,.06,'triangle');},35); }
    document.querySelectorAll('.navlinks a, .pill, .burger').forEach(function(el){
      el.addEventListener('mouseenter',hoverTick);
      el.addEventListener('click',clickTick);
    });
  }

  /* Text scramble — headings marked .scramble decode from random characters
     into their real text once they're revealed. Skipped under reduced-motion. */
  if(!reduceMotion){
    var CHARS='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    document.querySelectorAll('.scramble').forEach(function(el){
      var final=el.textContent;
      var len=final.length;
      var scrambleIO=new IntersectionObserver(function(es){
        es.forEach(function(e){
          if(!e.isIntersecting) return;
          scrambleIO.unobserve(el);
          var frame=0, totalFrames=24;
          var timer=setInterval(function(){
            frame++;
            var revealCount=Math.floor((frame/totalFrames)*len);
            var out='';
            for(var i=0;i<len;i++){
              if(i<revealCount || final[i]===' ') out+=final[i];
              else out+=CHARS[Math.floor(Math.random()*CHARS.length)];
            }
            el.textContent=out;
            if(frame>=totalFrames){ clearInterval(timer); el.textContent=final; }
          },28);
        });
      },{threshold:.4});
      scrambleIO.observe(el);
    });
  }
})();
