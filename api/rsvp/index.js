"use strict";

/**
 * Azure Function: POST /api/rsvp
 *
 * Registration is closed — the event has concluded.
 */
module.exports = async function (context, _req) {
  context.res = {
    status: 410,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({ error: "Registration is closed. The event has concluded." }),
  };
};
