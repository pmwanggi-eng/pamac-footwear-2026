let editingId = null;
let products = [];
let requests = [];

function message(text) {
  const el=document.getElementById("message");
  if(el) el.textContent=text;
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}

async function loginAdmin() {
  const email=document.getElementById("email").value.trim();
  const password=document.getElementById("password").value;
  message("Signing in...");
  const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error){message("Login failed: "+error.message);return;}
  await verifyAdmin(data.user);
}
async function verifyAdmin(user) {
  const {data,error}=await supabaseClient.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
  if(error||!data){await supabaseClient.auth.signOut();message("This account is not an authorized administrator.");return;}
  document.getElementById("login").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  message("Welcome to PAMAC Administration!");
  await loadProducts();
  await loadRequests();
}
async function logoutAdmin(){await supabaseClient.auth.signOut();location.reload();}
document.addEventListener("DOMContentLoaded",async()=>{
  const {data}=await supabaseClient.auth.getSession();
  if(data.session?.user) await verifyAdmin(data.session.user);
});

async function loadProducts(){
  const {data,error}=await supabaseClient.from("products").select("*").order("created_at",{ascending:false});
  if(error){message("Could not load products: "+error.message);return;}
  products=data||[];
  document.getElementById("totalProducts").textContent=products.length;
  document.getElementById("totalStock").textContent=products.reduce((sum,p)=>sum+Number(p.qty||0),0);
  const list=document.getElementById("productList");
  if(!products.length){list.textContent="No products added yet.";return;}
  list.innerHTML=products.map(p=>`
    <div class="product-row">
      ${p.image_url?`<img src="${escapeHTML(p.image_url)}" alt="" style="width:110px;height:100px;object-fit:cover;border-radius:8px">`:""}
      <h3>${escapeHTML(p.name)}</h3><p>Price: KSh ${Number(p.price).toLocaleString("en-KE")}</p>
      <p>Category: ${escapeHTML(p.category||"")}</p><p>Sizes: ${escapeHTML(Array.isArray(p.sizes)?p.sizes.join(", "):p.sizes||"")}</p>
      <p>Quantity: ${Number(p.qty||0)}</p>
      <button class="admin-btn" onclick="editProduct('${escapeHTML(p.id)}')">Edit</button>
      <button class="admin-btn danger" onclick="deleteProduct('${escapeHTML(p.id)}')">Delete</button>
    </div>`).join("");
}
async function saveProduct(){
  const name=document.getElementById("productName").value.trim();
  const price=Number(document.getElementById("productPrice").value);
  const category=document.getElementById("productCategory").value;
  const sizes=document.getElementById("productSizes").value.split(",").map(x=>x.trim()).filter(Boolean);
  const qty=Number(document.getElementById("productQty").value);
  const file=document.getElementById("productPhoto").files[0];
  let image_url=document.getElementById("productImage").value.trim();
  if(!name||!Number.isFinite(price)||price<=0||!Number.isInteger(qty)||qty<0||!sizes.length){message("Enter a name, valid price, whole-number quantity and sizes.");return;}
  message("Saving product...");
  if(file){
    if(!file.type.startsWith("image/")||file.size>5*1024*1024){message("Choose an image smaller than 5 MB.");return;}
    const ext=(file.name.split(".").pop()||"jpg").replace(/[^a-zA-Z0-9]/g,"").slice(0,8)||"jpg";
    const path=Date.now()+"_"+Math.random().toString(36).slice(2)+"."+ext;
    const up=await supabaseClient.storage.from("shoe-photos").upload(path,file,{contentType:file.type,upsert:false});
    if(up.error){message("Photo upload failed: "+up.error.message);return;}
    image_url=supabaseClient.storage.from("shoe-photos").getPublicUrl(path).data.publicUrl;
  }
  const product={name,price,category,sizes,qty,image_url};
  const result=editingId?await supabaseClient.from("products").update(product).eq("id",editingId):await supabaseClient.from("products").insert(product);
  if(result.error){message("Save failed: "+result.error.message);return;}
  message("Product saved successfully.");resetForm();await loadProducts();
}
function editProduct(id){
  const p=products.find(x=>String(x.id)===String(id));if(!p)return;editingId=p.id;
  document.getElementById("productName").value=p.name||"";
  document.getElementById("productPrice").value=p.price||"";
  document.getElementById("productCategory").value=p.category||"Ladies";
  document.getElementById("productSizes").value=Array.isArray(p.sizes)?p.sizes.join(","):p.sizes||"";
  document.getElementById("productQty").value=p.qty??0;
  document.getElementById("productImage").value=p.image_url||"";
  document.getElementById("formTitle").textContent="Edit Shoe";
  document.getElementById("cancelEdit").classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}
async function deleteProduct(id){
  if(!confirm("Are you sure you want to delete this shoe?"))return;
  const {error}=await supabaseClient.from("products").delete().eq("id",id);
  if(error){message("Delete failed: "+error.message);return;}
  message("Product deleted.");await loadProducts();
}
function resetForm(){
  editingId=null;
  ["productName","productPrice","productSizes","productQty","productImage","productPhoto"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
  document.getElementById("formTitle").textContent="Add Newly Arrived Shoes";
  document.getElementById("cancelEdit").classList.add("hidden");
}

async function loadRequests(){
  const list=document.getElementById("requestList");if(!list)return;
  list.textContent="Loading customer requests...";
  const {data,error}=await supabaseClient.from("shoe_requests").select("*").order("created_at",{ascending:false});
  if(error){list.innerHTML='<p style="color:#b00020">Could not load requests: '+escapeHTML(error.message)+'</p>';return;}
  requests=data||[];
  if(!requests.length){list.textContent="No customer requests yet.";return;}
  list.innerHTML=requests.map(r=>`
    <div class="product-row">
      <h3>${escapeHTML(r.shoe_name)}</h3>
      <p>Size: ${escapeHTML(r.size)} | Quantity: ${Number(r.quantity)}</p>
      <p>Customer: ${escapeHTML(r.customer_name)} | Phone: ${escapeHTML(r.customer_phone)}</p>
      <p>Notes: ${escapeHTML(r.notes||"None")}</p>
      ${r.photo_url?`<p><a href="${escapeHTML(r.photo_url)}" target="_blank" rel="noopener">View reference photo</a></p>`:""}
      <p>Received: ${r.created_at?new Date(r.created_at).toLocaleString():""}</p>
      <label>Status</label>
      <select id="request-status-${escapeHTML(r.id)}">
        ${["New","Contacted","Ordered","Fulfilled","Unavailable"].map(v=>`<option ${String(r.status||"New")===v?"selected":""}>${v}</option>`).join("")}
      </select>
      <button class="admin-btn success" onclick="updateRequestStatus('${escapeHTML(r.id)}')">Update Status</button>
    </div>`).join("");
}
async function updateRequestStatus(id){
  const status=document.getElementById("request-status-"+id).value;
  const {error}=await supabaseClient.from("shoe_requests").update({status}).eq("id",id);
  if(error){message("Could not update request: "+error.message);return;}
  message("Request status updated.");await loadRequests();
}


async function forgotAdminPassword(){
  const email=document.getElementById("email").value.trim();
  if(!email){message("Enter your account email first.");return;}
  message("Sending password reset email...");
  const redirectTo=window.location.origin.replace(/\/$/,"").replace(/\/admin$/,"")+"/reset-password.html";
  const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo});
  if(error){message("Could not send reset email: "+error.message);return;}
  message("Password reset email sent. Open the newest email and follow its link.");
}
