TWO-PANEL GENERAL STORE APP

Routes:
- /admin : private admin login and product/order management
- /shop  : public grocery shopping page
- /      : redirects to /shop

IMPORTANT: This version uses Supabase for shared persistent product/order data. Do not rely on a local JSON file on Render because its free service filesystem is ephemeral.

DEPLOY:
1. Upload all project files and the public/ folder to the ROOT of your GitHub repository.
2. Render Web Service:
   Build Command: npm install
   Start Command: npm start
   Runtime: Node
3. Create a Supabase project.
4. In Supabase SQL Editor, run schema.sql.
5. In Supabase Project Settings > API, copy Project URL and service_role secret key.
6. In Render > Environment, add:
   SUPABASE_URL = your Supabase Project URL
   SUPABASE_SERVICE_ROLE_KEY = your Supabase service_role key
   ADMIN_PASSWORD = choose a long unique admin password
7. Redeploy.

SECURITY:
- Keep SUPABASE_SERVICE_ROLE_KEY only in Render environment variables. Never place it in frontend files or GitHub.
- Use a strong ADMIN_PASSWORD. Admin session tokens are held in server memory and users will need to log in again after service restart.
- Customer page currently submits an order request. It does not process online payments.
- Stock is shown to customers and checked when an order is placed, but this starter does not decrement stock automatically on order submission. Admin should review and update stock manually. Add order fulfilment/stock decrement logic before production use.
- This is a starter application. Add rate limiting, stronger session persistence, input validation and backups before public production use.
