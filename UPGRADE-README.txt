# PAMAC FOOT WEAR COLLECTION — upgrade package

## What changed
- Replaced the empty `request.html` with a working customer shoe-request form.
- Requests are inserted into Supabase `shoe_requests`.
- Optional request photos upload to a separate `shoe-requests` Storage bucket.
- Admin portal now restores an existing login session, lists customer requests, and lets an administrator update request status.
- Customer shop order buttons ask for size, quantity, name and phone, validate the selected size/available stock, then open WhatsApp with a complete order message.
- Existing Supabase project, product table, product-photo bucket, theme and WhatsApp number are retained.

## IMPORTANT: one-time Supabase setup
1. Open https://supabase.com/dashboard/project/bfvbcxqfosxaynsvjord/sql/new
2. Open `SUPABASE_REQUESTS_SETUP.sql` from this folder.
3. Copy the entire SQL script into the Supabase SQL Editor and press **Run**.
4. Confirm it says Success.

This creates the `shoe_requests` table, access policies and a separate public `shoe-requests` image bucket. Customers can submit requests; only authenticated accounts listed in `admin_users` can read/update the requests.

## Test locally on Android / Termux
From Termux:
```bash
cd ~/pamac-new
python -m http.server 8080
```
Keep Termux open. In Chrome test:
- Home: http://127.0.0.1:8080/
- Customer shop: http://127.0.0.1:8080/shop.html
- Shoe request: http://127.0.0.1:8080/request.html
- Admin: http://127.0.0.1:8080/admin/

## Publish the upgrade
After extracting/copying these updated files over your existing `~/pamac-new` project, run:
```bash
cd ~/pamac-new
git add index.html shop.html request.html admin/index.html js css SUPABASE_REQUESTS_SETUP.sql
git commit -m "Upgrade PAMAC shop, admin and shoe requests"
git push
```
Then open https://pmwanggi-eng.github.io/pamac-footwear-2026/

## Notes
- Admin login uses the existing Supabase Auth email/password and `admin_users` allow-list.
- Never put a Supabase service-role/secret key in browser JavaScript. The existing publishable key in `js/config.js` is intended for browser use.
- Customer order submission opens WhatsApp. It does not automatically deduct stock or mark an order paid; confirm the order and update inventory in the admin portal.
- Public request photo upload can be abused/spammed; the form limits images to 5 MB and SQL validates basic fields. Add CAPTCHA/rate limiting before large-scale public use.


## Admin password recovery
- Open the admin portal and tap Forgot password?
- Enter the admin email. The app sends a reset email with redirect to reset-password.html.
- Open the newest email on the same phone/browser, choose a new password, and save it.
- Supabase Authentication URL Configuration must allow https://pmwanggi-eng.github.io/pamac-footwear-2026/** and Site URL should be the GitHub Pages project URL.
