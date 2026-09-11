/**
 * One-time operational script for standing up a brand-new deployment: creates the very first
 * admin account. Every other account-creation path in this app needs an existing admin to work
 * (admin creates trainers/members via POST /admin/trainers and /admin/members, each handed a QR
 * pairing-token login) or is member self-registration (always role: 'member', never staff) - there
 * is no product-level way to create the first admin, which is a real gap for a fresh deployment.
 * Unlike the throwaway `_*.ts` diagnostic scripts in this same folder (gitignored, never meant to
 * be committed), this is a real, intentional, reusable tool - hence no underscore prefix, and it
 * is meant to be run again for any future gym/tenant this platform onboards.
 *
 * Usage: npx tsx src/db/bootstrap-admin.ts <email> <password> <firstName> <lastName>
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { UserModel } from './models/User.js';
import { getOrCreateDefaultTenant } from '../modules/auth/repository.js';
import { hashPassword } from '../lib/password.js';

async function main() {
  const [, , email, password, firstName, lastName] = process.argv;
  if (!email || !password || !firstName || !lastName) {
    console.error('Usage: npx tsx src/db/bootstrap-admin.ts <email> <password> <firstName> <lastName>');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI as string, { serverSelectionTimeoutMS: 15000 });

  const existing = await UserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.error(`An account with email ${email} already exists (role: ${existing.role}) - nothing created.`);
    process.exit(1);
  }

  const tenant = await getOrCreateDefaultTenant();
  const passwordHash = await hashPassword(password);
  const doc = await UserModel.create({
    tenantId: tenant._id,
    role: 'admin',
    email: email.toLowerCase(),
    firstName,
    lastName,
    passwordHash,
  });

  console.log(`Created admin account ${doc.email} (id ${doc._id.toString()}) in tenant "${tenant.name}".`);
  console.log('Log in with this email/password on the web dashboard - from there, use "New trainer"/"New member" to onboard everyone else.');
  process.exit(0);
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
