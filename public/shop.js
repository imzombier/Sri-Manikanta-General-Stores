let products=[],cart=[],chosen=null,activeCategory="All",lastReceipt=null,currentSlide=0,slideTimer=null;
const $=id=>document.getElementById(id),money=n=>"₹"+Number(n).toFixed(2);
const fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260'%3E%3Crect width='100%25' height='100%25' fill='%23fff3e6'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' font-size='70'%3E%F0%9F%9B%92%3C/text%3E%3C/svg%3E";
function safe(url){try{let u=new URL(url);return /^https?:$/.test(u.protocol)?u.href:""}catch{return ""}}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showSlide(index){
  const slides=[...document.querySelectorAll(".slide")],dots=[...document.querySelectorAll(".dot")];
  if(!slides.length)return;
  currentSlide=(index+slides.length)%slides.length;
  slides.forEach((el,i)=>el.classList.toggle("active",i===currentSlide));
  dots.forEach((el,i)=>el.classList.toggle("active",i===currentSlide));
}
function startSlider(){
  const dots=[...document.querySelectorAll(".dot")];
  if(!dots.length)return;
  $("slidePrev").onclick=()=>showSlide(currentSlide-1);
  $("slideNext").onclick=()=>showSlide(currentSlide+1);
  dots.forEach((dot,i)=>dot.onclick=()=>showSlide(i));
  slideTimer=setInterval(()=>showSlide(currentSlide+1),4500);
  const slider=document.querySelector(".hero-slider");
  slider.addEventListener("mouseenter",()=>clearInterval(slideTimer));
  slider.addEventListener("mouseleave",()=>{clearInterval(slideTimer);slideTimer=setInterval(()=>showSlide(currentSlide+1),4500)});
}
function receiptHtml(receipt){
  const escHtml=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const rows=receipt.items.map(x=>`<tr><td>${escHtml(x.name)}</td><td>${escHtml(x.quantityLabel)}</td><td>${money(x.rate)}</td><td>${money(x.amount)}</td></tr>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Order Receipt ${escHtml(receipt.id)}</title><style>body{font-family:Arial,'Noto Sans Telugu',sans-serif;color:#222;margin:0;padding:24px;background:#fff}main{max-width:700px;margin:auto;border:1px solid #eadfd4;border-radius:14px;padding:24px}.brand{color:#d96d0b;font-size:24px;font-weight:800}.muted{color:#777;font-size:13px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:22px 0}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{padding:11px 7px;border-bottom:1px solid #eee;text-align:left;font-size:13px}th{background:#fff2e5;color:#8e4a0b}.right{text-align:right}.total{font-size:22px;font-weight:bold;color:#d96d0b;text-align:right;margin-top:20px}.thanks{margin-top:26px;padding:14px;background:#fff7ef;border-radius:10px;text-align:center}@media print{body{padding:0}main{border:0}}</style></head><body><main><div class="brand">🛒 Sri Manikanta General Stores</div><div class="muted">శ్రీ మణికంఠ జనరల్ స్టోర్స్ · Order receipt</div><div class="meta"><div><b>Order ID:</b> ${escHtml(receipt.id)}</div><div><b>Date:</b> ${escHtml(receipt.date)}</div><div><b>Customer:</b> ${escHtml(receipt.customer)}</div><div><b>Mobile:</b> ${escHtml(receipt.phone)}</div><div style="grid-column:1/-1"><b>Address / Note:</b> ${escHtml(receipt.address||"—")}</div></div><table><thead><tr><th>Item</th><th>Quantity</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Total: ${money(receipt.total)}</div><div class="thanks">Thank you for shopping with us!<br>ధన్యవాదాలు — మళ్లీ రండి</div></main></body></html>`;
}
function downloadReceipt(){
  if(!lastReceipt)return;
  const blob=new Blob([receiptHtml(lastReceipt)],{type:"text/html;charset=utf-8"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=`Sri-Manikanta-Receipt-${String(lastReceipt.id).replace(/[^a-z0-9_-]/gi,"-")}.html`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function printReceipt(){
  if(!lastReceipt)return;
  const w=window.open("","_blank");
  if(!w){alert("Allow pop-ups to print or save the receipt as PDF.");return;}
  w.document.open();w.document.write(receiptHtml(lastReceipt));w.document.close();
  w.onload=()=>{w.focus();w.print();};
}
async function load(){
  $("catalog").textContent="Loading products…";
  try{
    let r=await fetch("/api/products"),d=await r.json();
    if(!r.ok)throw Error(d.error||"Could not load products");
    products=d;$("itemCount").textContent=products.length+" products";
    drawCategories();draw();
  }catch(e){$("catalog").innerHTML="<div class='empty'>"+esc(e.message)+"</div>";}
}
function drawCategories(){
  let cats=["All",...new Set(products.map(p=>(p.category||"Other").trim()).filter(Boolean))];
  $("categories").innerHTML=cats.map(c=>`<button class="category ${activeCategory===c?"active":""}" onclick="chooseCategory('${esc(c).replace(/'/g,"&#39;")}')">${esc(c)}</button>`).join("");
}
window.chooseCategory=c=>{activeCategory=c;drawCategories();draw()};
function draw(){
  let q=$("search").value.toLowerCase();
  let a=products.filter(p=>(p.name+" "+p.category).toLowerCase().includes(q)&&(activeCategory==="All"||(p.category||"Other").trim()===activeCategory));
  $("catalog").innerHTML=a.length?a.map(p=>`
    <article class="product">
      <img src="${safe(p.image_url)||fallback}" onerror="this.onerror=null;this.src='${fallback}'" alt="${esc(p.name)}">
      <div class="pinfo">
        <div class="pname">${esc(p.name)}</div><small>${esc(p.category||"Grocery")}</small>
        <div class="price">${money(p.selling_price)} <small>/ ${esc(p.unit_label)}</small></div>
        <div class="stocknote">${Number(p.stock)>0?"Available":"Out of stock"}</div>
        <button class="selectBtn" ${Number(p.stock)<=0?"disabled":""} onclick="openP('${p.id}')">Choose quantity</button>
      </div>
    </article>`).join(""):"<div class='empty'>No products found in this category.</div>";
}
window.openP=id=>{
  chosen=products.find(p=>p.id===id);
  $("mimg").src=safe(chosen.image_url)||fallback;
  $("mimg").onerror=()=>{$("mimg").src=fallback};
  $("mname").textContent=chosen.name;$("mcat").textContent=chosen.category||"Grocery";
  $("mprice").textContent=money(chosen.selling_price)+" / "+chosen.unit_label;
  let unit=["piece","pack"].includes(chosen.unit_label)?"units":chosen.unit_label==="litre"?"rupees":"grams";
  $("mode").value=unit;
  $("qty").value=unit==="grams"?500:unit==="rupees"?50:1;
  modalCalc();$("modal").classList.remove("hidden");
};
function quantityInBase(){
  let v=Number($("qty").value)||0,m=$("mode").value;
  if(m==="grams")return v/1000;
  if(m==="rupees")return v/Number(chosen.selling_price);
  return v;
}
function modalCalc(){
  if(!chosen)return;
  let mode=$("mode").value,v=Number($("qty").value)||0;
  $("qtyLabel").firstChild.textContent=mode==="grams"?"Quantity in grams":mode==="kg"?"Quantity in kg":mode==="rupees"?"Amount in rupees":"Number of pieces / packs";
  let q=quantityInBase(),amount=mode==="rupees"?v:q*Number(chosen.selling_price);
  if(mode==="rupees"&&chosen.unit_label==="kg"){
    $("conversion").textContent="You will get approximately "+(q*1000).toFixed(0)+" grams for "+money(v);
  }else if(mode==="grams"&&chosen.unit_label==="kg"){
    $("conversion").textContent=v+" grams will cost "+money(amount);
  }else if(mode==="rupees"&&chosen.unit_label==="litre"){
    $("conversion").textContent="You will get approximately "+q.toFixed(3)+" litres for "+money(v);
  }else if(mode==="grams"){
    $("conversion").textContent=v+" grams · "+money(amount);
  }else if(mode==="rupees"){
    $("conversion").textContent="Estimated quantity: "+q.toFixed(3)+" "+chosen.unit_label+" · "+money(v);
  }else{
    $("conversion").textContent=v+" "+chosen.unit_label+" · "+money(amount);
  }
}
$("mode").onchange=()=>{$("qty").value=$("mode").value==="grams"?500:$("mode").value==="rupees"?50:1;modalCalc()};
$("qty").oninput=modalCalc;
function close(){ $("modal").classList.add("hidden");chosen=null }
$("close").onclick=close;$("backdrop").onclick=close;
$("add").onclick=()=>{
  if(!chosen)return;
  let mode=$("mode").value,v=Number($("qty").value)||0,q=quantityInBase();
  if(v<=0||q<=0)return alert("Enter a valid quantity");
  if(q>Number(chosen.stock))return alert("Available stock: "+chosen.stock+" "+chosen.unit_label);
  let amount=mode==="rupees"?v:q*Number(chosen.selling_price),x=cart.find(x=>x.id===chosen.id);
  if(x){x.qty+=q;x.amount+=amount;x.displayQty+=v;x.mode=mode}
  else cart.push({id:chosen.id,name:chosen.name,unit:chosen.unit_label,qty:q,amount,mode,displayQty:v,rate:Number(chosen.selling_price)});
  close();drawCart();$("cartSection").scrollIntoView({behavior:"smooth"});
};
function drawCart(){
  let sum=cart.reduce((a,x)=>a+x.amount,0);
  $("count").textContent=cart.length;$("total").textContent=money(sum);
  $("cart").innerHTML=cart.length?cart.map((x,i)=>`
    <div class="cartrow">
      <div class="cartdetail"><b>${esc(x.name)}</b><small>${x.qty<1?(x.qty*1000).toFixed(0)+" g":x.qty.toFixed(3)+" "+esc(x.unit)} · ${money(x.rate)}/${esc(x.unit)}</small></div>
      <div class="cartcontrols"><button class="qtybtn" onclick="adjust(${i},-1)" aria-label="Decrease">−</button><b>${money(x.amount)}</b><button class="qtybtn" onclick="adjust(${i},1)" aria-label="Increase">＋</button><button class="remove" onclick="removeItem(${i})">Remove</button></div>
    </div>`).join(""):"<div class='empty'>Your cart is empty. Continue shopping to add items.</div>";
  $("order").disabled=!cart.length;
}
window.adjust=(i,d)=>{
  let x=cart[i],p=products.find(p=>p.id===x.id);if(!x||!p)return;
  let step=x.unit==="piece"||x.unit==="pack"?1:0.25,newQ=x.qty+d*step;
  if(newQ<=0){cart.splice(i,1)}else if(newQ>Number(p.stock)){alert("Available stock: "+p.stock+" "+p.unit_label);return}else{x.qty=newQ;x.amount=newQ*x.rate}
  drawCart();
};
window.removeItem=i=>{cart.splice(i,1);drawCart()};
$("search").oninput=draw;
$("cartJump").onclick=()=>$("cartSection").scrollIntoView({behavior:"smooth"});
$("continue").onclick=()=>scrollTo({top:0,behavior:"smooth"});
$("order").onclick=async()=>{
  if(!cart.length)return;
  let customer_name=$("customer").value.trim(),phone=$("phone").value.trim();
  if(!customer_name||!phone)return $("msg").textContent="Enter your name and mobile number.";
  let items=cart.map(x=>({product_id:x.id,quantity:x.qty}));
  $("order").disabled=true;$("msg").textContent="Placing your order…";
  try{
    let r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customer_name,phone,address:$("address").value,items})}),d=await r.json();
    if(!r.ok)throw Error(d.error||"Order could not be placed");
    const order=d.order||{};
    const orderId=order.id||order.order_id||("SMG-"+Date.now());
    const total=Number(order.total??cart.reduce((sum,x)=>sum+x.amount,0));
    lastReceipt={id:orderId,date:new Date().toLocaleString("en-IN"),customer:customer_name,phone,address:$("address").value, total,items:cart.map(x=>({name:x.name,quantityLabel:x.qty<1?(x.qty*1000).toFixed(0)+" g":x.qty.toFixed(3)+" "+x.unit,rate:x.rate,amount:x.amount}))};
    $("msg").textContent="Order placed successfully! Order ID: "+orderId+" · Total "+money(total);
    $("receiptActions").classList.remove("hidden");
    cart=[];drawCart();$("customer").value=$("phone").value=$("address").value="";await load();
  }catch(e){$("msg").textContent=e.message;$("order").disabled=false}
};
$("downloadReceipt").onclick=downloadReceipt;
$("printReceipt").onclick=printReceipt;
startSlider();
if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js?v=4.0").catch(()=>{});
load();drawCart();