/* rsvp.js – handles RSVP form submission */
(function () {
  "use strict";

  var form = document.getElementById("rsvp-form");
  if (!form) return;

  var successBox  = document.getElementById("rsvp-success");
  var errorBox    = document.getElementById("rsvp-error");
  var submitBtn   = document.getElementById("rsvp-submit");
  var submitText  = document.getElementById("rsvp-submit-text");
  var submitLoading = document.getElementById("rsvp-submit-loading");

  function showAlert(el) {
    if (successBox) successBox.hidden = true;
    if (errorBox)   errorBox.hidden   = true;
    if (el) el.hidden = false;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitText.hidden   = isLoading;
    submitLoading.hidden = !isLoading;
  }

  function clearErrors() {
    form.querySelectorAll(".field-error").forEach(function (el) {
      el.textContent = "";
    });
    form.querySelectorAll(".invalid").forEach(function (el) {
      el.classList.remove("invalid");
    });
  }

  function setError(fieldId, message) {
    var field = document.getElementById(fieldId);
    var errEl = document.getElementById(fieldId + "-error");
    if (field) field.classList.add("invalid");
    if (errEl) errEl.textContent = message;
  }

  function validateForm(data) {
    var valid = true;

    if (!data.name || data.name.trim().length < 2) {
      setError("name", "Please enter your name.");
      valid = false;
    }

    if (!data.contactInfo || data.contactInfo.trim().length < 5) {
      setError("contactInfo", "Please enter a valid email or phone number.");
      valid = false;
    }

    var attending = parseInt(data.attending, 10);
    if (!data.attending || isNaN(attending) || attending < 1) {
      setError("attending", "Please enter the number of guests (at least 1).");
      valid = false;
    }

    return valid;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors();

    var data = {
      name:        (form.elements.name.value || "").trim(),
      contactInfo: (form.elements.contactInfo.value || "").trim(),
      attending:   (form.elements.attending.value || "").trim(),
      guestNames:  (form.elements.guestNames.value || "").trim(),
      bringing:    (form.elements.bringing.value || "").trim(),
      notes:       (form.elements.notes.value || "").trim(),
    };

    if (!validateForm(data)) return;

    setLoading(true);
    showAlert(null);

    fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        return res.json().then(function (json) {
          return { status: res.status, body: json };
        });
      })
      .then(function (result) {
        setLoading(false);
        if (result.status >= 200 && result.status < 300) {
          showAlert(successBox);
          form.reset();
        } else {
          var msg = (result.body && result.body.error) || "An error occurred.";
          if (errorBox) {
            var msgEl = errorBox.querySelector("[data-error-message]");
            if (msgEl) msgEl.textContent = msg;
          }
          showAlert(errorBox);
        }
      })
      .catch(function () {
        setLoading(false);
        showAlert(errorBox);
      });
  });
})();
