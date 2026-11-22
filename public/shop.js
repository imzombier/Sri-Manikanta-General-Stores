let products=[],cart=[],chosen=null,activeCategory="All";
const $=id=>document.getElementById(id),money=n=>"₹"+Number(n).toFixed(2);
const fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='260'%3E%3Crect width='100%25' height='100%25' fill='%23fff3e6'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' font-size='70'%3E%F0%9F%9B%92%3C/text%3E%3C/svg%3E";
function safe(url){try{let u=new URL(url);return /^https?:$/.test(u.protocol)?u.href:""}catch{return ""}}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
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
    $("msg").textContent="Order placed successfully! Order ID: "+d.order.id+" · Total "+money(d.order.total);
    cart=[];drawCart();$("customer").value=$("phone").value=$("address").value="";await load();
  }catch(e){$("msg").textContent=e.message;$("order").disabled=false}
};
if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});
load();drawCart();