(() => {
    function initLeftLinkBars() {
        document.querySelectorAll("[data-left-link-bar]").forEach((placeholder) => {
            if (placeholder.dataset.leftLinkBarInitialized === "true") return;

            const label = placeholder.dataset.label || "PORTFOLIO";
            const href = placeholder.dataset.href || "/portfolio";
            const trigger = document.createElement("div");
            trigger.id = "back-sidebar-trigger";
            trigger.innerHTML = `
                <a href="${href}" id="back-sidebar" aria-label="Go to ${label}">
                    <span class="back-text"></span>
                </a>
            `;
            trigger.querySelector(".back-text").textContent = label;
            placeholder.replaceWith(trigger);
            trigger.dataset.leftLinkBarInitialized = "true";
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initLeftLinkBars, { once: true });
    } else {
        initLeftLinkBars();
    }
})();
