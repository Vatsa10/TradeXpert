"use server";

import { connectToDatabase } from "@/database/mongoose";

// RFC 2606 / RFC 7505 reserve these for documentation and testing: they publish
// a Null MX record, so mail to them is *guaranteed* to bounce, forever. A single
// leftover QA account on example.com generated a mailer-daemon bounce to the
// sending address every day until it was deleted. Never queue mail to them.
const UNDELIVERABLE_EMAIL_DOMAINS =
  /@(?:example\.(?:com|net|org)|(?:[^@]*\.)?(?:test|example|invalid|localhost))$/i;

// Not exported: a "use server" module may only export async functions, and
// this guard is consumed in-file.
function isUndeliverableEmail(email: string): boolean {
  return UNDELIVERABLE_EMAIL_DOMAINS.test(email.trim());
}

export async function getAllUsersForNewsEmail() {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not found");

    const users = await db
      .collection("user")
      .find(
        { email: { $exists: true, $ne: null } },
        { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
      )
      .toArray();

    const deliverable = users.filter(
      (user) =>
        user.email &&
        user.name &&
        !isUndeliverableEmail(user.email) &&
        // Opt-out is honoured here rather than at send time so an unsubscribed
        // address is never even queued.
        user.newsEmailOptOut !== true
    );

    const skipped = users.length - deliverable.length;
    if (skipped > 0) {
      console.warn(
        `[NewsEmail] skipped ${skipped} user(s) with reserved/undeliverable email domains`
      );
    }

    return deliverable.map((user) => ({
      id: user.id || user._id?.toString() || "",
      email: user.email,
      name: user.name,
    }));
  } catch (error) {
    console.error("Error getting all users for news email:", error);
    return [];
  }
}
