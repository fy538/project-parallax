// Deterministic native animation renderer. Painted PNGs are used unchanged.
// A projected mesh moves the page; the people remain a single held layer.
(() => {
  const stage=document.getElementById('stage');
  const canvas=document.createElement('canvas');
  canvas.id='motion-canvas';canvas.width=1920;canvas.height=1080;
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%';
  canvas.setAttribute('aria-hidden','true');stage.append(canvas);
  const ctx=canvas.getContext('2d');
  const W=1672,H=941;
  const styles=getComputedStyle(document.documentElement);
  const color=name=>styles.getPropertyValue('--'+name).trim();
  const sourceImages=['background','page-front','foreground'].map(id=>document.getElementById(id));
  function svgImage(parts){
    const source=document.getElementById('diagram');
    const svg=source.cloneNode(false);svg.removeAttribute('id');svg.removeAttribute('style');
    svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','1600');svg.setAttribute('height','900');svg.setAttribute('font-family','Arial,sans-serif');svg.setAttribute('text-anchor','middle');
    for(const part of parts)svg.append(part.cloneNode(true));
    for(const item of [svg,...svg.querySelectorAll('*')]){
      item.removeAttribute('style');
      for(const attr of [...item.attributes])if(attr.value.includes('var('))item.setAttribute(attr.name,attr.value.replace(/var\(--([\w-]+)\)/g,(_,name)=>color(name)));
    }
    const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));
    return image.decode().then(()=>image);
  }
  function triangle(image,src,dst){
    const [a,b,c]=src,[u,v,w]=dst;
    const den=a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]);
    if(Math.abs(den)<.001)return;
    const coef=(p,q,r)=>[(p*(b[1]-c[1])+q*(c[1]-a[1])+r*(a[1]-b[1]))/den,(p*(c[0]-b[0])+q*(a[0]-c[0])+r*(b[0]-a[0]))/den,(p*(b[0]*c[1]-c[0]*b[1])+q*(c[0]*a[1]-a[0]*c[1])+r*(a[0]*b[1]-b[0]*a[1]))/den];
    const x=coef(u[0],v[0],w[0]),y=coef(u[1],v[1],w[1]);
    ctx.save();ctx.beginPath();ctx.moveTo(...u);ctx.lineTo(...v);ctx.lineTo(...w);ctx.closePath();ctx.clip();
    ctx.transform(x[0],y[0],x[1],y[1],x[2],y[2]);ctx.drawImage(image,0,0,W,H);ctx.restore();
  }
  function pageAt(p){
    const angle=-155*p*Math.PI/180;
    const project=(x,y)=>{
      const ox=.6175*W,px=.62*W,py=.42*H,d=5000*W/1920;
      const dx=x-ox,z=-Math.sin(angle)*dx,k=d/(d-z);
      return [px+(ox+Math.cos(angle)*dx-px)*k,py+(y-.04*H*p-py)*k];
    };
    if(p===0){
      ctx.drawImage(sourceImages[1],0,0,W,H);
    }else if(angle>-Math.PI/2){
      // Subdivision makes the image follow the perspective of the moving sheet.
      for(let column=0;column<16;column++)for(let row=0;row<8;row++){
        const x=601+432*column/16,x2=601+432*(column+1)/16,y=777*row/8,y2=777*(row+1)/8;
        const a=[x,y],b=[x2,y],c=[x2,y2],d=[x,y2];
        triangle(sourceImages[1],[a,b,c],[project(...a),project(...b),project(...c)]);
        triangle(sourceImages[1],[a,c,d],[project(...a),project(...c),project(...d)]);
      }
    }else{
      const points=[[601,0],[1033,0],[1033,657],[638,777],[601,770]].map(pair=>project(...pair));
      ctx.fillStyle=color('bone');ctx.beginPath();points.forEach((point,index)=>index?ctx.lineTo(...point):ctx.moveTo(...point));ctx.closePath();ctx.fill();
      ctx.fillStyle=color('sand');ctx.globalAlpha=.35;ctx.beginPath();[[601,0],[1033,0],[1033,657],[830,718]].map(pair=>project(...pair)).forEach((point,index)=>index?ctx.lineTo(...point):ctx.moveTo(...point));ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    }
    ctx.strokeStyle=color('walnut');ctx.lineWidth=2;ctx.beginPath();[[601,0],[601,770],[638,777],[1033,657],[1033,0]].map(pair=>project(...pair)).forEach((point,index)=>index?ctx.lineTo(...point):ctx.moveTo(...point));ctx.stroke();
  }
  let diagrams;
  const original=window.renderAtSeconds;
  window.motionReady=Promise.all([
    ...sourceImages.map(image=>image.decode()),
    svgImage([...document.getElementById('diagram').children].filter(item=>item.tagName!=='g')),
    ...['diagram-title','hub','node-one','node-two','node-three','diagram-footer'].map(id=>svgImage([document.getElementById(id)]))
  ]).then(result=>{
    diagrams=result.slice(3);
    ['scene','diagram','dip'].forEach(id=>document.getElementById(id).style.display='none');
    window.renderAtSeconds=function(t){
      original(t);
      const p=ease(progress(t,2,6)),scale=1.42-.42*p;
      ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.fillStyle=color('ink');ctx.fillRect(0,0,1920,1080);
      if(t<8.25){
        ctx.save();ctx.scale(1920/W,1080/H);ctx.translate(.72*W,.68*H);ctx.scale(scale,scale);ctx.translate(-.72*W,-.68*H);
        ctx.drawImage(sourceImages[0],0,0,W,H);pageAt(p);ctx.drawImage(sourceImages[2],0,0,W,H);ctx.restore();
        ctx.globalAlpha=progress(t,8,8.25);ctx.fillStyle=color('ink');ctx.fillRect(0,0,1920,1080);ctx.globalAlpha=1;
      }
      if(t>=8.25){
        ctx.save();ctx.globalAlpha=progress(t,8.25,8.5);ctx.drawImage(diagrams[0],0,0,1920,1080);
        const starts=[8.35,8.35,8.8,9.55,10.3,11.1];
        for(let i=0;i<starts.length;i++){ctx.globalAlpha=progress(t,8.25,8.5)*progress(t,starts[i],starts[i]+.5);ctx.drawImage(diagrams[i+1],0,0,1920,1080)}
        ctx.restore();
      }
      return canvas;
    };
    window.renderAtSeconds(0);
  });
})();
