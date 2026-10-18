/* ─────────────────────────────────────────────
   CONTACT — page-specific scripts
   Consolidated Oct 2026 from inline <script> blocks.
   (Blocks concatenated in original document order.)
   ───────────────────────────────────────────── */

/* ── Block 1 ── */
const cachedNav = sessionStorage.getItem("rawNavHTML");
        if (cachedNav) {
            document.getElementById("nav-placeholder").outerHTML = cachedNav;
            const header = document.getElementById("hdr");
            if (header) {
                header.querySelectorAll(".ni").forEach((link) => link.classList.remove("active"));
            }
        }

/* ── Block 2 ── */
function showToast(msg) {
            const t = document.getElementById("toast");
            t.textContent = msg;
            t.classList.add("show");
            clearTimeout(window._toastTimer);
            window._toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
        }

        // Copy-to-clipboard on any contact row (email / linkedin / short link)
        document.querySelectorAll(".contact-row").forEach((row) => {
            row.addEventListener("click", (e) => {
                const label = row.querySelector(".crlbl")?.textContent?.trim();
                if (label && navigator.clipboard) {
                    navigator.clipboard.writeText(
                        label.includes("@") ? label : (label.startsWith("http") ? label : "https://" + label)
                    ).catch(() => { });
                    showToast("Copied " + label);
                }
            });
        });

        // vCard line folding per RFC 2426: lines >75 chars get wrapped with
        // CRLF + a single leading space on each continuation line.
        function foldVCardLine(line) {
            const limit = 75;
            if (line.length <= limit) return line;
            let result = line.slice(0, limit);
            let rest = line.slice(limit);
            while (rest.length > 0) {
                result += "\r\n " + rest.slice(0, limit - 1);
                rest = rest.slice(limit - 1);
            }
            return result;
        }

        // Fetches the profile photo and returns a folded PHOTO vCard line (or null if it can't be loaded).
        async function buildPhotoLine(url) {
            const res = await fetch(url);
            if (!res.ok) return null;
            const blob = await res.blob();
            const mime = blob.type || "image/png";
            const type = (mime.split("/")[1] || "png").toUpperCase();
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            if (!base64) return null;
            return foldVCardLine(`PHOTO;ENCODING=b;TYPE=${type}:${base64}`);
        }

        // vCard generation + download ("Save Contact")
        document.getElementById("save-contact-btn").addEventListener("click", async () => {
            const lines = [
                "BEGIN:VCARD",
                "VERSION:3.0",
                "N:Sheth;Adarsh;;;",
                "FN:Adarsh Sheth",
                "TITLE:Aerospace Engineer",
                "ORG:Texas A&M University",
                "EMAIL;TYPE=INTERNET:adarshsheth@tamu.edu",
                // "TEL;TYPE=CELL:+19257917096",
                "URL:https://adarshsheth.github.io",
                "URL:https://www.linkedin.com/in/adarsh-sheth/",
                "ADR;TYPE=WORK:;;College Station;TX;;;USA",
                "NOTE:Aerospace Engineering student focused on vertical flight, structural design, & systems integration.",
            ];
            

            try {
                const photoLine = await buildPhotoLine("media/logo/pfp.png");
                if (photoLine) lines.push(photoLine);
            } catch (e) {
                // Photo couldn't be fetched/embedded — fall back to a photo-less vCard.
            }

            lines.push("END:VCARD");
            const vcard = lines.join("\r\n");

            const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "adarsh-sheth.vcf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Contact saved!");
        });

        // Share card (native share sheet, falls back to clipboard copy)
        document.getElementById("share-btn").addEventListener("click", async () => {
            const shareData = {
                title: "Adarsh Sheth — Aerospace Engineer",
                text: "Here's my digital business card:",
                url: window.location.href,
            };
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (e) { }
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).catch(() => { });
                showToast("Link copied to clipboard!");
            }
        });

        // QR code — generated locally via the qrcode.js library (no external hotlink needed);
        // falls back to a QR image API only if the library fails to load.
        let qrGenerated = false;
        document.getElementById("qr-toggle").addEventListener("click", () => {
            const box = document.getElementById("qr-box");
            const toggle = document.getElementById("qr-toggle");
            const isOpen = box.classList.toggle("open");

            if (isOpen && !qrGenerated) {
                const target = document.getElementById("qr-render-target");
                const url = window.location.href;
                try {
                    if (typeof QRCode === "undefined") throw new Error("qrcode.js not available");
                    new QRCode(target, {
                        text: url,
                        width: 150,
                        height: 150,
                        // colorDark: "#000000",
                        colorDark: "#09253a",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.M,
                    });
                } catch (e) {
                    const img = document.createElement("img");
                    img.width = 150;
                    img.height = 150;
                    img.alt = "QR code linking to this contact card";
                    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
                    target.appendChild(img);
                }
                qrGenerated = true;
            }

            toggle.innerHTML = isOpen
                ? '<i class="fas fa-qrcode"></i> Hide QR Code'
                : '<i class="fas fa-qrcode"></i> Show QR Code';
        });
