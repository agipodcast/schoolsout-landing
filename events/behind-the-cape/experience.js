'use strict';
const topics={
 electricity:['01 / ELECTRICITY','When new demand reaches the grid, who pays?','What would a fair agreement look like for residents, utilities, and the companies building the infrastructure?','What evidence would help us understand the local tradeoffs?'],
 water:['02 / WATER','What should a community know about water use before approval?','How could residents evaluate a proposed cooling approach, local water conditions, and the commitments made by a developer?','Which water questions need local answers?'],
 jobs:['03 / JOBS','Which opportunities would reach the people who already live here?','How should a community distinguish construction work, ongoing jobs, and the training that could connect residents to either?','What would a credible local workforce commitment include?'],
 business:['04 / LOCAL BUSINESS','Where could local businesses fit into the picture?','What would it take for local suppliers and small businesses to participate—and how would the community know whether those opportunities materialize?','How should promised economic benefits be evaluated?'],
 community:['05 / COMMUNITY VOICE','What would meaningful community input change?','When should residents have a voice, what information should be available, and how could public commitments be checked over time?','Whose perspective is still missing from the table?']
};
const panel=document.querySelector('#topic-panel');
document.querySelectorAll('[data-topic]').forEach(button=>button.addEventListener('click',()=>{
 const t=topics[button.dataset.topic];
 document.querySelectorAll('[data-topic]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 panel.querySelector('.topic-number').textContent=t[0];panel.querySelector('h3').textContent=t[1];panel.querySelector('p').textContent=t[2];panel.querySelector('.bring').textContent=t[3];
}));
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const motion=document.querySelector('#motion');
const video=document.querySelector('.scene video');
const scene=document.querySelector('.scene');
let paused=reduced.matches,visible=false;
async function syncVideo(){
 if(paused||reduced.matches||!visible){video.pause();return;}
 if(!video.src)video.src=video.dataset.src;
 try{await video.play();scene.classList.add('video-playing');}catch{scene.classList.remove('video-playing');}
}
function setPaused(value){paused=value;document.body.classList.toggle('paused',paused);motion.setAttribute('aria-pressed',String(paused));motion.textContent=paused?'Resume motion ▷':'Pause motion Ⅱ';syncVideo();}
setPaused(reduced.matches);
if(reduced.matches){motion.textContent='Reduced motion enabled';motion.disabled=true;}
motion.addEventListener('click',()=>setPaused(!paused));
reduced.addEventListener('change',e=>{motion.disabled=e.matches;setPaused(e.matches);if(e.matches){motion.textContent='Reduced motion enabled';scene.classList.remove('video-playing');}});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncVideo();},{threshold:.12}).observe(scene);
document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else syncVideo();});
