"use strict";

const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

/**
 * Azure Function: POST /api/rsvp
 *
 * Accepts an RSVP submission, validates it, and stores it in Azure Table Storage.
 * Required environment variables:
 *   AZURE_STORAGE_ACCOUNT_NAME  – your Azure Storage account name
 *   AZURE_STORAGE_ACCOUNT_KEY   – your Azure Storage account key
 *   AZURE_TABLE_NAME            – table name (defaults to "rsvps")
 */
module.exports = async function (context, req) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // ── Validate request body ──────────────────────────────────────────────────
  const body = req.body || {};
  const { name, contactInfo, attending, guestNames, bringing, notes } = body;

  const errors = [];

  if (!name || String(name).trim().length < 2) {
    errors.push("name: Name is required.");
  }
  if (!contactInfo || String(contactInfo).trim().length < 5) {
    errors.push("contactInfo: Email or phone is required.");
  }
  const attendingNum = parseInt(attending, 10);
  if (!attending || isNaN(attendingNum) || attendingNum < 1) {
    errors.push("attending: Number attending must be at least 1.");
  }

  if (errors.length > 0) {
    context.res = {
      status: 400,
      headers,
      body: JSON.stringify({ error: "Please fix the following: " + errors.join(" ") }),
    };
    return;
  }

  // ── Store in Azure Table Storage ───────────────────────────────────────────
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey  = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const tableName   = process.env.AZURE_TABLE_NAME || "rsvps";

  if (!accountName || !accountKey) {
    context.log.error("Azure Storage credentials are not configured.");
    context.res = {
      status: 500,
      headers,
      body: JSON.stringify({ error: "Server configuration error. Please try again later." }),
    };
    return;
  }

  try {
    const credential = new AzureNamedKeyCredential(accountName, accountKey);
    const client = new TableClient(
      `https://${accountName}.table.core.windows.net`,
      tableName,
      credential
    );

    // Create the table if it doesn't exist yet (safe to call repeatedly)
    await client.createTable().catch(() => {});

    const rowKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await client.createEntity({
      partitionKey: "rsvp",
      rowKey,
      name:         String(name).trim(),
      contactInfo:  String(contactInfo).trim(),
      attending:    attendingNum,
      guestNames:   String(guestNames || "").trim(),
      bringing:     String(bringing   || "").trim(),
      notes:        String(notes      || "").trim(),
      submittedAt:  new Date().toISOString(),
    });

    context.log(`RSVP received from: ${String(name).trim()} (${attendingNum} attending)`);

    context.res = {
      status: 200,
      headers,
      body: JSON.stringify({ success: true, message: "RSVP received! See you on July 25th 🎉" }),
    };
  } catch (err) {
    context.log.error("Error saving RSVP:", err.message);
    context.res = {
      status: 500,
      headers,
      body: JSON.stringify({ error: "We couldn't save your RSVP. Please try again." }),
    };
  }
};
