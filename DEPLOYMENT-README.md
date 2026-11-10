# MediCycle deployment checklist

## What changed in this update
- Replaced `public/index.html` with the refreshed MediCycle homepage.
- Kept the existing `public/style.css` and added homepage illustration fallbacks and a safety disclaimer.
- Corrected the model filename to `models/User.js` to match `require('./models/User')` on case-sensitive Linux hosts.
- Kept existing backend routes and other pages unchanged.

## Before local testing
1. Install Node.js (LTS recommended).
2. In this folder run `npm install`.
3. Create `.env` locally (never upload it):

```
MONGODB_URI=your_mongodb_atlas_connection_string
SESSION_SECRET=replace_with_a_long_random_secret
ADMIN_USERNAME=choose_an_admin_username
ADMIN_PASSWORD=choose_a_strong_unique_password
NODE_ENV=development
```

4. Run `npm start` and open `http://localhost:3000`.

## Important issues to resolve before a real public launch
- The current donation form asks for image and prescription uploads, but `form.js` sends JSON and does not upload those files. Do not tell donors uploads are stored until multipart upload handling and secure file storage are implemented.
- Donation requests can currently be submitted without a donor login and are not linked to an account in that case. Review the donor workflow before collecting real personal data.
- Express's default MemoryStore is not suitable for production. Configure a persistent session store (for example, MongoDB-backed sessions) before public use.
- The current admin status values and labels are basic (`Pending`, `Approved`, `Rejected`, `Completed`). Use clear review/collection terminology and ensure approval is only performed by an authorized receiving organization.
- Add rate limiting, security headers, request validation, privacy notice/contact details, and backup/retention practices before public launch.
- Only publish real collection centres after verifying their participation and the services they actually provide. Do not claim a pharmacy accepts medicine donations without confirmation.
- Never redistribute medicines through this student website. A receiving organization must determine acceptance, handling and disposal under applicable Indian rules.

## Render deployment outline
1. Push the project to a private or public GitHub repository. Exclude `.env` and `node_modules`.
2. Create a Render Web Service connected to that repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add `MONGODB_URI`, `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `NODE_ENV=production` in Render Environment settings.
6. Configure MongoDB Atlas network access securely for the hosting service. Avoid leaving the database open to all IP addresses as a permanent setting.
7. Deploy and test registration, login, logout, donation submission, donor history, admin login and status changes.

This package is an updated project snapshot, not a certification that every feature is production-ready. Complete the listed security and upload work before accepting real donor information.
