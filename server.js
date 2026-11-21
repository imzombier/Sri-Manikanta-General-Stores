const express = require("express");
const path = require("path");
const crypto = require("crypto");
const app = express();
app.use(express.json({limit:"1mb"}));
const PORT = process.env.PORT || 10000;
const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/$/,"");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const sessions = new Set();

async function db(pathname, method="GET", body) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Database is not configured. Add Supabase environment variables in Render.");
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    method, headers: {
      "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type":"application/json", "Prefer":"return=representation"
    }, body: body === undefined ? undefined : JSON.stringify(body)
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(txt || `Database error ${r.status}`);
  return txt ? JSON.parse(txt) : [];
}
function admin(req,res,next){
  const token=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  if(!token || !sessions.has(token)) return res.status(401).json({error:"Admin login required"});
  next();
}
app.post("/api/admin/login",(req,res)=>{
  if(!ADMIN_PASSWORD) return res.status(503).json({error:"Set ADMIN_PASSWORD in Render environment variables first."});
  if((req.body.password||"")!==ADMIN_PASSWORD) return res.status(401).json({error:"Incorrect password"});
  const token=crypto.randomBytes(32).toString("hex"); sessions.add(token);
  res.json({token});
});
app.post("/api/admin/logout",admin,(req,res)=>{
  sessions.delete((req.headers.authorization||"").replace(/^Bearer\s+/i,"")); res.json({ok:true});
});
app.get("/api/products",async(req,res)=>{
  try { const rows=await db("products?select=*&active=eq.true&order=name.asc"); res.json(rows); }
  catch(e){res.status(503).json({error:e.message});}
});
app.get("/api/admin/products",admin,async(req,res)=>{
  try { res.json(await db("products?select=*&order=created_at.desc")); }
  catch(e){res.status(503).json({error:e.message});}
});
app.post("/api/admin/products",admin,async(req,res)=>{
  try {
    const {name,category,purchase_price,profit_type,profit_value,stock,low_stock}=req.body;
    if(!name || !["amount","percent"].includes(profit_type) || Number(purchase_price)<0 || Number(profit_value)<0) return res.status(400).json({error:"Check product details"});
    const sell=Number(purchase_price)+(profit_type==="percent"?Number(purchase_price)*Number(profit_value)/100:Number(profit_value));
    const rows=await db("products","POST",{name,category:category||"",purchase_price:Number(purchase_price),profit_type,profit_value:Number(profit_value),selling_price:sell,stock:Number(stock)||0,low_stock:Number(low_stock)||0,active:true});
    res.json(rows[0]);
  } catch(e){res.status(400).json({error:e.message});}
});
app.put("/api/admin/products/:id",admin,async(req,res)=>{
  try {
    const {name,category,purchase_price,profit_type,profit_value,stock,low_stock,active}=req.body;
    const sell=Number(purchase_price)+(profit_type==="percent"?Number(purchase_price)*Number(profit_value)/100:Number(profit_value));
    const rows=await db(`products?id=eq.${encodeURIComponent(req.params.id)}`,"PATCH",{name,category:category||"",purchase_price:Number(purchase_price),profit_type,profit_value:Number(profit_value),selling_price:sell,stock:Number(stock)||0,low_stock:Number(low_stock)||0,active:active!==false});
    res.json(rows[0]||{ok:true});
  } catch(e){res.status(400).json({error:e.message});}
});
app.delete("/api/admin/products/:id",admin,async(req,res)=>{
  try { await db(`products?id=eq.${encodeURIComponent(req.params.id)}`,"PATCH",{active:false});res.json({ok:true}); }
  catch(e){res.status(400).json({error:e.message});}
});
app.get("/api/admin/orders",admin,async(req,res)=>{
  try {res.json(await db("orders?select=*&order=created_at.desc"));}catch(e){res.status(503).json({error:e.message});}
});
app.patch("/api/admin/orders/:id",admin,async(req,res)=>{
  try {const rows=await db(`orders?id=eq.${encodeURIComponent(req.params.id)}`,"PATCH",{status:req.body.status});res.json(rows[0]||{ok:true});}
  catch(e){res.status(400).json({error:e.message});}
});
app.post("/api/orders",async(req,res)=>{
  try {
    const {customer_name,phone,items}=req.body;
    if(!customer_name || !phone || !Array.isArray(items) || !items.length) return res.status(400).json({error:"Enter name, phone and at least one item"});
    const ids=items.map(x=>x.product_id);
    const products=await db(`products?select=id,name,selling_price,stock&active=eq.true&id=in.(${ids.join(",")})`);
    let total=0,clean=[];
    for(const item of items){
      const p=products.find(x=>x.id===item.product_id), qty=Number(item.quantity);
      if(!p || qty<=0 || qty>Number(p.stock)) return res.status(400).json({error:`Stock unavailable for ${p?p.name:"a selected item"}`});
      const line=qty*Number(p.selling_price); total+=line;
      clean.push({product_id:p.id,name:p.name,quantity:qty,unit_price:p.selling_price,line_total:line});
    }
    const order=(await db("orders","POST",{customer_name,phone,items:clean,total,status:"New"}))[0];
    res.json({ok:true,order});
  } catch(e){res.status(400).json({error:e.message});}
});
app.use(express.static(path.join(__dirname,"public")));
app.get("/",(req,res)=>res.redirect("/shop"));
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.get("/shop",(req,res)=>res.sendFile(path.join(__dirname,"public","shop.html")));
app.listen(PORT,"0.0.0.0",()=>console.log(`Store app listening on ${PORT}`));
