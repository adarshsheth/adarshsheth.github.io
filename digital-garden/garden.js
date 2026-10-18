(() => {
  const state = { manifest: null, pages: new Map(), activeId: null };
  const $ = (selector) => document.querySelector(selector);

  function pageUrl(id) {
    return `${window.location.pathname}?page=${encodeURIComponent(id)}`;
  }

  function childrenOf(id) {
    return state.manifest.pages.filter((page) => page.parentId === id);
  }

  function pageById(id) {
    return state.pages.get(id);
  }

  function syncCustomSelect(select) {
    const wrapper = select.nextElementSibling;
    if (!wrapper || !wrapper.classList.contains("garden-select")) return;
    const button = wrapper.querySelector(".garden-select-button");
    const menu = wrapper.querySelector(".garden-select-menu");
    const selected = select.options[select.selectedIndex];
    button.querySelector("span").textContent = selected?.textContent || "";
    button.setAttribute("aria-expanded", wrapper.classList.contains("open") ? "true" : "false");
    wrapper.classList.toggle("is-disabled", select.disabled);
    button.disabled = select.disabled;
    menu.replaceChildren();
    Array.from(select.options).forEach((option) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "garden-select-option";
      optionButton.textContent = option.textContent;
      optionButton.disabled = option.disabled;
      optionButton.setAttribute("aria-selected", option.value === select.value ? "true" : "false");
      optionButton.addEventListener("click", () => {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        wrapper.classList.remove("open");
        syncCustomSelect(select);
      });
      menu.append(optionButton);
    });
  }

  function setupCustomSelects() {
    document.querySelectorAll(".garden-select-native").forEach((select) => {
      if (select.nextElementSibling?.classList.contains("garden-select")) return;
      const wrapper = document.createElement("div");
      wrapper.className = "garden-select";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "garden-select-button";
      button.setAttribute("aria-haspopup", "listbox");
      button.innerHTML = "<span></span>";
      const menu = document.createElement("div");
      menu.className = "garden-select-menu";
      menu.setAttribute("role", "listbox");
      button.addEventListener("click", () => {
        if (select.disabled) return;
        document.querySelectorAll(".garden-select.open").forEach((other) => {
          if (other !== wrapper) other.classList.remove("open");
        });
        wrapper.classList.toggle("open");
        syncCustomSelect(select);
      });
      wrapper.append(button, menu);
      select.after(wrapper);
      syncCustomSelect(select);
    });
  }

  function setPageUrl(id) {
    window.history.pushState({ page: id }, "", pageUrl(id));
  }

  function openPage(id, updateUrl = true) {
    const page = pageById(id);
    if (!page) return;
    state.activeId = id;
    if (updateUrl) setPageUrl(id);
    renderNavigation();
    renderGraph();
    loadPageContent(page);
  }

  function addLink(parent, page, level) {
    const item = document.createElement("div");
    item.className = `tree-item level-${Math.min(level, 2)}`;
    const link = document.createElement("a");
    link.href = pageUrl(page.id);
    link.textContent = page.title;
    link.dataset.gardenLink = page.id;
    link.setAttribute("aria-current", page.id === state.activeId ? "page" : "false");
    item.append(link);
    parent.append(item);
    childrenOf(page.id).forEach((child) => addLink(parent, child, level + 1));
  }

  function renderNavigation() {
    const parentSelect = $("#parent-select");
    const childSelect = $("#child-select");
    const pageSelect = $("#page-select");
    const tree = $("#garden-tree");
    parentSelect.replaceChildren(new Option("Choose a root or parent...", ""));
    pageSelect.replaceChildren(new Option("Choose a page...", ""));
    tree.replaceChildren();

    state.manifest.pages.filter((page) => childrenOf(page.id).length > 0).forEach((page) => {
      parentSelect.add(new Option(page.title, page.id));
    });
    state.manifest.pages.forEach((page) => pageSelect.add(new Option(page.title, page.id)));
    state.manifest.pages.filter((page) => page.parentId === null).forEach((page) => addLink(tree, page, 0));

    const active = pageById(state.activeId);
    if (active) {
      parentSelect.value = active.parentId || active.id;
      pageSelect.value = active.id;
      const children = childrenOf(active.id);
      childSelect.replaceChildren(new Option(
        children.length ? "Choose a child page..." : "This page has no children",
        ""
      ));
      children.forEach((child) => childSelect.add(new Option(child.title, child.id)));
      childSelect.disabled = children.length === 0;
    }
    [parentSelect, childSelect, pageSelect].forEach(syncCustomSelect);
    $("#page-count").textContent = `${state.manifest.pages.length} pages`;
    $("#graph-page-count").textContent = state.manifest.pages.length;
  }

  function renderGraph() {
    const svg = $("#garden-graph");
    const pages = state.manifest.pages;
    const width = Math.max(760, pages.length * 150);
    const height = 390;
    const positions = new Map();
    const roots = pages.filter((page) => page.parentId === null);
    const levels = [];

    function place(page, depth, slot, total) {
      if (!levels[depth]) levels[depth] = [];
      levels[depth].push(page);
      const x = ((slot + 1) / (total + 1)) * width;
      const y = 60 + depth * 125;
      positions.set(page.id, { x, y });
      const children = childrenOf(page.id);
      children.forEach((child, index) => place(child, depth + 1, index + slot * children.length, Math.max(children.length, total)));
    }
    roots.forEach((root, index) => place(root, 0, index, Math.max(roots.length, 1)));

    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.minWidth = `${width}px`;
    svg.replaceChildren();
    const edgeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

    pages.forEach((page) => {
      if (!page.parentId || !positions.has(page.parentId)) return;
      const from = positions.get(page.parentId);
      const to = positions.get(page.id);
      const edge = document.createElementNS("http://www.w3.org/2000/svg", "line");
      edge.setAttribute("x1", from.x);
      edge.setAttribute("y1", from.y + 18);
      edge.setAttribute("x2", to.x);
      edge.setAttribute("y2", to.y - 18);
      edge.classList.add("graph-edge");
      edgeGroup.append(edge);
    });

    pages.forEach((page) => {
      const position = positions.get(page.id);
      if (!position) return;
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.classList.add("graph-node");
      group.setAttribute("role", "button");
      group.setAttribute("tabindex", "0");
      group.setAttribute("aria-label", `Open ${page.title}`);
      if (page.id === state.activeId) group.setAttribute("aria-current", "page");
      group.addEventListener("click", () => openPage(page.id));
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPage(page.id);
        }
      });
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", position.x);
      circle.setAttribute("cy", position.y);
      circle.setAttribute("r", page.id === state.activeId ? "17" : "13");
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", position.x);
      label.setAttribute("y", position.y + 40);
      label.setAttribute("text-anchor", "middle");
      label.textContent = page.title.length > 22 ? `${page.title.slice(0, 20)}…` : page.title;
      group.append(circle, label);
      nodeGroup.append(group);
    });
    svg.append(edgeGroup, nodeGroup);
  }

  async function loadPageContent(page) {
    const content = $("#garden-content");
    content.innerHTML = '<p class="loading-state">Opening note...</p>';
    try {
      const response = await fetch(page.file);
      if (!response.ok) throw new Error(`Page returned ${response.status}`);
      const html = await response.text();
      const documentFragment = new DOMParser().parseFromString(html, "text/html");
      const article = documentFragment.querySelector("article[data-garden-id]");
      if (!article || article.dataset.gardenId !== page.id || article.dataset.parentId !== String(page.parentId)) {
        throw new Error("Page metadata does not match garden.json");
      }
      const header = document.createElement("header");
      header.innerHTML = `<p class="eyebrow">GARDEN NOTE</p><h2>${page.title}</h2><p class="garden-meta">${page.summary} · ${page.tags.join(" · ")}</p>`;
      const body = document.createElement("div");
      body.className = "garden-body";
      body.innerHTML = article.innerHTML;
      body.querySelectorAll("[data-garden-link]").forEach((link) => {
        const target = link.dataset.gardenLink;
        link.href = pageUrl(target);
      });
      content.replaceChildren(header, body);
    } catch (error) {
      content.innerHTML = `<p class="loading-state">Unable to load this note: ${error.message}</p>`;
    }
  }

  function bindControls() {
    $("#parent-select").addEventListener("change", (event) => {
      if (event.target.value) openPage(event.target.value);
    });
    $("#child-select").addEventListener("change", (event) => {
      if (event.target.value) openPage(event.target.value);
    });
    $("#page-select").addEventListener("change", (event) => {
      if (event.target.value) openPage(event.target.value);
    });
    $("#focus-graph").addEventListener("click", () => $("#graph-card").scrollIntoView({ behavior: "smooth", block: "start" }));
    document.addEventListener("click", (event) => {
      const link = event.target.closest("[data-garden-link]");
      if (!link) return;
      event.preventDefault();
      openPage(link.dataset.gardenLink);
    });
    window.addEventListener("popstate", () => openPage(new URLSearchParams(window.location.search).get("page") || "garden", false));
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".garden-select")) {
        document.querySelectorAll(".garden-select.open").forEach((select) => select.classList.remove("open"));
      }
    });
  }

  async function init() {
    bindControls();
    const response = await fetch("garden.json");
    if (!response.ok) throw new Error(`Manifest returned ${response.status}`);
    state.manifest = await response.json();
    state.manifest.pages.forEach((page) => state.pages.set(page.id, page));
    setupCustomSelects();
    const requestedId = new URLSearchParams(window.location.search).get("page");
    state.activeId = state.pages.has(requestedId) ? requestedId : state.manifest.pages.find((page) => page.parentId === null).id;
    $("#garden-title").textContent = state.manifest.title;
    $("#garden-description").textContent = state.manifest.description;
    renderNavigation();
    renderGraph();
    loadPageContent(pageById(state.activeId));
  }

  init().catch((error) => {
    $("#garden-content").innerHTML = `<p class="loading-state">The garden could not start: ${error.message}</p>`;
  });
})();
