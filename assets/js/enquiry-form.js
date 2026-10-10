/* ==========================================================================
   Neat Narrative Co. — Quote enquiry form
   --------------------------------------------------------------------------
   Validates the enquiry client-side, then POSTs JSON to the backend described
   in assets/js/site-config.js and renders the result.

   The form is also a real HTML form (action="/api/enquiries" method="post"),
   so it still submits and still reaches the business if JavaScript is off —
   the backend answers a plain form post with a redirect to thank-you.html.

   Server error keys are mapped straight back onto the fields, so validation
   rules only need to be written once on the server to be authoritative here.
   ========================================================================== */

(function () {
  "use strict";

  var MAX_FILES = 4;
  var MAX_FILE_BYTES = 3 * 1024 * 1024;
  var ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

  var RULES = {
    fullName: {
      required: true,
      min: 2,
      max: 120,
      message: "Please tell us your name.",
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
      max: 180,
      message: "Please enter a valid email address, for example name@example.com.",
    },
    phone: {
      required: true,
      pattern: /^[0-9+()\s-]{7,30}$/,
      message: "Please enter a contact number we can reach you on.",
    },
    postcode: {
      required: true,
      min: 2,
      max: 60,
      message: "Please add your postcode or the town you would like us to clean in.",
    },
    propertyType: {
      required: true,
      message: "Please choose the type of property.",
    },
    service: {
      required: true,
      message: "Please choose the cleaning service you are interested in.",
    },
    consent: {
      required: true,
      message: "Please confirm you are happy for us to contact you about your enquiry.",
    },
  };

  var messageTimer = null;

  function config() {
    return window.NEAT_NARRATIVE || { enquiry: {}, business: {} };
  }

  function endpoint() {
    var configured = config().enquiry.endpoint;
    return configured ? configured : "/api/enquiries";
  }

  function form() {
    return document.querySelector("[data-enquiry-form]");
  }

  function fieldWrap(input) {
    return input.closest(".field") || input.parentElement;
  }

  /* --- Validation -------------------------------------------------------- */

  function valueOf(input) {
    if (input.type === "checkbox") {
      return input.checked;
    }
    return (input.value || "").trim();
  }

  function checkField(input) {
    var rule = RULES[input.name];
    var value = valueOf(input);

    if (!rule) {
      return "";
    }

    if (input.type === "checkbox") {
      return value ? "" : rule.message;
    }

    if (!value) {
      return rule.required ? rule.message : "";
    }

    if (rule.min && value.length < rule.min) {
      return rule.message;
    }

    if (rule.max && value.length > rule.max) {
      return "Please keep this under " + rule.max + " characters.";
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message;
    }

    return "";
  }

  function setFieldError(input, message) {
    var wrap = fieldWrap(input);
    if (!wrap) {
      return;
    }

    var error = wrap.querySelector(".field__error");
    if (!error) {
      return;
    }

    if (message) {
      error.textContent = message;
      wrap.setAttribute("data-invalid", "true");
      input.setAttribute("aria-invalid", "true");
    } else {
      error.textContent = "";
      wrap.removeAttribute("data-invalid");
      input.removeAttribute("aria-invalid");
    }
  }

  function validateForm(panel) {
    var inputs = Array.prototype.slice.call(panel.querySelectorAll("[name]"));
    var firstInvalid = null;

    inputs.forEach(function (input) {
      if (!RULES[input.name]) {
        return;
      }
      var message = checkField(input);
      setFieldError(input, message);
      if (message && !firstInvalid) {
        firstInvalid = input;
      }
    });

    return firstInvalid;
  }

  function mapServerErrors(panel, errors) {
    var firstInvalid = null;

    Object.keys(errors).forEach(function (name) {
      var input = panel.querySelector('[name="' + name + '"]');
      if (!input) {
        return;
      }
      setFieldError(input, errors[name]);
      if (!firstInvalid) {
        firstInvalid = input;
      }
    });

    return firstInvalid;
  }

  /* --- Attachments ------------------------------------------------------- */

  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var result = String(reader.result);
        var comma = result.indexOf(",");
        resolve({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          dataBase64: comma === -1 ? "" : result.slice(comma + 1),
        });
      };
      reader.onerror = function () {
        reject(new Error("Could not read " + file.name));
      };
      reader.readAsDataURL(file);
    });
  }

  function chosenFiles(panel) {
    var input = panel.querySelector('input[type="file"]');
    return input && input.files ? Array.prototype.slice.call(input.files) : [];
  }

  function validateFiles(files) {
    if (files.length > MAX_FILES) {
      return "Please attach no more than " + MAX_FILES + " photographs.";
    }

    for (var i = 0; i < files.length; i += 1) {
      if (files[i].size > MAX_FILE_BYTES) {
        return (
          files[i].name +
          " is larger than 3 MB. Please attach a smaller version so your enquiry sends quickly."
        );
      }
      if (files[i].type && ACCEPTED_TYPES.indexOf(files[i].type) === -1) {
        return files[i].name + " is not a supported file type. Photographs and PDFs are fine.";
      }
    }

    return "";
  }

  function formatSize(bytes) {
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }
    return Math.max(1, Math.round(bytes / 1024)) + " KB";
  }

  /* Show what has been attached, so the visitor can see it registered and can
     tell at a glance whether they picked the right photograph. */
  function renderFilePreview(panel) {
    var container = panel.querySelector("[data-file-preview]");
    if (!container) {
      return;
    }

    container.innerHTML = "";

    chosenFiles(panel).forEach(function (file) {
      var chip = document.createElement("span");
      chip.className = "file-chip";

      var isPdf = file.type === "application/pdf";
      chip.innerHTML =
        '<svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons/sprite.svg#icon-' +
        (isPdf ? "file-text" : "image") +
        '"></use></svg>';

      chip.appendChild(document.createTextNode(file.name + " · " + formatSize(file.size)));
      container.appendChild(chip);
    });
  }

  /* --- Status messaging -------------------------------------------------- */

  function showStatus(state, title, body, action) {
    var status = document.querySelector("[data-form-status]");
    if (!status) {
      return;
    }

    clearTimeout(messageTimer);
    status.setAttribute("data-state", state);
    status.innerHTML = "";

    var icon = document.createElement("span");
    icon.className = "spinner";
    if (state === "success") {
      icon.className = "icon-wrap icon-wrap--plain";
      icon.innerHTML =
        '<svg class="icon icon--xl" aria-hidden="true"><use href="assets/icons/sprite.svg#icon-check-circle"></use></svg>';
    } else if (state === "error") {
      icon.className = "icon-wrap icon-wrap--plain";
      icon.innerHTML =
        '<svg class="icon icon--xl" aria-hidden="true"><use href="assets/icons/sprite.svg#icon-alert"></use></svg>';
    }

    var text = document.createElement("div");
    text.className = "form-status__text";

    var heading = document.createElement("strong");
    heading.textContent = title;
    text.appendChild(heading);

    if (body) {
      text.appendChild(document.createTextNode(body));
    }

    if (action && action.href) {
      var link = document.createElement("a");
      link.className = "btn btn--primary btn--sm";
      link.href = action.href;
      link.textContent = action.label || "Continue";
      text.appendChild(link);
    }

    status.appendChild(icon);
    status.appendChild(text);
    status.focus();
  }

  function clearStatus() {
    var status = document.querySelector("[data-form-status]");
    if (status) {
      status.removeAttribute("data-state");
      status.innerHTML = "";
    }
  }

  /* --- Submission -------------------------------------------------------- */

  function collect(panel) {
    var data = {};

    Array.prototype.slice.call(panel.querySelectorAll("[name]")).forEach(function (input) {
      if (input.name === "attachments" || input.type === "file") {
        return;
      }
      data[input.name] = valueOf(input);
    });

    data.meta = {
      page: window.location.pathname,
      referrer: document.referrer || "",
    };

    return data;
  }

  function post(payload, controller) {
    return fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).then(function (response) {
      return response
        .json()
        .catch(function () {
          return {};
        })
        .then(function (body) {
          return { status: response.status, body: body };
        });
    });
  }

  /* --- Email fallback ----------------------------------------------------- */
  /*
     This website is a set of static files, so there is no guarantee that an
     API is deployed behind it. If the POST cannot be completed, the visitor is
     offered the same enquiry as a pre-filled email instead of a dead end. The
     message then leaves from their own account, addressed by them — the site
     itself transmits nothing.
  */

  var FIELD_LABELS = {
    fullName: "Name",
    phone: "Phone",
    email: "Email",
    postcode: "Postcode or town",
    propertyType: "Property type",
    service: "Service",
    frequency: "How often",
    message: "Notes",
    consent: "Happy to be contacted",
  };

  /* Read back what the visitor actually sees, so select boxes read as
     "Regular home cleaning" rather than "regular-cleaning". */
  function readableValue(input) {
    if (input.tagName === "SELECT") {
      var option = input.options[input.selectedIndex];
      return option && option.value ? option.text.trim() : "";
    }

    if (input.type === "checkbox") {
      return input.checked ? "Yes" : "No";
    }

    return (input.value || "").trim();
  }

  function enquiryRows(panel) {
    var rows = [];

    Array.prototype.slice.call(panel.querySelectorAll("[name]")).forEach(function (input) {
      var label = FIELD_LABELS[input.name];
      if (!label) {
        return;
      }
      var value = readableValue(input);
      if (value) {
        rows.push(label + ": " + value);
      }
    });

    var attachments = chosenFiles(panel);
    if (attachments.length) {
      rows.push(
        "Photographs: " +
          attachments.length +
          " ready to attach — please add them to this email before sending."
      );
    }

    rows.push("");
    rows.push("Sent from " + window.location.href);

    return rows;
  }

  function emailFallbackHref(panel) {
    var business = config().business || {};
    var subject = "Cleaning quote enquiry — " + (business.name || "website");
    var body = enquiryRows(panel).join("\n");

    return (
      "mailto:" +
      (business.email || "") +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body)
    );
  }

  function offerEmailFallback(panel, result) {
    var business = config().business || {};
    var body = (result && result.body) || {};

    if (config().enquiry.fallbackToEmail === false) {
      showStatus(
        "error",
        "We could not send your enquiry.",
        body.message ||
          "Please try again, or contact us on " +
            (business.phoneDisplay || "") +
            " or " +
            (business.email || "") +
            "."
      );
      return;
    }

    showStatus(
      "error",
      "We could not send your enquiry.",
      "Nothing has been lost — your answers are still on the form. Send them to us by " +
        "email instead and your own email app will open with everything filled in. " +
        "Or call " +
        (business.phoneDisplay || "") +
        ".",
      { href: emailFallbackHref(panel), label: "Send by email instead" }
    );
  }

  function handleSuccess(panel, reference) {
    var success = document.querySelector("[data-form-success]");
    var referenceNode = document.querySelector("[data-form-reference]");

    if (referenceNode) {
      referenceNode.textContent = reference ? "Your reference: " + reference : "";
      referenceNode.hidden = !reference;
    }

    panel.hidden = true;

    if (success) {
      success.hidden = false;
      success.setAttribute("tabindex", "-1");
      success.focus();
      success.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  function handleFailure(panel, result) {
    var body = result.body || {};

    if (result.status === 400) {
      var firstInvalid = mapServerErrors(panel, body.errors || {});
      showStatus("error", "Please check the highlighted fields.", body.message || "");
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    if (result.status === 429) {
      showStatus(
        "error",
        "That is a lot of enquiries in a short time.",
        body.message || "Please wait a few minutes and try again."
      );
      return;
    }

    offerEmailFallback(panel, result);
  }

  function init() {
    var panel = form();
    if (!panel) {
      return;
    }

    /* Re-validate a field once it has been touched. */
    panel.addEventListener(
      "blur",
      function (event) {
        var input = event.target;
        if (input.name && RULES[input.name]) {
          setFieldError(input, checkField(input));
        }
      },
      true
    );

    panel.addEventListener("input", function (event) {
      var input = event.target;
      if (input.name && RULES[input.name] && fieldWrap(input).getAttribute("data-invalid")) {
        setFieldError(input, checkField(input));
      }
    });

    var fileInput = panel.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.addEventListener("change", function () {
        renderFilePreview(panel);
      });
      renderFilePreview(panel);
    }

    panel.addEventListener("submit", function (event) {
      event.preventDefault();
      clearStatus();

      var firstInvalid = validateForm(panel);
      var files = chosenFiles(panel);
      var fileError = validateFiles(files);

      if (fileError) {
        showStatus("error", fileError, "");
        return;
      }

      if (firstInvalid) {
        showStatus("error", "Please check the highlighted fields.", "");
        firstInvalid.focus();
        firstInvalid.scrollIntoView({ block: "center", behavior: "smooth" });
        return;
      }

      var submitButton = panel.querySelector('[type="submit"]');
      if (submitButton) {
        submitButton.setAttribute("aria-disabled", "true");
      }
      showStatus("pending", "Sending your enquiry…", "This only takes a moment.");

      var controller =
        typeof AbortController === "function" ? new AbortController() : { signal: undefined };
      var timeout = window.setTimeout(function () {
        if (controller.abort) {
          controller.abort();
        }
      }, config().enquiry.timeoutMs || 20000);

      Promise.all(files.map(readFile))
        .then(function (attachments) {
          var payload = collect(panel);
          payload.attachments = attachments;
          return post(payload, controller);
        })
        .then(function (result) {
          window.clearTimeout(timeout);
          if (submitButton) {
            submitButton.removeAttribute("aria-disabled");
          }

          if (result.status === 200 || result.status === 201) {
            handleSuccess(panel, (result.body || {}).reference);
            return;
          }

          handleFailure(panel, result);
        })
        .catch(function () {
          window.clearTimeout(timeout);
          if (submitButton) {
            submitButton.removeAttribute("aria-disabled");
          }
          offerEmailFallback(panel, null);
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
