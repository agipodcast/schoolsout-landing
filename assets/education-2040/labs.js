'use strict';
// Authored scenarios, not predictions. No network requests or persistent storage.
(() => {
const $ = id => document.getElementById(id);
const state = {method:'manual', lenses:new Set(['foundation']), move:'target'};
const lensCopy = {
 foundation:'Foundational: spatial reasoning helps students make sense of later mathematics and design.',
 enduring:'Enduring: explaining why a design works for its users can matter across tools, settings and years.',
 time:'Time-bound: proficiency with a protractor or compass may depend on the task and context. Examine its role before replacing it. Manual construction can also develop foundational understanding.'
};
const geometry = {
 reason:{
  manual:['Reasoning is possible. Make it visible.','Drawing and measuring can connect an angle to a physical action. Ask students to predict what happens when the ridge rises, then use the model or their measurements to explain the change. A neat drawing alone leaves the reasoning unseen.'],
  ai:['The model is quick. The explanation still needs work.','An AI-assisted design can make variations easy to inspect. Before generating another version, have students predict which angles change and why. If the tool chooses and explains everything, the intended spatial reasoning can disappear.'],
  compare:['Use the disagreement.','Have students sketch a prediction, compare it with an AI-assisted model, and explain any mismatch. Comparing methods takes time; use that time to surface reasoning rather than requiring two polished products.']
 },
 instrument:{
  manual:['The instrument is part of the goal.','Keep hands-on measurement. Ask students to align the protractor, choose the correct scale, and explain a reading. Offer accessible instruments or an equivalent supported method where needed.'],
  ai:['This method leaves the named capability unobserved.','An AI model can report an angle without the student using a protractor. Keep a separate measurement attempt if instrument proficiency remains the goal, or explicitly revise the goal before changing the assignment.'],
  compare:['Measure first, then investigate the mismatch.','Students can compare their protractor reading with the model. Watch alignment and scale choice during the measurement; agreement with a generated answer alone does not demonstrate instrument use.']
 },
 design:{
  manual:['Put a person inside the design brief.','Who needs this shelter, and what do they need from it? A hand-built model can support discussion of space and materials. Ask students to defend a design choice using the agreed success criteria.'],
  ai:['More options need a reason to choose.','Use an approved AI design tool to explore alternatives after students identify users and constraints. Students explain which option fits, what they reject, and how they would test it. A striking render is only one part of the work.'],
  compare:['Compare against the same success criteria.','Try a sketch and an AI-assisted alternative against the same user need. Ask what each makes easier to see, what remains uncertain, and which revision the student would make next.']
 }
};
function result(id, title, body) {
 const host=$(id); host.replaceChildren();
 const strong=document.createElement('strong'); strong.textContent=title;
 const p=document.createElement('p'); p.textContent=body; host.append(strong,p);
}
function selectedText(id){const el=$(id);return el.options[el.selectedIndex].text;}
function updateGeometry(){
 const h=Number($('roof-height').value), y=190-h*35;
 const angle=Math.round(Math.atan(h/3)*180/Math.PI);
 // Diagram uses one scale (35 px per unit) horizontally and vertically.
 $('roof-shape').setAttribute('d',`M115 190 L220 ${y} L325 190 Z`);
 $('ridge-line').setAttribute('d',`M220 190 L220 ${y}`);
 $('ridge-dot').setAttribute('cy',y);
 $('angle-svg').setAttribute('x','122');
 $('angle-svg').textContent=`${angle}°`;
 $('height-label').textContent=h;
 $('angle-label').textContent=`${angle}° each`;
 $('roof-desc').textContent=`Span 6 units, ridge height ${h} units, equal base angles about ${angle} degrees. A higher ridge increases both base angles.`;
 result('geometry-result',...geometry[$('geometry-goal').value][state.method]);
 updatePlan();
}
function updateLenses(){
 const host=$('lens-result');host.replaceChildren();
 const copy=[...state.lenses].map(key=>lensCopy[key]);
 (copy.length?copy:['Select a lens to examine the capability. More than one can apply.']).forEach(text=>{const p=document.createElement('p');p.textContent=text;host.append(p);});
 updatePlan();
}
const evidence = {
 artifact:['Useful starting material, limited evidence of understanding.','Read for the claim and details you want to explore. The submitted explanation and prompt history may also be AI-generated. Choose a follow-up that asks the student to connect specific passages in a new response.'],
 connect:['Listen for a connection, not two separate summaries.','Ask: how does the confession affect your reading of the opening claim about sanity? Which detail from each passage supports that connection? Allow the student to consult the text and use an accessible response format.'],
 challenge:['Add the narrator\'s careful planning in the middle.','The narrator describes acting cautiously and methodically. Ask the student to locate a specific example. Does that detail complicate the interpretation of the opening and ending? What would they revise or defend? Record the support needed, then revisit the capability on another occasion.']
};
function updateEvidence(){result('evidence-result',...evidence[$('evidence-moment').value]);updatePlan();}
function rubricValues(){return [...document.querySelectorAll('#rubric select')].map(el=>[el.dataset.dimension,el.value]);}
function updateRubric(){
 const vals=rubricValues();
 const open=vals.filter(([,value])=>value==='Not yet demonstrated').map(([name])=>name.toLowerCase());
 const prompted=vals.filter(([,value])=>value==='With prompting').map(([name])=>name.toLowerCase());
 let body=open.length?`Plan another opportunity to observe ${open.join(', ')}. “Not yet” describes the evidence available, not a fixed judgment about the student.`:'You have selected evidence for every dimension. Check that it comes from more than one moment and task.';
 if(prompted.length)body+=` For ${prompted.join(', ')}, record the prompt and see whether a later attempt needs less support.`;
 if(vals.every(([,v])=>v==='Independently'))body+=' Try a fresh text or constraint before treating the capability as transferable. These selections do not prove authorship.';
 result('rubric-result','Your next observation',body);updatePlan();
}
const checks = {
 fit:'Establish that the actual service fits the learning need and district requirements.',
 terms:'Review the contract, settings and student protections for this use.',
 owner:'Name the person who can manage access, respond and stop use.',
 exit:'Open a sample export elsewhere and try the fallback.'
};
function checkedGovernance(){return new Set([...document.querySelectorAll('#governance-checks input:checked')].map(el=>el.value));}
function governanceCopy(){
 const checked=checkedGovernance(),missing=Object.keys(checks).filter(key=>!checked.has(key));
 const shock=$('governance-shock').value;
 let title=missing.length?'A familiar name leaves questions open.':'A reviewable pilot, with a responsible owner.';
 let body=missing.length?missing.map(key=>checks[key]).join(' '):'The fictional review now covers fit, student protections, ownership and a tried exit. The district can consider a bounded pilot with its own approval process, review date and stop conditions. This checklist does not certify a product.';
 if(shock==='change'){title='The change needs a fresh review.';body='Recheck the changed terms or feature before extending the pilot. '+(checked.has('owner')?'The named owner can pause affected use and coordinate the review. ':'Without a named owner, even deciding who pauses use is unresolved. ')+body;}
 if(shock==='leave'){title=checked.has('exit')?'You have an exit to rehearse.':'An export button is not an exit plan.';body=(checked.has('exit')?'Use the tested export and alternative, check what transfers, and confirm deletion or retention obligations with the district. Rehearse the timetable before promising a smooth move. ':'Find out what can be exported in a usable format and where students can continue. A downloaded file that nobody can open is not a practical fallback. ')+body;}
 return [title,body];
}
function updateGovernance(){const [title,body]=governanceCopy();$('governance-status').textContent=title;result('governance-result','For this situation',body);updatePlan();}
const coaching = {
 language:{
  direct:['The model helps; the students still need a turn.','Showing a full exchange can establish a model. If you finish the ordering for them, you still need a fresh student attempt to hear whether they can make the request themselves.'],
  wait:['More rehearsal may repeat the same gap.','Exploration can reveal strategies, but students who lack a request form may keep circling the menu. Listen for whether the group is making progress or needs a short language model.'],
  target:['A small lesson, then another attempt.','Model “Quisiera un jugo, por favor” (I would like a juice, please). Explain how the request works, let partners substitute a menu item, then resume the café exchange. Listen for each student using the form in a new order.']
 },
 tool:{
  direct:['A quick demonstration can remove a barrier.','Show only the step needed to resume the language task. A tour of every menu feature can consume the rehearsal. Keep a paper menu available so an interface problem does not decide who gets to practice.'],
  wait:['Give exploration a boundary.','A short attempt may build confidence with the tool. If the interface keeps blocking the language goal, move to the fallback and return to ordering. Software troubleshooting is not the intended capability today.'],
  target:['Keep the language task moving.','Identify the one interface step blocking the group. Demonstrate it briefly or switch to a paper menu, then hand the task back. Check the language in any AI-generated menu before students rehearse it.']
 },
 agency:{
  direct:['Another expert voice may crowd out practice.','Your demonstration can clarify expectations, but it does not create turns for quieter students. Follow it with roles that require every learner to order and respond.'],
  wait:['Activity can hide uneven participation.','The café may sound fluent while one student does the work. Listen for whose language you are hearing before assuming the group is ready to move on.'],
  target:['Change who has the next turn.','Give partners rotating customer and server roles. Use a brief model only where needed, then ask each learner to place a fresh order. Observe individual participation without making the confident student responsible for teaching everyone.']
 }
};
function updateCoach(){const [title,body]=coaching[$('coach-situation').value][state.move];$('coach-heading').textContent=title;result('coach-result','What to watch',body);$('coach-return-result').textContent=$('coach-return').checked?'Now listen to each fresh attempt. Use what you hear to decide whether another brief intervention is needed.':'What will you observe when students try again?';updatePlan();}
function planBlocks(){
 const fields=[['Intended capability','plan-capability'],['Evidence and a new challenge','plan-evidence'],['Review boundary and fallback','plan-boundary'],['Coaching and the next attempt','plan-coach']].map(([name,id])=>[name,$(id).value.trim()||'Add your lesson note.']);
 const method=document.querySelector(`#geometry-method [data-value="${state.method}"]`).textContent;
 const selected=[...state.lenses].map(k=>({foundation:'Foundational',enduring:'Enduring',time:'Time-bound'})[k]).join(', ')||'No lens selected';
 fields.push(['Lab choices to reconsider',`Geometry: ${selectedText('geometry-goal')}. Method: ${method}. Lenses: ${selected}.\nModel: ${$('height-label').textContent}-unit height, 6-unit span, base angles ${$('angle-label').textContent}.\nELA: ${selectedText('evidence-moment')}.\nGovernance: ${governanceCopy()[0]}\nSpanish: ${selectedText('coach-situation')}. ${document.querySelector(`#coach-moves [data-value="${state.move}"]`).textContent}. Fresh attempt planned: ${$('coach-return').checked?'yes':'not yet'}.`]);
 fields.push(['Rubric rehearsal (not a student assessment)',rubricValues().map(([name,value])=>`${name}: ${value}`).join('\n')]);
 return fields;
}
function updatePlan(){
 $('plan-title').textContent=$('plan-topic').value.trim()||'One lesson. Four decisions.';
 const host=$('plan-preview');host.replaceChildren();
 planBlocks().forEach(([title,body])=>{const block=document.createElement('div');block.className='plan-block';const strong=document.createElement('strong');strong.textContent=title;const p=document.createElement('p');p.textContent=body;block.append(strong,p);host.append(block);});
}
function bindGroup(id,key,update){document.querySelectorAll(`#${id} button`).forEach(button=>button.addEventListener('click',()=>{state[key]=button.dataset.value;document.querySelectorAll(`#${id} button`).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update();}));}
bindGroup('geometry-method','method',updateGeometry);bindGroup('coach-moves','move',updateCoach);
document.querySelectorAll('#lenses button').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.value;state.lenses.has(key)?state.lenses.delete(key):state.lenses.add(key);button.setAttribute('aria-pressed',String(state.lenses.has(key)));updateLenses();}));
$('geometry-goal').addEventListener('change',updateGeometry);$('roof-height').addEventListener('input',updateGeometry);$('evidence-moment').addEventListener('change',updateEvidence);
document.querySelectorAll('#rubric select').forEach(el=>el.addEventListener('change',updateRubric));
document.querySelectorAll('#governance-checks input').forEach(el=>el.addEventListener('change',updateGovernance));$('governance-shock').addEventListener('change',updateGovernance);$('coach-situation').addEventListener('change',updateCoach);$('coach-return').addEventListener('change',updateCoach);
document.querySelectorAll('.lesson-form input,.lesson-form textarea').forEach(el=>el.addEventListener('input',updatePlan));
$('download-plan').addEventListener('click',()=>{
 const text=`School's Out Field Notes / Education 2040\n${$('plan-title').textContent}\n\n${planBlocks().map(([title,body])=>`${title}\n${body}`).join('\n\n')}\n\nAuthored planning examples, not an assessment of students.\nhttps://schoolsout.agipodcast.ai/field-notes-issue-9\n`;
 const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='education-2040-lesson-plan.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('plan-status').textContent='Your plan download has been requested. Check your browser downloads to keep the text file.';
});
$('print-plan').addEventListener('click',()=>window.print());
updateGeometry();updateLenses();updateEvidence();updateRubric();updateGovernance();updateCoach();
})();
