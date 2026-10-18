/* ─────────────────────────────────────────────
   APP-HUB — page-specific scripts
   Consolidated Oct 2026 from inline <script> blocks.
   (Blocks concatenated in original document order.)
   ───────────────────────────────────────────── */

/* ── Block 1 ── */
// ── STATE VARIABLES ──
        let isUnlocked = false;
        let currentPassword = '';
        let currentVisibility = 'public';
        let globalRawData = [];

        // Evaluates if a string is standard AES encrypted Base64 ("Salted__")
        const isEncrypted = (str) => str.startsWith('U2FsdGVkX1');

        // ── TOGGLE & SECURITY LOGIC ──
        function handleVisibilityToggle(radio) {
            if (radio.value === 'private') {
                if (!isUnlocked) {
                    document.getElementById('login-wrapper').style.display = 'flex';
                    document.getElementById('pw').focus();
                } else {
                    currentVisibility = 'private';
                    updateToggleUI('private');
                    renderHub();
                }
            } else {
                currentVisibility = 'public';
                updateToggleUI('public');
                renderHub();
            }
        }

        function cancelUnlock() {
            document.getElementById('login-wrapper').style.display = 'none';
            document.querySelector('input[value="public"]').checked = true;
            updateToggleUI('public');
            document.getElementById('error').style.display = 'none';
        }

        function updateToggleUI(vis) {
            document.getElementById('label-public').classList.remove('active');
            document.getElementById('label-private').classList.remove('active');
            document.getElementById(`label-${vis}`).classList.add('active');
        }

        function unlock() {
            const pwInput = document.getElementById('pw').value;
            const btn = document.getElementById('unlock-btn');
            const err = document.getElementById('error');

            btn.textContent = "UNLOCKING...";
            err.style.display = 'none';

            // Locate the first encrypted string anywhere to test the password
            const testString = globalRawData.flatMap(e => e.variations).find(v => isEncrypted(v));

            if (testString) {
                try {
                    const bytes = CryptoJS.AES.decrypt(testString, pwInput);
                    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                    if (!decrypted) throw new Error("Decryption failed");
                } catch (e) {
                    err.style.display = 'block';
                    btn.textContent = "Unlock Items";
                    return;
                }
            }

            isUnlocked = true;
            currentPassword = pwInput;
            currentVisibility = 'private';

            document.getElementById('login-wrapper').style.display = 'none';
            updateToggleUI('private');
            document.querySelector('input[value="private"]').checked = true;

            btn.textContent = "Unlock Items";
            document.getElementById('pw').value = '';

            renderHub();
        }

        // ── HOVER SUPPRESSION ──
        document.addEventListener('keydown', () => {
            document.body.classList.add('suppress-mouse-hover');
        });

        document.addEventListener('mousemove', () => {
            if (document.body.classList.contains('suppress-mouse-hover')) {
                document.body.classList.remove('suppress-mouse-hover');
            }
        });

        // ── HYBRID COPY UTILITY ──
        function hybridCopy(textToCopy) {
            return new Promise((resolve, reject) => {
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(textToCopy).then(resolve).catch((err) => {
                        fallbackCopy(textToCopy) ? resolve() : reject(new Error('Fallback copy failed'));
                    });
                } else {
                    fallbackCopy(textToCopy) ? resolve() : reject(new Error('Fallback copy failed'));
                }
            });
        }

        function fallbackCopy(text) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }

        // ── MAIN INITIALIZATION ──
        document.addEventListener("DOMContentLoaded", async () => {
            const container = document.getElementById('hub-container');

            try {
                const response = await fetch('data/app-data.csv');
                const csvText = await response.text();

                const parseCSV = (text) => {
                    const entries = [];
                    let parts = [];
                    let currentPart = '';
                    let inQuotes = false;

                    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];

                        if (char === '"') {
                            if (inQuotes && text[i + 1] === '"') {
                                currentPart += '"';
                                i++;
                            } else {
                                inQuotes = !inQuotes;
                            }
                        } else if (char === ',' && !inQuotes) {
                            parts.push(currentPart.trim());
                            currentPart = '';
                        } else if (char === '\n' && !inQuotes) {
                            parts.push(currentPart.trim());

                            if (parts.length >= 2 && parts[0] !== 'Section' && parts[0] !== '') {
                                const section = parts[0] || 'General';
                                const title = parts[1] || '';

                                const variations = parts.slice(2, 7).filter(v =>
                                    v.length > 0 && v.toUpperCase() !== 'TRUE' && v.toUpperCase() !== 'FALSE'
                                );

                                if (title && variations.length > 0) {
                                    entries.push({ section, title, variations });
                                }
                            }

                            parts = [];
                            currentPart = '';
                        } else {
                            currentPart += char;
                        }
                    }

                    if (parts.length > 0 || currentPart.length > 0) {
                        parts.push(currentPart.trim());
                        if (parts.length >= 2 && parts[0] !== 'Section' && parts[0] !== '') {
                            const section = parts[0] || 'General';
                            const title = parts[1] || '';
                            const variations = parts.slice(2, 7).filter(v =>
                                v.length > 0 && v.toUpperCase() !== 'TRUE' && v.toUpperCase() !== 'FALSE'
                            );
                            if (title && variations.length > 0) {
                                entries.push({ section, title, variations });
                            }
                        }
                    }

                    return entries;
                };

                globalRawData = parseCSV(csvText);
                renderHub();

            } catch (error) {
                console.error('Error loading hub CSV data:', error);
                container.innerHTML = '<div style="padding: 20px; color: #ff6b6b;">Failed to load application hub data. Make sure app-data.csv is present and correctly formatted.</div>';
            }
        });

        // ── DYNAMIC RENDERING ──
        function renderHub() {
            const container = document.getElementById('hub-container');
            container.innerHTML = '';

            const sectionsMap = {};
            globalRawData.forEach((entry, index) => {
                if (!sectionsMap[entry.section]) {
                    sectionsMap[entry.section] = [];
                }
                sectionsMap[entry.section].push({ ...entry, globalIndex: index });
            });

            Object.keys(sectionsMap).forEach(sectionName => {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'hub-section';

                const titleEl = document.createElement('div');
                titleEl.className = 'hub-section-title';
                titleEl.textContent = sectionName;
                sectionDiv.appendChild(titleEl);

                const gridEl = document.createElement('div');
                gridEl.className = 'hub-section-grid';

                const allShort = sectionsMap[sectionName].every(item => {
                    const totalLen = item.variations.reduce((acc, v) => acc + (isEncrypted(v) ? 8 : v.length), 0);
                    return totalLen < 45;
                });

                if (allShort && sectionsMap[sectionName].length > 1) {
                    gridEl.classList.add('is-short-grid');
                }

                sectionsMap[sectionName].forEach((entry) => {
                    const index = entry.globalIndex;
                    let displayLabel;
                    let badgeClass = '';

                    // Exclusively support A-Z across the board
                    if (index >= 0 && index <= 25) {
                        displayLabel = String.fromCharCode(97 + index); // a-z
                        badgeClass = ' is-letter';
                    } else {
                        displayLabel = '<i class="fas fa-copy"></i>';
                        badgeClass = ' is-icon';
                    }

                    const row = document.createElement('div');
                    row.className = 'hub-row';
                    if (entry.section.toLowerCase() === 'downloads') {
                        row.dataset.download = 'true';
                    }

                    let defaultCopyVal = '';
                    let firstUnlockedIdx = -1;

                    const variantsData = entry.variations.map((v, vIdx) => {
                        let displayVal = v;
                        let copyVal = v;
                        let isLocked = false;

                        if (row.dataset.download === 'true' && currentVisibility === 'public') {
                            displayVal = '••••••••';
                            copyVal = '';
                            isLocked = true;
                        } else if (isEncrypted(v)) {
                            if (currentVisibility === 'public') {
                                displayVal = '••••••••';
                                copyVal = '';
                                isLocked = true;
                            } else {
                                try {
                                    const bytes = CryptoJS.AES.decrypt(v, currentPassword);
                                    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                                    if (!decrypted) throw new Error("Bad Decryption");
                                    copyVal = decrypted;
                                    displayVal = decrypted;
                                } catch (e) {
                                    displayVal = 'ERROR';
                                    copyVal = '';
                                    isLocked = true;
                                }
                            }
                        }

                        if (row.dataset.download === 'true' && !isLocked) {
                            displayVal = 'Download';
                        }

                        // Remove actual literal newlines from the visually displayed UI pill
                        displayVal = displayVal.replace(/\n/g, '  ');

                        if (!isLocked && firstUnlockedIdx === -1) {
                            firstUnlockedIdx = vIdx;
                            defaultCopyVal = copyVal;
                        }

                        return { displayVal, copyVal, isLocked, vIdx };
                    });

                    if (firstUnlockedIdx === -1) {
                        row.classList.add('is-fully-locked');
                    } else {
                        row.setAttribute('tabindex', '0');
                        row.setAttribute('data-clipboard', defaultCopyVal);
                    }

                    const variantsHtml = variantsData.map((data) => {
                        const activeClass = data.vIdx === firstUnlockedIdx ? ' is-active-variant' : '';
                        const lockedClass = data.isLocked ? ' is-locked-variant' : '';

                        // HTML-safe string for the title tooltip attribute
                        const safeTitle = data.displayVal.replace(/"/g, '&quot;');
                        const downloadIcon = row.dataset.download === 'true' && !data.isLocked
                            ? '<i class="fas fa-file-arrow-down" aria-hidden="true"></i> '
                            : '';

                        return `<span class="hub-variant${activeClass}${lockedClass}" data-val="${encodeURIComponent(data.copyVal)}" title="${safeTitle}">${downloadIcon}${data.displayVal}</span>`;
                    }).join('');

                    row.innerHTML = `
                        <div class="hub-num${badgeClass}">${displayLabel}</div>
                        <div class="hub-title-col">${entry.title}</div>
                        <div class="hub-content-col">${variantsHtml}</div>
                    `;

                    gridEl.appendChild(row);
                });

                sectionDiv.appendChild(gridEl);
                container.appendChild(sectionDiv);
            });

            document.querySelectorAll('.hub-row').forEach(row => {
                const contentCol = row.querySelector('.hub-content-col');
                if (contentCol && contentCol.offsetHeight > 30) {
                    row.classList.add('is-two-line');
                }
            });

            initCopyFunctionality();
        }

        // ── COPY BINDINGS & KEYBOARD LOGIC ──
        function initCopyFunctionality() {
            const toast = document.getElementById('copy-toast');
            let toastTimeout;

            window.onblur = () => resetActiveShortcut();
            document.onkeydown = handleGlobalKeydown;
            document.onkeyup = handleGlobalKeyup;

            let activeShortcutRow = null;
            let activeShortcutKey = null;
            let activeShortcutNumberPressed = false; // <-- ADD THIS

            function resetActiveShortcut() {
                if (activeShortcutRow) {
                    activeShortcutRow.classList.remove('is-shortcut-active');
                }
                activeShortcutKey = null;
                activeShortcutRow = null;
                activeShortcutNumberPressed = false; // <-- ADD THIS
            }

            function handleGlobalKeydown(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                const char = e.key.toLowerCase();

                // 1) If user is already holding a letter and presses 1, 2, 3, 4, or 5
                if (activeShortcutRow && ['1', '2', '3', '4', '5'].includes(char)) {
                    e.preventDefault();
                    activeShortcutNumberPressed = true; // <-- ADD THIS FLAG

                    const variantIdx = parseInt(char) - 1;
                    const variants = Array.from(activeShortcutRow.querySelectorAll('.hub-variant'));

                    if (variants[variantIdx] && !variants[variantIdx].classList.contains('is-locked-variant')) {
                        variants.forEach(v => v.classList.remove('is-active-variant'));
                        variants[variantIdx].classList.add('is-active-variant');
                        activeShortcutRow.setAttribute('data-clipboard', decodeURIComponent(variants[variantIdx].getAttribute('data-val')));
                    }
                    return;
                }

                // 2) If the user presses a new A-Z letter, lock it in
                if (!activeShortcutKey && char.length === 1 && char >= 'a' && char <= 'z') {
                    const rowIndex = char.charCodeAt(0) - 97; // a maps to 0
                    const activeRows = document.querySelectorAll('.hub-row');

                    if (activeRows[rowIndex] && !activeRows[rowIndex].classList.contains('is-fully-locked')) {
                        e.preventDefault();

                        // FIX: Remove DOM focus from any previously clicked row 
                        // to prevent dual-highlighting when a keybind is used.
                        if (document.activeElement) {
                            document.activeElement.blur();
                        }

                        activeShortcutKey = char;
                        activeShortcutRow = activeRows[rowIndex];

                        activeShortcutRow.classList.add('is-shortcut-active');
                    }
                }
            }

            function handleGlobalKeyup(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                const char = e.key.toLowerCase();

                // 3) Trigger copy instantly upon releasing the held letter
                if (char === activeShortcutKey && activeShortcutRow) {
                    let textToCopy = activeShortcutRow.getAttribute('data-clipboard');

                    // If no number was pressed, strictly force the first unlocked variant 
                    // bypassing any accidental mouse hover interference.
                    if (!activeShortcutNumberPressed) {
                        const variants = Array.from(activeShortcutRow.querySelectorAll('.hub-variant'));
                        const firstUnlocked = variants.find(v => !v.classList.contains('is-locked-variant'));
                        if (firstUnlocked) {
                            textToCopy = decodeURIComponent(firstUnlocked.getAttribute('data-val'));
                        }
                    }

                    triggerCopy(textToCopy, activeShortcutRow);
                    resetActiveShortcut();
                }
            }

            const triggerCopy = (textToCopy, rowElement) => {
                if (!textToCopy) return;

                if (rowElement && rowElement.dataset.download === 'true') {
                    const link = document.createElement('a');
                    link.href = textToCopy;
                    link.download = textToCopy.split('/').pop();
                    document.body.appendChild(link);
                    link.click();
                    link.remove();

                    toast.textContent = 'DOWNLOADING...';
                    toast.classList.add('show');
                    clearTimeout(toastTimeout);
                    toastTimeout = setTimeout(() => {
                        toast.classList.remove('show');
                    }, 2000);
                    return;
                }

                hybridCopy(textToCopy).then(() => {
                    let toastMessage = "COPIED TO CLIPBOARD!";

                    if (rowElement) {
                        rowElement.classList.add('copied-state');

                        const allVariants = Array.from(rowElement.querySelectorAll('.hub-variant'));
                        const variantEl = allVariants.find(v => decodeURIComponent(v.getAttribute('data-val')) === textToCopy);

                        if (variantEl) {
                            variantEl.classList.add('copied-variant-state');

                            // Grab the row letter and calculate the 1-based variant index
                            const numEl = rowElement.querySelector('.hub-num');
                            const rowLabel = numEl ? numEl.textContent.trim().toUpperCase() : '';

                            if (rowLabel) {
                                const variantNum = allVariants.indexOf(variantEl) + 1;
                                toastMessage = `COPIED ${rowLabel}${variantNum}!`;
                            }
                        }

                        if (rowElement.flashTimeout) clearTimeout(rowElement.flashTimeout);
                        rowElement.flashTimeout = setTimeout(() => {
                            rowElement.classList.remove('copied-state');
                            if (variantEl) variantEl.classList.remove('copied-variant-state');
                        }, 150);
                    }

                    // Inject the dynamic message into the toast element
                    toast.textContent = toastMessage;
                    toast.classList.add('show');

                    clearTimeout(toastTimeout);
                    toastTimeout = setTimeout(() => {
                        toast.classList.remove('show');
                    }, 2000);
                }).catch(err => console.error('All copy methods failed: ', err));
            };

            const copyRows = document.querySelectorAll('.hub-row:not(.is-fully-locked)');
            copyRows.forEach(row => {
                const allVariants = Array.from(row.querySelectorAll('.hub-variant'));
                const focusableVariants = allVariants.filter(v => !v.classList.contains('is-locked-variant'));

                if (focusableVariants.length === 0) return;

                row.addEventListener('mousemove', (e) => {
                    if (!e.target.classList.contains('hub-variant')) {
                        if (!focusableVariants[0].classList.contains('is-active-variant')) {
                            focusableVariants.forEach(v => v.classList.remove('is-active-variant'));
                            focusableVariants[0].classList.add('is-active-variant');
                            row.setAttribute('data-clipboard', decodeURIComponent(focusableVariants[0].getAttribute('data-val')));
                        }
                    }
                });

                focusableVariants.forEach(variant => {
                    variant.addEventListener('mouseenter', () => {
                        focusableVariants.forEach(v => v.classList.remove('is-active-variant'));
                        variant.classList.add('is-active-variant');
                        row.setAttribute('data-clipboard', decodeURIComponent(variant.getAttribute('data-val')));
                    });

                    variant.addEventListener('touchstart', () => {
                        focusableVariants.forEach(v => v.classList.remove('is-active-variant'));
                        variant.classList.add('is-active-variant');
                        row.setAttribute('data-clipboard', decodeURIComponent(variant.getAttribute('data-val')));
                    }, { passive: true });

                    variant.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const val = decodeURIComponent(variant.getAttribute('data-val'));
                        triggerCopy(val, row);
                    });
                });

                row.addEventListener('click', () => {
                    triggerCopy(row.getAttribute('data-clipboard'), row);
                });

                row.addEventListener('keydown', (e) => {
                    let activeIdx = focusableVariants.findIndex(v => v.classList.contains('is-active-variant'));

                    if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        if (activeIdx < focusableVariants.length - 1) {
                            focusableVariants[activeIdx].classList.remove('is-active-variant');
                            focusableVariants[activeIdx + 1].classList.add('is-active-variant');
                            row.setAttribute('data-clipboard', decodeURIComponent(focusableVariants[activeIdx + 1].getAttribute('data-val')));
                        }
                    } else if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        if (activeIdx > 0) {
                            focusableVariants[activeIdx].classList.remove('is-active-variant');
                            focusableVariants[activeIdx - 1].classList.add('is-active-variant');
                            row.setAttribute('data-clipboard', decodeURIComponent(focusableVariants[activeIdx - 1].getAttribute('data-val')));
                        }
                    } else if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        triggerCopy(row.getAttribute('data-clipboard'), row);
                    }
                });
            });
        }








        async function loadHubSkills() {
            const catMap = {
                tools: "Tools", des: "Design", sys: "Systems / Methodologies",
                hw: "Hardware", swe: "Software Engineering", soft: "Soft Skills", gen: "General", misc: "Miscellaneous"
            };

            // 1. Fetch and Parse Portfolio HTML Skills
            try {
                const portRes = await fetch("portfolio.html");
                const portHtml = await portRes.text();
                const doc = new DOMParser().parseFromString(portHtml, "text/html");
                const portSkills = {};

                doc.querySelectorAll(".ec-summary .badge").forEach((badge) => {
                    const cat = badge.dataset.cat || "misc";
                    if (!portSkills[cat]) portSkills[cat] = new Set();
                    portSkills[cat].add(badge.textContent.trim());
                });

                renderSkillBoxes(portSkills, "portfolio-skills-container", catMap);
            } catch (e) { console.error("Portfolio skills fetch failed", e); }

            // 2. Fetch and Parse CSV Skills
            try {
                const csvRes = await fetch("data/skills-data.csv");
                const csvText = await csvRes.text();
                const csvSkills = {};

                csvText.split('\n').forEach(line => {
                    const parts = line.split(',');
                    if (parts.length >= 2) {
                        const catName = parts[0].trim();
                        // Join the rest back together in case a skill has a comma, and strip basic quotes
                        const skill = parts.slice(1).join(',').trim().replace(/(^"|"$)/g, '');
                        if (catName && skill && catName !== 'Category') {
                            if (!csvSkills[catName]) csvSkills[catName] = new Set();
                            csvSkills[catName].add(skill);
                        }
                    }
                });

                renderSkillBoxes(csvSkills, "csv-skills-container", null);
            } catch (e) { console.error("CSV skills fetch failed", e); }

            // 3a. Bind Click-to-Copy to individual skill variants
            document.querySelectorAll('#csv-skills-container .hub-variant, #portfolio-skills-container .hub-variant').forEach(variant => {
                variant.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevents the row click listener from firing
                    const textToCopy = decodeURIComponent(variant.getAttribute('data-val'));

                    hybridCopy(textToCopy).then(() => {
                        const toast = document.getElementById('copy-toast');
                        toast.textContent = `COPIED "${textToCopy.toUpperCase()}"!`;
                        toast.classList.add('show');

                        variant.classList.add('copied-variant-state');
                        const row = variant.closest('.hub-row');
                        if (row) row.classList.add('copied-state');

                        setTimeout(() => {
                            variant.classList.remove('copied-variant-state');
                            if (row) row.classList.remove('copied-state');
                        }, 150);

                        setTimeout(() => toast.classList.remove('show'), 2000);
                    });
                });
            });

            // 3b. Bind Click-to-Copy to the entire category row
            document.querySelectorAll('#csv-skills-container .hub-row.is-stacked, #portfolio-skills-container .hub-row.is-stacked').forEach(row => {
                row.addEventListener('click', () => {
                    const textToCopy = decodeURIComponent(row.getAttribute('data-clipboard'));
                    const titleEl = row.querySelector('.hub-title-col');
                    const categoryName = titleEl ? titleEl.textContent.trim().toUpperCase() : 'CATEGORY';

                    hybridCopy(textToCopy).then(() => {
                        const toast = document.getElementById('copy-toast');
                        toast.textContent = `COPIED ALL ${categoryName} SKILLS!`;
                        toast.classList.add('show');

                        // Visual flash for the row and all variants inside it simultaneously
                        row.classList.add('copied-state');
                        row.querySelectorAll('.hub-variant').forEach(v => v.classList.add('copied-variant-state'));

                        setTimeout(() => {
                            row.classList.remove('copied-state');
                            row.querySelectorAll('.hub-variant').forEach(v => v.classList.remove('copied-variant-state'));
                        }, 150);

                        setTimeout(() => toast.classList.remove('show'), 2000);
                    });
                });
            });
        }

        function renderSkillBoxes(dataObj, containerId, categoryMap) {
            const container = document.getElementById(containerId);
            if (!container) return;

            // Uses the central app hub grid (2-columns on desktop, 1 on mobile)
            let html = '<div class="hub-section-grid is-short-grid">';
            for (const [catKey, skillSet] of Object.entries(dataObj)) {
                const displayTitle = categoryMap && categoryMap[catKey] ? categoryMap[catKey] : catKey;
                const sortedSkills = Array.from(skillSet).sort();
                
                // Create the comma-separated string for the row copy
                const fullListStr = sortedSkills.join(', ');

                const badgesHtml = sortedSkills
                    .map(s => {
                        const safeTitle = s.replace(/"/g, '&quot;');
                        return `<span class="hub-variant" data-val="${encodeURIComponent(s)}" title="${safeTitle}">${s}</span>`;
                    })
                    .join('');

                html += `
                <div class="hub-row is-stacked" tabindex="0" data-clipboard="${encodeURIComponent(fullListStr)}">
                    <div class="hub-title-wrap">
                        <div class="hub-num is-icon"><i class="fas fa-layer-group"></i></div>
                        <div class="hub-title-col">${displayTitle}</div>
                    </div>
                    <div class="hub-content-col">${badgesHtml}</div>
                </div>
                `;
            }
            html += '</div>';
            container.innerHTML = html;
        }

        // Ensure this runs after the main DOM is ready
        document.addEventListener("DOMContentLoaded", loadHubSkills);
