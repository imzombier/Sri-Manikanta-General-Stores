GENERAL STORE ADVANCED v2 — TWO SEPARATE PAGES

FIX FOR YOUR RENDER ERROR:
Render said it could not find /public/shop.html. In GitHub, the public folder must be directly at repository root, not nested inside another general-store-advanced folder.

Correct repository layout:
package.json
server.js
schema.sql
README-DEPLOY.txt
public/
  admin.html
  shop.html
  admin.js
  shop.js
  style.css
  manifest.webmanifest
  sw.js
  icon.svg

Upload the CONTENTS of this ZIP into the ROOT of the existing GitHub repository. Do not upload the outer folder as a nested directory. If old root files exist, replace/update them; create the public folder and put its files inside.

RENDER WEB SERVICE:
Runtime Node
Build command: npm install
Start command: npm start
Root directory: leave blank
Free instance

SUPABASE SETUP:
1. Create a Supabase project.
2. Open SQL Editor and run all of schema.sql.
3. In Project Settings > API, copy Project URL and service_role secret key.
4. Render > your Web Service > Environment: add
   SUPABASE_URL = https://YOUR-PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = service_role secret key
   ADMIN_PASSWORD = a long unique password
5. Save and redeploy.
Never put the service_role key in GitHub or browser code.

LINKS:
Admin: https://YOUR-RENDER-SERVICE.onrender.com/admin
Customer shop: https://YOUR-RENDER-SERVICE.onrender.com/shop

SHOP FEATURES:
Product image cards, Telugu/English names, category, selling price, unit, quantity selector, grams/kg/rupees/pieces, calculated amount, add to cart, continue shopping, cart review, customer details and place order.
Purchase price and profit are not exposed to customers.
Order placement checks stock and decreases stock atomically in Supabase.

ADMIN:
Password login, add/edit/hide products, image URL, unit, purchase rate, profit ₹ or %, automatic selling price, stock and low stock, order list and order status.

IMAGE:
Admin enters a public HTTPS image URL for each product. This build supports image URLs, not uploading image files.

NOTES:
This accepts customer orders but does not take online payments. Add payment gateway only when needed. Admin sessions expire after 12 hours or service restart. Render free service may sleep after inactivity. Test the complete order flow before using for real customers.
