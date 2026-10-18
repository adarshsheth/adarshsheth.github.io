/* ─────────────────────────────────────────────
   RESUME — page-specific scripts
   Consolidated Oct 2026 from inline <script> blocks.
   (Blocks concatenated in original document order.)
   ───────────────────────────────────────────── */

/* ── Block 1 ── */
// --- CONFIGURATION ---
        const PUBLIC_CONTACT_TEXT = "tx.ag/adarsh | linkedin.com/in/adarsh-sheth | Bay Area, CA & College Station, TX";
        const encryptedPayload = "U2FsdGVkX1/rgfZYEXp+DjhoPf1YrQGb1exHPcc7KgnN+uj2UiB6RkgJAtdew03WKC5fOYYiLl5Nx2eegSzI7vyLjhVmv/SUxaprEqjWstNhAs7LGD0AguvyHXBoDSMbuj/hGoLszZJVcqpM7miLFYD5gY1+yiGmdhylT/zqE8//B7ZGVjATSGI/wR/8QPjm3v7TwwtviRuFb8/qIkmMgGabmsL7KlWZv5GU1XOF4prsGvO4ntKHVpg5OrCqqzWzbbOJks8EfTA6JuwmCUpsGKSEaTTFQh4ECs8zN16/8qd5rcnKqGmhFHAj0f6JADLGeJb41y6yVqwjakFfs94zOyOYcbGFXsiL3v2Zd3yh/MQg5NIAMO7XZdt0xm7i+fr8";

        // --- SESSION STATE ---
        let isUnlocked = false;
        let privateData = null;
        let currentVisibility = 'public';
        let currentTabId = 'general';

        // --- TOGGLE LOGIC ---
        function handleVisibilityToggle(radio) {
            if (radio.value === 'private') {
                if (!isUnlocked) {
                    // Show login prompt, don't change state yet
                    document.getElementById('login-wrapper').style.display = 'flex';
                    document.getElementById('pw').focus();
                } else {
                    // Already unlocked, switch directly
                    currentVisibility = 'private';
                    updateToggleUI('private');
                    switchResume(currentTabId);
                }
            } else {
                currentVisibility = 'public';
                updateToggleUI('public');
                switchResume(currentTabId);
            }
        }

        function cancelUnlock() {
            document.getElementById('login-wrapper').style.display = 'none';
            // Revert radio button visually
            document.querySelector('input[value="public"]').checked = true;
            updateToggleUI('public');
        }

        function updateToggleUI(vis) {
            document.getElementById('label-public').classList.remove('active');
            document.getElementById('label-private').classList.remove('active');
            document.getElementById(`label-${vis}`).classList.add('active');
        }

        // --- DECRYPTION ---
        async function unlock() {
            const pw = document.getElementById('pw').value;
            const btn = document.getElementById('unlock-btn');
            const err = document.getElementById('error');

            try {
                btn.textContent = "UNLOCKING...";
                err.style.display = 'none';

                const bytes = CryptoJS.AES.decrypt(encryptedPayload, pw);
                const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
                if (!decryptedString) throw new Error("Decryption failed");

                privateData = JSON.parse(decryptedString);

                // Set Session Flags
                isUnlocked = true;
                currentVisibility = 'private';

                // Hide Modal & Update UI
                document.getElementById('login-wrapper').style.display = 'none';
                updateToggleUI('private');
                document.querySelector('input[value="private"]').checked = true;

                // Re-render the current tab privately
                await switchResume(currentTabId);

                // Cleanup prompt for next session
                btn.textContent = "Unlock Document";
                document.getElementById('pw').value = '';

            } catch (e) {
                err.style.display = 'block';
                btn.textContent = "Unlock Document";
            }
        }

        // --- RESUME SWITCHING ---
        async function switchResume(tabId) {
            const resume = masterResumeConfig.find(r => r.id === tabId);
            if (!resume || resume.status !== 'ready') return;

            currentTabId = tabId;

            // UI Updates
            document.querySelectorAll('.filter-btn, .sbn').forEach(el => el.classList.remove('active'));
            const tab = document.getElementById('tab-' + tabId);
            if (tab) tab.classList.add('active');
            const sbLink = document.querySelector(`.sbn[data-k="${tabId}"]`);
            if (sbLink) sbLink.classList.add('active');

            // Determine which file to pull based on toggle state
            if (currentVisibility === 'private') {
                currentDownloadName = `AdarshSheth_Resume${resume.fileSuffix}.pdf`;
                currentBasePdfUrl = resume.privatePath || resume.publicPath;
            } else {
                currentDownloadName = `Adarsh_Sheth_Resume${resume.fileSuffix}.pdf`;
                currentBasePdfUrl = resume.publicPath;
            }

            // Edge case: User is on Public toggle, but clicks a "Private Only" resume
            if (resume.isPrivateOnly && currentVisibility === 'public') {
                const container = document.getElementById('pdf-container');
                container.innerHTML = '<div style="padding: 50px 20px; text-align: center; color: var(--text);"><h3>This resume is only available in Private Mode.</h3></div>';
                return;
            }

            await generateAndRenderPDF();
        }

        // --- CLIENT-SIDE PDF GENERATION ---
        async function generateAndRenderPDF() {
            const container = document.getElementById('pdf-container');
            container.style.opacity = '0.3';

            try {
                const existingPdfBytes = await fetch(currentBasePdfUrl).then(res => res.arrayBuffer());
                const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
                const form = pdfDoc.getForm();

                try {
                    const contactField = form.getTextField('ContactField');
                    // Inject decrypted data if private, otherwise default public text
                    if (currentVisibility === 'private' && privateData) {
                        contactField.setText(privateData.contact);
                    } else {
                        contactField.setText(PUBLIC_CONTACT_TEXT);
                    }
                } catch (e) { }

                try {
                    const gpaField = form.getTextField('GPAField');
                    if (currentVisibility === 'private' && privateData && privateData.gpa) {
                        gpaField.setText(`, GPA: ${privateData.gpa}`);
                    } else {
                        gpaField.setText(''); // Ensure it's clear on public
                    }
                } catch (e) { }

                form.flatten();
                const pdfBytes = await pdfDoc.save();
                const blob = new Blob([pdfBytes], { type: 'application/pdf' });

                if (currentGeneratedBlobUrl) URL.revokeObjectURL(currentGeneratedBlobUrl);
                currentGeneratedBlobUrl = URL.createObjectURL(blob);

                const dlBtn = document.getElementById('floating-dl-btn');
                if (dlBtn) {
                    dlBtn.href = currentGeneratedBlobUrl;
                    dlBtn.download = currentDownloadName;
                }

                await renderPDF(currentGeneratedBlobUrl);
            } catch (err) {
                console.error("Error generating PDF:", err);
                container.style.opacity = '1';
            }
        }

        // --- INIT ---
        document.addEventListener("DOMContentLoaded", () => {
            buildResumeUI();
            switchResume('general');
        });
