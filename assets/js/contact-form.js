/* Netlify Forms — AJAX 전송 후 성공 모달 / 실패 시 안내 */
(function () {
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function buildBody(form) {
    var fd = new FormData(form);
    if (!fd.has("form-name")) fd.append("form-name", "contact");
    var params = new URLSearchParams();
    fd.forEach(function (value, key) {
      params.append(key, value);
    });
    return params.toString();
  }

  function openModal(modal) {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    var closeBtn = modal.querySelector(".contact-modal__btn");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = $("#contact-form");
    var modal = $("#contact-success-modal");
    var hint = $("#contact-form-hint");
    if (!form || !modal) return;

    var submitUrl = form.getAttribute("action") || "/";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (hint) {
        hint.textContent = "";
        hint.classList.remove("is-error", "is-ok");
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "전송 중…";
      }

      fetch(submitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: buildBody(form),
      })
        .then(function (res) {
          if (!res.ok) throw new Error("submit failed");
          form.reset();
          openModal(modal);
        })
        .catch(function () {
          if (hint) {
            hint.textContent =
              "전송에 실패했습니다. 연결을 확인하시거나 잠시 후 다시 시도해 주세요. 급하신 경우 이메일로 문의해 주세요.";
            hint.classList.add("is-error");
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel || "문의 보내기";
          }
        });
    });

    modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", function () {
        closeModal(modal);
      });
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && modal && !modal.hidden) closeModal(modal);
    });

    /* Netlify 기본 리다이렉트 등으로 ?success=1 붙은 경우 */
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get("success") === "1") openModal(modal);
    } catch (err) {}
  });
})();
