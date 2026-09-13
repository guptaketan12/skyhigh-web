/* Webforge shared behavior — loaded on every page. Handles: reveal-on-
   scroll, nav scroll state, mobile menu, lerp cursor, magnetic buttons,
   an opt-in ambient sound toggle, and a text-scramble effect for
   .scramble headings. */
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

  /* Ambient sound toggle — off by default, a visitor has to click it.
     The pad is a few detuned sine oscillators through a slowly sweeping
     filter, synthesized with the Web Audio API rather than a licensed
     track, so there's nothing to source. It doesn't persist across
     pages: a fresh document needs its own user gesture before audio can
     play, so carrying an "on" flag over would just leave the button
     lit with no sound until someone clicked again anyway. */
  if(window.AudioContext||window.webkitAudioContext){
    var ambientBtn=document.createElement('button');
    ambientBtn.className='ambient-toggle';
    ambientBtn.setAttribute('aria-label','Toggle ambient sound');
    ambientBtn.setAttribute('aria-pressed','false');
    ambientBtn.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path class="wave" d="M16.3 8.7a5 5 0 0 1 0 6.6"/></svg>';
    document.body.appendChild(ambientBtn);

    var actx, playing=false, liveNodes=[];
    function startAmbient(){
      if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)();
      if(actx.state==='suspended') actx.resume();
      var master=actx.createGain();
      master.gain.setValueAtTime(0,actx.currentTime);
      master.gain.linearRampToValueAtTime(.05,actx.currentTime+1.6);
      master.connect(actx.destination);
      var filter=actx.createBiquadFilter();
      filter.type='lowpass'; filter.frequency.value=900;
      filter.connect(master);
      liveNodes=[filter,master];
      [110,165,220].forEach(function(freq){
        var osc=actx.createOscillator(), g=actx.createGain();
        osc.type='sine'; osc.frequency.value=freq+(Math.random()*1.5-.75);
        g.gain.value=.33;
        osc.connect(g).connect(filter);
        osc.start();
        liveNodes.push(osc,g);
      });
      var lfo=actx.createOscillator(), lfoGain=actx.createGain();
      lfo.frequency.value=.05; lfoGain.gain.value=350;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
      liveNodes.push(lfo,lfoGain);
      playing=true;
      ambientBtn.classList.add('on');
      ambientBtn.setAttribute('aria-pressed','true');
    }
    function stopAmbient(){
      var master=liveNodes[1], toStop=liveNodes;
      if(master) master.gain.linearRampToValueAtTime(0,actx.currentTime+.6);
      setTimeout(function(){
        toStop.forEach(function(n){ try{ if(n.stop) n.stop(); n.disconnect(); }catch(e){} });
      },650);
      liveNodes=[]; playing=false;
      ambientBtn.classList.remove('on');
      ambientBtn.setAttribute('aria-pressed','false');
    }
    ambientBtn.addEventListener('click',function(){ playing?stopAmbient():startAmbient(); });
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
