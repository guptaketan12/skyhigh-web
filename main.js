/* Webforge shared behavior — used by every page except the homepage (its
   stepper/WebGL logic stays self-contained in index.html). Handles: reveal-
   on-scroll, nav scroll state, mobile menu, lerp cursor, magnetic buttons,
   and a small text-scramble effect for headings marked with .scramble. */
(function(){
  var reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.14,rootMargin:'0px 0px -6% 0px'});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el);});

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
