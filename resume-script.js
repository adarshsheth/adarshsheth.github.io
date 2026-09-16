// PDF.js Worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

// --- CENTRAL RESUME CONFIGURATION ---
const masterResumeConfig = [
	{
		id: "general",
		name: "General",
		label: "GENERAL",
		fileSuffix: "",
		publicPath: "media/resume/general_public.pdf",
		privatePath: "media/resume/general_private.pdf",
		status: "ready",
		isPrivateOnly: false,
	},
	{
		id: "me",
		name: "Mechanical",
		label: "MECHANICAL",
		fileSuffix: "_Mechanical",
		publicPath: "",
		privatePath: "",
		status: "coming_soon",
		isPrivateOnly: false,
	},
	{
		id: "sw",
		name: "Software",
		label: "SOFTWARE",
		fileSuffix: "_Software",
		publicPath: "",
		privatePath: "",
		status: "coming_soon",
		isPrivateOnly: false,
	},
	{
		id: "se",
		name: "Systems",
		label: "SYSTEMS",
		fileSuffix: "_Systems",
		publicPath: "",
		privatePath: "",
		status: "coming_soon",
		isPrivateOnly: false,
	},
];

// Shared Variables
let currentBasePdfUrl = "";
let currentDownloadName = "";
let currentGeneratedBlobUrl = "";

// Shared UI Builder
// function buildResumeUI() {
function buildResumeUI(isPrivateSite = false) { // Add flag
	const sbNav = document.getElementById("sb-nav");
	const filters = document.querySelector(".portfolio-filters");

	if (sbNav) sbNav.innerHTML = "";
	if (filters) filters.innerHTML = "";

	
	masterResumeConfig.forEach((resume) => {
        // Skip private-only resumes if building the public UI
        if (resume.isPrivateOnly && !isPrivateSite) return;
    
        // masterResumeConfig.forEach((resume) => {
		// Build Sidebar Link
		if (sbNav) {
			const sbLink = document.createElement("a");
			sbLink.className = "sbn";
			sbLink.dataset.k = resume.id;

			if (resume.status === "ready") {
				sbLink.href = "#";
				sbLink.onclick = (e) => {
					e.preventDefault();
					window.switchResume(resume.id);
				};
			} else {
				sbLink.style.opacity = "0.75";
				sbLink.style.pointerEvents = "none";
				sbLink.title = "Coming Soon";
			}
			sbLink.innerHTML = `<span class="sbdot"></span><span class="sblbl">${resume.name}</span>`;
			sbNav.appendChild(sbLink);
		}

		// Build Top Filter Button
		if (filters) {
			const btn = document.createElement("button");
			btn.className = "filter-btn";
			btn.id = `tab-${resume.id}`;
			btn.textContent = resume.label;

			if (resume.status === "ready") {
				btn.onclick = () => window.switchResume(resume.id);
			} else {
				btn.disabled = true;
				btn.style.opacity = "0.5";
				btn.style.cursor = "not-allowed";
				btn.title = "Coming Soon";
			}
			filters.appendChild(btn);
		}
	});
}

// Shared PDF Renderer
const renderPDF = async (pdfUrlToRender) => {
	const container = document.getElementById("pdf-container");
	try {
		const pdf = await pdfjsLib.getDocument(pdfUrlToRender).promise;
		container.innerHTML = "";

		for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
			const page = await pdf.getPage(pageNum);
			const pageWrapper = document.createElement("div");
			pageWrapper.className = "pdf-page-wrapper";

			const canvas = document.createElement("canvas");
			canvas.className = "pdf-page-canvas";
			const ctx = canvas.getContext("2d");

			const textLayerDiv = document.createElement("div");
			textLayerDiv.className = "textLayer";

			pageWrapper.appendChild(canvas);
			pageWrapper.appendChild(textLayerDiv);
			container.appendChild(pageWrapper);

			const containerWidth = container.clientWidth || Math.min(window.innerWidth - 96, 1000);
			const unscaledViewport = page.getViewport({scale: 1.0});
			const displayScale = containerWidth / unscaledViewport.width;
			const viewport = page.getViewport({scale: displayScale});

			const outputScale = (window.devicePixelRatio || 1) * 2;
			canvas.width = Math.floor(viewport.width * outputScale);
			canvas.height = Math.floor(viewport.height * outputScale);
			canvas.style.height = Math.floor(viewport.height) + "px";

			await page.render({canvasContext: ctx, transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null, viewport: viewport}).promise;

			textLayerDiv.style.width = Math.floor(viewport.width) + "px";
			textLayerDiv.style.height = Math.floor(viewport.height) + "px";
			textLayerDiv.style.setProperty("--scale-factor", displayScale);

			const textContent = await page.getTextContent();
			await pdfjsLib.renderTextLayer({textContentSource: textContent, container: textLayerDiv, viewport: viewport, textDivs: []}).promise;
		}
		container.style.opacity = "1";
	} catch (error) {
		console.error("Error rendering the PDF:", error);
		container.style.opacity = "1";
		container.innerHTML = '<div class="pdf-page-wrapper" style="aspect-ratio: 8.5 / 11; background: white;"></div>';
	}
};

// Shared Resize Listener
let resizeTimer;
let lastWidth = window.innerWidth;
window.addEventListener("resize", () => {
	clearTimeout(resizeTimer);
	resizeTimer = setTimeout(() => {
		if (window.innerWidth !== lastWidth) {
			lastWidth = window.innerWidth;
			if (currentGeneratedBlobUrl) renderPDF(currentGeneratedBlobUrl);
		}
	}, 250);
});
