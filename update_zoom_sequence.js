const fs = require('fs');
const path = require('path');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const startMarker = 'HIDE_DURATION=.5;ZOOM_DURATION=.4;';
  const endMarker = 'let n=settings.SKIP_ANIMATION?+properties.hasStarted:math.saturate(properties.startTime);';

  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker, startIdx);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Markers not found in ${filePath}`);
  }

  const newCode = `HIDE_DURATION=.5;ZOOM_DURATION=1.9;APPROACH_DURATION=0.5;HOLD_DURATION=1.0;RUSH_DURATION=0.4;zoomTime=0;zoomProgress=0;zoomScale=1;isActive=!1;lineTransformTime=0;digitsWidth=0;preInit(){this.domContainer=document.getElementById("preloader"),this.domDigitsContainer=document.getElementById("preloader-percent-digits"),this.domDigits=document.querySelectorAll(".preloader-percent-digit");for(let e=0;e<this.domDigits.length;e++){let t=this.domDigits[e];t._domNums=t.querySelectorAll(".preloader-percent-digit-num"),t._domNums[1]&&(t._domNums[1].style.display="none"),t._easedVal=0}}init(){}show(e,t){this._initCallback=e,this._startCallback=t,this.isActive=!0,this.zoomTime=0,this.zoomProgress=0,this.zoomScale=1,properties.loader.start(r=>{this.percentTarget=r})}hide(){}resize(e,t,r){r!==!0&&(this.digitsWidth=this.domDigitsContainer.offsetWidth)}update(e){if(!this.isActive)return;this.percent=Math.min(this.percentTarget,this.percent+(settings.SKIP_ANIMATION?1:this.percentTarget>this.percent?e:0)/this.MIN_PRELOAD_DURATION),this.percentTarget==1&&(properties.hasInitialized||this._initCallback(),this.percentToStart=settings.SKIP_ANIMATION?1:Math.min(taskManager.percent,this.percentToStart+e/this.MIN_DURATION_BETWEEN_INIT_AND_START));let t=this.percentToStart*this.PERCENT_BETWEEN_INIT_AND_START+this.percent*(1-this.PERCENT_BETWEEN_INIT_AND_START),zoomEased=0;if(t==1){document.documentElement.classList.add("is-black-bg"),document.body.style.backgroundColor="#000000";const totalDur=this.APPROACH_DURATION+this.HOLD_DURATION+this.RUSH_DURATION;(window.__FREEZE_ZOOM_TIME!=null&&this.zoomTime>=window.__FREEZE_ZOOM_TIME)?this.zoomTime=window.__FREEZE_ZOOM_TIME:(window.__FREEZE_ZOOM_PROGRESS!=null&&this.zoomProgress>=window.__FREEZE_ZOOM_PROGRESS)?this.zoomTime=window.__FREEZE_ZOOM_PROGRESS*totalDur:(this.zoomTime+=settings.SKIP_ANIMATION?totalDur:e);this.zoomProgress=Math.min(1,this.zoomTime/totalDur);let blurPx=0,letterSpacing=0,opacity=1,spreadX=0;if(this.zoomTime<=this.APPROACH_DURATION){const p1=Math.min(1,this.zoomTime/this.APPROACH_DURATION),ease1=ease.cubicOut(p1);this.zoomScale=math.mix(1,3.8,ease1),zoomEased=ease1*.25,letterSpacing=math.mix(-.02,.01,ease1),blurPx=0,opacity=1,spreadX=0;if(this.domDigitsContainer){this.domDigitsContainer.style.transition="none",this.domDigitsContainer.style.transformOrigin="50% 50%",this.domDigitsContainer.style.transform="translate(-50%, -50%) scale("+this.zoomScale.toFixed(3)+")",this.domDigitsContainer.style.letterSpacing=letterSpacing.toFixed(3)+"em",this.domDigitsContainer.style.filter="brightness("+(1+ease1*.15).toFixed(2)+")",this.domDigitsContainer.style.opacity="1"}}else if(this.zoomTime<=this.APPROACH_DURATION+this.HOLD_DURATION){const pHold=Math.min(1,(this.zoomTime-this.APPROACH_DURATION)/this.HOLD_DURATION),breathe=Math.sin(pHold*Math.PI);this.zoomScale=3.8+breathe*.08,zoomEased=.25+pHold*.05,letterSpacing=.01,blurPx=0,opacity=1,spreadX=0;const glowBri=1.15+breathe*.25,glowDrop=breathe*18;if(this.domDigitsContainer){this.domDigitsContainer.style.transition="none",this.domDigitsContainer.style.transformOrigin="50% 50%",this.domDigitsContainer.style.transform="translate(-50%, -50%) scale("+this.zoomScale.toFixed(3)+")",this.domDigitsContainer.style.letterSpacing="0.01em",this.domDigitsContainer.style.filter="drop-shadow(0 0 "+glowDrop.toFixed(1)+"px rgba(255,255,255,0.5)) brightness("+glowBri.toFixed(2)+")",this.domDigitsContainer.style.opacity="1"}}else{const p3=Math.min(1,(this.zoomTime-(this.APPROACH_DURATION+this.HOLD_DURATION))/this.RUSH_DURATION),rushEase=ease.cubicIn(p3);this.zoomScale=math.mix(3.8,36,rushEase),zoomEased=.3+rushEase*.7,blurPx=math.mix(0,22,rushEase),letterSpacing=math.mix(.01,1.8,rushEase),spreadX=rushEase*140,opacity=p3<.6?1:math.fit(p3,.6,1,1,0);if(this.domDigitsContainer){this.domDigitsContainer.style.transition="none",this.domDigitsContainer.style.transformOrigin="50% 50%",this.domDigitsContainer.style.transform="translate(-50%, -50%) scale("+this.zoomScale.toFixed(3)+")",this.domDigitsContainer.style.letterSpacing=letterSpacing.toFixed(3)+"em",this.domDigitsContainer.style.filter="blur("+blurPx.toFixed(2)+"px) brightness("+(1.15+rushEase*1.2).toFixed(2)+")",this.domDigitsContainer.style.opacity=opacity.toFixed(3)}}if(this.domDigits&&this.domDigits.length>=3){this.domDigits[0].style.transform="translateX(-"+spreadX.toFixed(1)+"px)",this.domDigits[1].style.transform="translateX(0px)",this.domDigits[2].style.transform="translateX("+spreadX.toFixed(1)+"px)"}if(this.zoomTime>=totalDur&&!properties.hasStarted){if(typeof goalTunnels!=="undefined")goalTunnels.introStartTime=performance.now();properties.isIntroWarp=!0,this._startCallback(),this.domDigitsContainer&&(this.domDigitsContainer.style.opacity="0",this.domDigitsContainer.style.display="none",this.domDigitsContainer.classList.add("is-hidden")),this.domContainer&&(this.domContainer.style.display="none"),this.isActive=!1}}`;

  const updatedContent = content.slice(0, startIdx) + newCode + content.slice(endIdx);
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`Successfully updated ${filePath}`);
}

const target1 = path.join(__dirname, '_astro', 'hoisted.CUO_IjfL.js');
const target2 = path.join(__dirname, 'dist', '_astro', 'hoisted.CUO_IjfL.js');

updateFile(target1);
if (fs.existsSync(target2)) {
  updateFile(target2);
}
