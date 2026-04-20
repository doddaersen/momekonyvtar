const nodes={
 start:{
  question:"Mit keresel?",
  options:[
   {label:"Szakirodalmat",target:"lit"},
   {label:"Vizuális forrásokat",target:"visual"},
   {label:"MOME tartalmakat",target:"mome"}
  ]
 },
 lit:{
  question:"Milyen típusú szakirodalom?",
  options:[
   {label:"Könyvek",target:"books"},
   {label:"Folyóiratcikkek",target:"articles"}
  ]
 },
 books:{card:{title:"Könyvek keresése",text:"Használd a MOME könyvtár katalógusát."}},
 articles:{card:{title:"Online cikkadatbázisok",text:"Próbáld: EBSCO, JSTOR"}},
 visual:{card:{title:"Vizuális források",text:"Múzeumi digitális gyűjtemények és képarchívumok."}},
 mome:{card:{title:"MOME tartalmak",text:"Diplomamunkák, doktori művek és egyetemtörténeti anyagok."}}
};

let history=[];

function renderNode(id){
 const node=nodes[id];
 const q=document.getElementById("questionView");
 const c=document.getElementById("cardView");
 q.innerHTML="";
 c.innerHTML="";

 if(node.question){
  document.getElementById("screenTitle").innerText=node.question;
  node.options.forEach(o=>{
   const b=document.createElement("button");
   b.className="option-button";
   b.innerText=o.label;
   b.onclick=()=>{history.push(id);renderNode(o.target)};
   q.appendChild(b);
  });
  q.classList.remove("hidden");
  c.classList.add("hidden");
 }

 if(node.card){
  document.getElementById("screenTitle").innerText=node.card.title;
  const p=document.createElement("p");
  p.innerText=node.card.text;
  c.appendChild(p);
  c.classList.remove("hidden");
 }

 renderBreadcrumb(id);
}

function renderBreadcrumb(id){
 const bc=document.getElementById("breadcrumb");
 bc.innerHTML="";
 history.forEach(h=>{
  const s=document.createElement("span");
  s.innerText=nodes[h].question;
  bc.appendChild(s);
 });
}

document.getElementById("backButton").onclick=()=>{
 const prev=history.pop();
 if(prev)renderNode(prev);
};

document.getElementById("homeButton").onclick=()=>{
 history=[];
 renderNode("start");
};

renderNode("start");
