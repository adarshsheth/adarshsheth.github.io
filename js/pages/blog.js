/* ─────────────────────────────────────────────
   BLOG — page-specific scripts
   Consolidated Oct 2026 from inline <script> blocks.
   (Blocks concatenated in original document order.)
   ───────────────────────────────────────────── */

/* ── Block 1 ── */
// Instantly inject the nav from cache to prevent UI flashing
        const cachedNav = sessionStorage.getItem("rawNavHTML");
        if (cachedNav) {
            // 1. Inject the cached HTML
            document.getElementById("nav-placeholder").outerHTML = cachedNav;

            // 2. Instantly fix the active states before the browser paints
            const currentPath = window.location.pathname.toLowerCase();
            const isPortfolioPath = currentPath.includes("portfolio") || currentPath.includes("photography");
            const isHomePath = currentPath.endsWith("/") || currentPath.includes("index") || currentPath.endsWith("site");

            const header = document.getElementById("hdr");
            if (header) {
                header.querySelectorAll(".ni").forEach(link => {
                    link.classList.remove("active"); // Strip the cached "ghost" state

                    // Apply the correct state for the current page
                    const text = link.textContent.trim().toLowerCase();
                    if (currentPath.includes("blog") && text === "blog") link.classList.add("active");
                    else if (currentPath.includes("resume") && text === "resume") link.classList.add("active");
                    else if (isPortfolioPath && text.includes("portfolio")) link.classList.add("active");
                    else if (isHomePath && text === "home") link.classList.add("active");
                });
            }
        }

/* ── Block 2 ── */
// Add this helper function
        async function navigateToPost(slug, pushState = true) {
            if (!slug || isPostTransitioning || slug === activePostSlug) return;

            isPostTransitioning = true;

            const sbNav = document.getElementById('sb-nav');

            postEl.classList.add('loading');
            sbNav?.classList.add('loading');

            await new Promise(resolve => setTimeout(resolve, 180));

            if (pushState) {
                window.history.pushState({ post: slug }, '', `?post=${slug}`);
            }

            window.scrollTo({ top: 0, behavior: 'instant' });

            await renderPost(slug);

            requestAnimationFrame(() => {
                postEl.classList.remove('loading');
                sbNav?.classList.remove('loading');

                isPostTransitioning = false;
            });
        }

        // Handle Browser Back/Forward buttons
        window.onpopstate = async function () {
            const slug = new URLSearchParams(window.location.search).get('post');

            if (slug) {
                await navigateToPost(slug, false);
            } else {
                window.location.href = 'blog';
            }
        };

        const urlParams = new URLSearchParams(window.location.search);
        const postSlug = urlParams.get('post');
        const URLFilter = urlParams.get('category');

        const listEl = document.getElementById('blog-list');
        const postEl = document.getElementById('blog-post');
        const loader = document.getElementById('blog-loading');

        let BLOG_POSTS = [];
        let activePostSlug = postSlug;
        let isPostTransitioning = false;

        // if (postSlug) {
        //     document.getElementById('ibar').style.display = 'none';
        //     window.isViewingDynamicPost = true;
        // }
        if (postSlug) {
            const ibar = document.getElementById('ibar');
            if (ibar) {
                ibar.style.display = 'none';
            }
            window.isViewingDynamicPost = true;
        }

        function generateBlogSidebar() {
            const sbNav = document.getElementById('sb-nav');
            if (!sbNav) return;

            const hElements = [...document.querySelectorAll('#post-body h2, #post-body h3')];
            const hasH2 = document.querySelector('#post-body h2') !== null;

            if (!activePostSlug || hElements.length === 0) {
                sbNav.innerHTML = `
            <a class="sbn active" href="?" data-k="top">
                <span class="sbdot"></span>
                <span class="sblbl">Articles</span>
            </a>
        `;
                return;
            }

            let sidebarHtml = '';
            let openSubnav = false;
            let openGroup = false;

            hElements.forEach((heading, index) => {
                const id = heading.id || `heading-${index}`;
                heading.id = id;

                const isH3 = heading.tagName.toLowerCase() === 'h3';
                const isSub = isH3 && hasH2;

                const text = heading.innerText
                    .replace(/[/*_#~`➤]/g, '')
                    .replace(/^[-\s•]+/, '')
                    .trim();

                if (isSub) {
                    if (!openSubnav) {
                        if (!openGroup) {
                            sidebarHtml += '<div class="sb-group">';
                            openGroup = true;
                        }
                        sidebarHtml += '<div class="sb-subnav">';
                        openSubnav = true;
                    }

                    sidebarHtml += `
        <a class="sbn sbn-sub"
           href="#${id}"
           id="nav-link-${id}"
           onclick="window._lockNav();">
            <span class="sblbl">${text}</span>
        </a>
    `;
                } else {
                    if (openSubnav) {
                        sidebarHtml += '</div></div>';
                        openSubnav = false;
                        openGroup = false;
                    }

                    if (openGroup) {
                        sidebarHtml += '</div>';
                        openGroup = false;
                    }

                    sidebarHtml += `
    <div class="sb-group">
        <a class="sbn sbn-article"
           href="#${id}"
           id="nav-link-${id}"
           onclick="window._lockNav();">
            <span class="sbdot"></span>
            <span class="sblbl">${text}</span>
        </a>
    `;
                    openGroup = true;
                }
            });

            if (openSubnav) {
                sidebarHtml += '</div></div>';
            } else if (openGroup) {
                sidebarHtml += '</div>';
            }

            //     sbNav.innerHTML = `
            // <a class="sbn" href="?">
            //     <span class="sbdot" style="background: var(--blogAlt);"></span>
            //     <span class="sblbl" style="color: var(--blogAlt);">Back to Feed</span>
            // </a>


            //         sbNav.innerHTML = `
            //     <a class="sbn" href="?">
            //         <span class="sblbl" style="color: var(--blogAlt); font-weight: 700; margin-bottom: -5px;">Back to Feed</span>
            //     </a>
            //     <div style="height:2px;background:color-mix(in srgb, var(--border) 50%, transparent);margin:10px 14px;"></div>
            //     ${sidebarHtml}
            // `;
            sbNav.innerHTML = `
                <a class="sbn" href="?">
                    <span class="sblbl" style="background: var(--blogAlt); padding: 4px 13px 3px; border-radius: 100px; color: var(--bg); font-weight: 700; margin-bottom: 5px;">Back to Feed</span>
                </a>
                
                ${sidebarHtml}
            `;


            initBlogScrollSpy();
        }

        /* --- OPTIMIZATION 2: Eliminated Layout Thrashing --- */
        function initBlogScrollSpy() {
            const subLinks = document.querySelectorAll('.sbn-article, .sbn-sub');
            const headers = Array.from(document.querySelectorAll('#post-body h2, #post-body h3'));
            if (!headers.length) return;

            // We store the status of every header
            const visibleHeaders = new Set();

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        visibleHeaders.add(entry.target.id);
                    } else {
                        visibleHeaders.delete(entry.target.id);
                    }
                });

                // Identify the top-most visible header by checking DOM order
                let activeId = null;
                for (const header of headers) {
                    if (visibleHeaders.has(header.id)) {
                        activeId = header.id;
                        break; // Stop at the first (highest) one found
                    }
                }

                // Apply the 'active' state only to the winning ID
                if (activeId) {
                    subLinks.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
                    });
                }
            }, {
                // Tighten the trigger area so fewer headers are "active" at once
                rootMargin: '-50px 0px -85% 0px',
                threshold: 0
            });

            headers.forEach(header => observer.observe(header));
        }
        // /* --- OPTIMIZATION 1: Smart Session Cache --- */
        // async function fetchBlogData() {
        //     const cacheKey = 'blogDataCache';
        //     const cacheTimeKey = 'blogDataCacheTime';
        //     const cacheTTL = 15 * 60 * 1000; // 15 minutes

        //     const cached = sessionStorage.getItem(cacheKey);
        //     const cacheTime = sessionStorage.getItem(cacheTimeKey);

        //     // Serve instantly from cache if within TTL
        //     if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < cacheTTL) {
        //         return JSON.parse(cached);
        //     }

        //     // Standard fetch allows Github Pages CDN / ETag to operate naturally
        //     const response = await fetch('data/blog-data.json');
        //     if (!response.ok) throw new Error("Transmission ledger payload unreadable.");
        //     const data = await response.json();

        //     try {
        //         sessionStorage.setItem(cacheKey, JSON.stringify(data));
        //         sessionStorage.setItem(cacheTimeKey, Date.now().toString());
        //     } catch (e) {
        //         console.warn('Session storage quota exceeded, skipping local cache.');
        //     }

        //     return data;
        // }
        async function fetchBlogData() {
            const cacheKey = 'blogDataCache';
            const cacheTimeKey = 'blogDataCacheTime';

            const cached = sessionStorage.getItem(cacheKey);
            const cacheTime = sessionStorage.getItem(cacheTimeKey);

            // 1. If we have a cache, return it instantly to load the page with zero delay
            if (cached) {
                // Background revalidation: Check if a newer version exists on the server
                fetch('data/blog-data.json', { cache: 'no-cache' })
                    .then(res => res.json())
                    .then(freshData => {
                        const freshString = JSON.stringify(freshData);
                        // If the server data is different from what's in cache, update storage and reload the view
                        if (freshString !== cached) {
                            sessionStorage.setItem(cacheKey, freshString);
                            sessionStorage.setItem(cacheTimeKey, Date.now().toString());
                            console.log("Transmission updated in background. Refreshing view...");

                            // Automatically re-initialize the blog feed/post with the fresh data
                            BLOG_POSTS = freshData.data?.publication?.posts?.edges || [];
                            if (window.isViewingDynamicPost && activePostSlug) {
                                renderPost(activePostSlug);
                            } else if (typeof renderFeed === 'function') {
                                renderFeed("DEFAULT");
                            }
                        }
                    })
                    .catch(err => console.log("Background sync check skipped:", err));

                return JSON.parse(cached);
            }

            // 2. Fallback: If no cache exists at all, fetch normally
            const response = await fetch('data/blog-data.json', { cache: 'no-cache' });
            if (!response.ok) throw new Error("Transmission ledger payload unreadable.");
            const data = await response.json();

            try {
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                sessionStorage.setItem(cacheTimeKey, Date.now().toString());
            } catch (e) {
                console.warn('Session storage quota exceeded.');
            }

            return data;
        }


        async function renderPost(slug) {
            activePostSlug = slug;

            const postNode = BLOG_POSTS.find(edge => edge.node.slug === slug);

            if (!postNode) {
                throw new Error('Target transmission vector hash missing.');
            }

            const post = postNode.node;

            // document.getElementById('ibar').style.display = 'none';
            const ibar = document.getElementById('ibar');
            if (ibar) {
                ibar.style.display = 'none';
            }

            listEl.style.display = 'none';
            document.getElementById('blog-filters').style.display = 'none';

            postEl.style.display = 'block';

            window.isViewingDynamicPost = true;

            const coverWrap = document.getElementById('post-cover-wrap');
            const coverImg = document.getElementById('post-cover-img');

            if (post.coverImage?.url) {
                coverWrap.style.display = 'block';
                coverImg.src = post.coverImage.url;

                coverWrap.style.animation = 'none'; // Stop the current animation
                void coverWrap.offsetWidth;         // Force a DOM reflow (the browser re-calculates the style)
                coverWrap.style.animation = 'fadeIn 0.67s ease-in forwards'; // Re-apply the animation
            } else {
                coverWrap.style.display = 'none';
            }

            preloadAdjacentImages(slug);

            const currentIndex = BLOG_POSTS.findIndex(edge => edge.node.slug === slug);

            const prevPost = currentIndex > 0
                ? BLOG_POSTS[currentIndex - 1].node
                : null;

            const nextPost = currentIndex < BLOG_POSTS.length - 1
                ? BLOG_POSTS[currentIndex + 1].node
                : null;

            document.getElementById('post-nav-arrows').innerHTML = `
        <button
            class="post-arrow-btn ${!prevPost ? 'disabled' : ''}"
            ${prevPost ? `onclick="navigateToPost('${prevPost.slug}')"` : ''}
            title="${prevPost ? `Previous: ${prevPost.title}` : ''}">
            <i class="fas fa-chevron-left"></i>
        </button>

        <button
            class="post-arrow-btn ${!nextPost ? 'disabled' : ''}"
            ${nextPost ? `onclick="navigateToPost('${nextPost.slug}')"` : ''}
            title="${nextPost ? `Next: ${nextPost.title}` : ''}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

            document.getElementById('post-title').innerText = post.title;

            const hasGptTag = (post.tags || []).some(tag => tag.name === 'ChatGPT');

            document.getElementById('post-author').innerText = hasGptTag
                ? 'ChatGPT'
                : 'Adarsh Sheth';

            const textContent = post.content?.html.replace(/<[^>]*>?/gm, '') || '';
            const wordCount = textContent.split(/\s+/).length;
            const readingTime = Math.max(1, Math.ceil(wordCount / 200));

            const tagsHtml = (post.tags || [])
                .map(tag => `
            <a href="?category=${encodeURIComponent(tag.name.toLowerCase())}"
               class="article-tag-link">${tag.name}</a>
        `)
                .join('');

            const dateStr = new Date(post.publishedAt).toLocaleDateString(
                'en-US',
                {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }
            );

            document.getElementById('post-meta').innerHTML = `
        ${tagsHtml}
        <span>${dateStr}</span>
        <span>
            <i class="far fa-clock" style="font-size:11px;"></i>
            ${readingTime} min read
        </span>
    `;

            document.getElementById('post-body').innerHTML = post.content?.html || '';

            document.title = `${post.title} // Blog • Adarsh Sheth`;

            // --- NEW: SIMILAR ARTICLES LOGIC ---
            const currentTags = post.tags ? post.tags.map(t => t.name) : [];

            // 1. Try to find posts that share at least one tag
            let similarPosts = BLOG_POSTS.filter(edge => {
                if (edge.node.slug === slug) return false;
                const edgeTags = edge.node.tags ? edge.node.tags.map(t => t.name) : [];
                return edgeTags.some(t => currentTags.includes(t));
            });

            // 2. Fallback: If no similar tags exist, grab random articles
            if (similarPosts.length === 0) {
                let availablePosts = BLOG_POSTS.filter(edge => edge.node.slug !== slug);
                // Shuffle the available posts randomly
                similarPosts = availablePosts.sort(() => 0.5 - Math.random());
            }

            // 3. Limit to 4 articles for a clean 2x2 grid
            similarPosts = similarPosts.slice(0, 4);

            const similarContainer = document.getElementById('similar-articles-container');
            const similarGrid = document.getElementById('similar-articles-grid');

            if (similarPosts.length > 0) {
                //                 similarGrid.innerHTML = similarPosts.map(({ node }) => `
                // <a href="?post=${node.slug}" onclick="event.preventDefault(); navigateToPost('${node.slug}')" class="uni-card wi vis" style="width: 100%;">
                //     ${node.coverImage?.url ? `
                //     <div class="wi-img-wrap similar-img-wrap">
                //         <img src="${node.coverImage.url}" class="wi-thumb" alt="Cover Image" loading="lazy" decoding="async">
                //     </div>` : ''}
                //                 <div class="wi-body" style="padding: 20px;">
                //                     <h3 class="wi-title" style="font-size: clamp(16px, 1.5vw, 20px); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${node.title}</h3>
                //                     <div class="ecm" style="margin-top:12px; flex-wrap: nowrap; overflow: hidden; white-space: nowrap;">
                //                         ${(node.tags || []).slice(0, 3).map(tag => `<span style="flex-shrink: 0;">${tag.name}</span>`).join('')}
                //                         <span style="flex-shrink: 0;">${new Date(node.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                //                     </div>
                //                 </div>
                //             </a>
                //         `).join('');






                //                 similarGrid.innerHTML = similarPosts.map(({ node }) => `
                //     <a href="?post=${node.slug}" onclick="event.preventDefault(); navigateToPost('${node.slug}')" style="display: block; height: 100%; text-decoration: none;">
                //         <div class="uni-card blog-card-inner" style="display: flex; flex-direction: column; height: 100%;">
                //             ${node.coverImage?.url ? `
                // <div class="blog-thumb" style="height: 160px; min-height: 160px;">
                //                 <img src="${node.coverImage.url}" alt="Cover Image" loading="lazy" decoding="async">
                //             </div>` : ''}
                //             <div class="blog-info" style="display: flex; flex-direction: column; flex: 1; padding: 16px 20px; min-width: 0;">
                //                 <h3 class="wi-title" style="font-size: clamp(14px, 1.2vw, 20px); margin-bottom: 6px; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${node.title}</h3>
                //                 <div class="brow" style="padding: 0; margin-top: auto; display: flex; flex-wrap: wrap; gap: 6px;">
                //                     ${(node.tags || []).slice(0, 3).map(tag => `<span class="badge feed-tag-link" style="font-size: clamp(9px, 0.5vw, 12px); padding: 3px 8px; text-transform: uppercase;">${tag.name}</span>`).join('')}
                //                     <span class="badge" style="background: transparent; border: none; color: var(--dimtitle); font-size: clamp(9px, 0.5vw, 12px); padding: 3px 0; pointer-events: none;">${new Date(node.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                //                 </div>
                //             </div>
                //         </div>
                //     </a>
                // `).join('');



                //                 similarGrid.innerHTML = similarPosts.map(({ node }) => `
                //     <a href="?post=${node.slug}" onclick="event.preventDefault(); navigateToPost('${node.slug}')" class="uni-card wi vis" style="width: 100%;">
                //         ${node.coverImage?.url ? `
                //         <div class="wi-img-wrap similar-img-wrap">
                //             <img src="${node.coverImage.url}" class="wi-thumb" alt="Cover Image" loading="lazy" decoding="async">
                //         </div>` : ''}
                //         <div class="wi-body" style="padding: 20px;">
                //             <h3 class="wi-title" style="font-size: clamp(16px, 1.5vw, 20px); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${node.title}</h3>
                //             <div class="ecm" style="margin-top:12px; flex-wrap: nowrap; overflow: hidden; white-space: nowrap;">
                //                 ${(node.tags || []).slice(0, 3).map(tag => `<span style="flex-shrink: 0;">${tag.name}</span>`).join('')}
                //                 <span style="flex-shrink: 0;">${new Date(node.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                //             </div>
                //         </div>
                //     </a>
                // `).join('');






                //                 similarGrid.innerHTML = similarPosts.map(({ node }) => `
                //     <a href="?post=${node.slug}" onclick="event.preventDefault(); navigateToPost('${node.slug}')" class="uni-card vis" style="display: flex; flex-direction: column; overflow: hidden; text-decoration: none; height: 100%;">

                //         ${node.coverImage?.url ? `
                //         <div style="width: 100%; height: 180px; flex-shrink: 0; border-bottom: 1px solid color-mix(in srgb, var(--border) 50%, transparent);">
                //             <img src="${node.coverImage.url}" alt="Cover Image" loading="lazy" decoding="async" style="width: 100%; height: 100%; object-fit: cover;">
                //         </div>` : ''}

                //         <div style="padding: 20px; display: flex; flex-direction: column; flex-grow: 1;">
                //             <h3 style="font-size: clamp(16px, 1.5vw, 20px); color: var(--text); margin: 0 0 12px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                //                 ${node.title}
                //             </h3>

                //             <div style="margin-top: auto; display: flex; align-items: center; gap: 8px; overflow: hidden; white-space: nowrap;">
                //                 ${(node.tags || []).slice(0, 3).map(tag => `
                //                     <span class="badge" style="flex-shrink: 0; font-size: 11px; padding: 4px 8px; border: 1px solid var(--border); border-radius: 4px;">
                //                         ${tag.name}
                //                     </span>
                //                 `).join('')}
                //                 <span style="flex-shrink: 0; margin-left: auto; color: var(--dimtitle); font-size: 12px;">
                //                     ${new Date(node.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                //                 </span>
                //             </div>
                //         </div>

                //     </a>
                // `).join('');




                similarGrid.innerHTML = similarPosts.map(({ node }) => `
    <a href="?post=${node.slug}"
        onclick="event.preventDefault(); navigateToPost('${node.slug}')"
        style="display: block; height: 100%; text-decoration: none;">
        <div class="uni-card blog-card-inner" style="display: flex; flex-direction: column; height: 100%;">
            ${node.coverImage?.url ? `
            <div class="blog-thumb">
                <img src="${node.coverImage.url}" alt="Cover Image" loading="lazy" decoding="async">
            </div>` : ''}
            <div class="blog-info" style="display: flex; flex-direction: column; flex: 1; padding: 16px 20px;">
                <h3 class="wi-title" style="font-size: clamp(16px, 1.5vw, 22px); margin-bottom: 8px; line-height: 1.2;">${node.title}</h3>
                <p class="wi-text" style="font-size: clamp(12px, 0.7vw, 15px); line-height: 1.5; color: var(--tdim); margin-bottom: 12px;">${node.brief}</p>
                <div class="brow" style="padding: 0; margin-top: auto; display: flex; flex-wrap: wrap; gap: 6px;">
                    ${(node.tags || []).slice(0, 4).map(tag => `<span class="badge feed-tag-link" style="font-size: clamp(9px, 0.5vw, 12px); padding: 3px 8px; text-transform: uppercase;" onclick="event.preventDefault(); event.stopPropagation(); window.location.href='?category=${encodeURIComponent(tag.name.toLowerCase())}'">${tag.name}</span>`).join('')}
                    <span class="badge" style="background: transparent; border: none; color: var(--dimtitle); font-size: clamp(9px, 0.5vw, 12px); padding: 3px 0; pointer-events: none;">${new Date(node.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
            </div>
        </div>
    </a>
`).join('');






                similarContainer.style.display = 'block';
            } else {
                similarContainer.style.display = 'none';
            }
            // -----------------------------------
            generateBlogSidebar();

            runCoreScrollTasks(window.scrollY);
        }
        async function initBlog() {
            // await loadNav();
            try {
                // Instantly requests data from the smart cache function
                const res = await fetchBlogData();
                const posts = res.data?.publication?.posts?.edges || [];
                BLOG_POSTS = posts;
                loader.style.display = 'none';
                if (postSlug) postEl.classList.add('loading');
                if (postSlug) {
                    await renderPost(postSlug);
                } else {
                    const coverWrap = document.getElementById('post-cover-wrap');
                    if (coverWrap) coverWrap.style.display = 'none';

                    listEl.style.display = 'grid';
                    const filtersEl = document.getElementById('blog-filters');
                    filtersEl.style.display = 'flex';

                    const allTags = new Set();
                    posts.forEach(edge => {
                        (edge.node.tags || []).forEach(tag => allTags.add(tag.name));
                    });
                    const uniqueTags = Array.from(allTags).sort();

                    let initialActiveTag = "DEFAULT";
                    if (URLFilter) {
                        const lowerParam = URLFilter.toLowerCase();
                        if (lowerParam === "all") initialActiveTag = "ALL";
                        else if (lowerParam === "default") initialActiveTag = "DEFAULT";
                        else {
                            const matchedTag = uniqueTags.find(t => t.toLowerCase() === lowerParam);
                            if (matchedTag) initialActiveTag = matchedTag;
                        }
                    }

                    filtersEl.innerHTML = `
                        <button class="filter-btn ${initialActiveTag === 'ALL' ? 'active' : ''}" data-tag="ALL">ALL</button>
                        <button class="filter-btn ${initialActiveTag === 'DEFAULT' ? 'active' : ''}" data-tag="DEFAULT">DEFAULT</button>
                        ${uniqueTags.map(tag => `<button class="filter-btn ${initialActiveTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</button>`).join('')}
                    `;

                    // NEW: Render Sidebar Filters
                    const sbNav = document.getElementById('sb-nav');
                    if (sbNav) {
                        // Only inject if we haven't already populated these buttons
                        if (!sbNav.querySelector('.filter-sidebar-btn')) {
                            sbNav.innerHTML = `
                                <a class="sbn ${initialActiveTag === 'ALL' ? 'active' : ''} filter-sidebar-btn" href="javascript:void(0)" data-tag="ALL">
                                    <span class="sbdot"></span>
                                    <span class="sblbl">ALL</span>
                                </a>
                                <a class="sbn ${initialActiveTag === 'DEFAULT' ? 'active' : ''} filter-sidebar-btn" href="javascript:void(0)" data-tag="DEFAULT">
                                    <span class="sbdot"></span>
                                    <span class="sblbl">DEFAULT</span>
                                </a>
                                ${uniqueTags.map(tag => `
                                <a class="sbn ${initialActiveTag === tag ? 'active' : ''} filter-sidebar-btn" href="javascript:void(0)" data-tag="${tag}">
                                    <span class="sbdot"></span>
                                    <span class="sblbl">${tag}</span>
                                </a>`).join('')}
                            `;

                            // Add the click listener
                            sbNav.addEventListener('click', (e) => {
                                const btn = e.target.closest('.filter-sidebar-btn');
                                if (btn) {
                                    const targetTag = btn.getAttribute('data-tag');
                                    document.querySelector(`.filter-btn[data-tag="${targetTag}"]`)?.click();
                                }
                            });
                        }
                    }

                    function renderFeed(filterTag) {
                        const filtered = posts.filter(edge => {
                            if (filterTag === "ALL") return true;
                            if (filterTag === "DEFAULT") {
                                return !(edge.node.tags || []).some(t => t.name === "ChatGPT");
                            }
                            return (edge.node.tags || []).some(t => t.name === filterTag);
                        });

                        if (filtered.length === 0) {
                            listEl.innerHTML = "<div class='dbox'>No transmission records found for this category.</div>";
                            return;
                        }

                        /* --- OPTIMIZATION 3: Native Image Deferring --- */
                        //                         listEl.innerHTML = filtered.map(({ node }) => `
                        //                         <a href="?post=${node.slug}"
                        //                             onclick="event.preventDefault(); navigateToPost('${node.slug}')"
                        //                             class="uni-card wi vis" style="max-width: 9000px; width: 100%;">
                        //                                 ${node.coverImage?.url ? `
                        //                                 <div class="wi-img-wrap">
                        //                                     <img src="${node.coverImage.url}" class="wi-thumb" alt="Cover Image" loading="lazy" decoding="async">
                        //                                 </div>` : ''}
                        //                                 <div class="wi-body" style="padding: 24px;">
                        //                                     <h3 class="wi-title" style="font-size: clamp(16px, 1.5vw, 24px);">${node.title}</h3>
                        //                                     <p class="wi-text" style="margin-top: 8px;">${node.brief}</p>
                        //                                     <div class="ecm" style="margin-top:16px;">
                        // ${(node.tags || []).slice(0, 4).map(tag => `<span class="feed-tag-link" onclick="event.preventDefault(); event.stopPropagation(); document.querySelector('.filter-btn[data-tag=\\'${tag.name}\\']')?.click(); window.scrollTo({top: 0, behavior: 'smooth'});">${tag.name}</span>`).join('')}                                        
                        //                                         <span>${new Date(node.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        //                                     </div>
                        //                                 </div>
                        //                             </a>
                        //                         `).join('');
                        listEl.innerHTML = filtered.map(({ node }) => `
    <a href="?post=${node.slug}"
        onclick="event.preventDefault(); navigateToPost('${node.slug}')"
        style="display: block; height: 100%; text-decoration: none;">
        <div class="uni-card blog-card-inner" style="display: flex; flex-direction: column; height: 100%;">
            ${node.coverImage?.url ? `
            <div class="blog-thumb">
                <img src="${node.coverImage.url}" alt="Cover Image" loading="lazy" decoding="async">
            </div>` : ''}
            <div class="blog-info" style="display: flex; flex-direction: column; flex: 1; padding: 16px 20px;">
                <h3 class="wi-title" style="font-size: clamp(16px, 1.5vw, 22px); margin-bottom: 8px; line-height: 1.2;">${node.title}</h3>
                <p class="wi-text" style="font-size: clamp(12px, 0.7vw, 15px); line-height: 1.5; color: var(--tdim); margin-bottom: 12px;">${node.brief}</p>
                <div class="brow" style="padding: 0; margin-top: auto; display: flex; flex-wrap: wrap; gap: 6px;">
                    ${(node.tags || []).slice(0, 4).map(tag => `<span class="badge feed-tag-link" style="font-size: clamp(9px, 0.5vw, 12px); padding: 3px 8px; text-transform: uppercase;" onclick="event.preventDefault(); event.stopPropagation(); document.querySelector('.filter-btn[data-tag=\\'${tag.name}\\']')?.click(); window.scrollTo({top: 0, behavior: 'smooth'});">${tag.name}</span>`).join('')}
                    <span class="badge" style="background: transparent; border: none; color: var(--dimtitle); font-size: clamp(9px, 0.5vw, 12px); padding: 3px 0; pointer-events: none;">${new Date(node.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
            </div>
        </div>
    </a>
`).join('');
                    }

                    filtersEl.addEventListener('click', (e) => {
                        if (e.target.classList.contains('filter-btn')) {
                            const targetTag = e.target.getAttribute('data-tag');

                            filtersEl.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                            e.target.classList.add('active');

                            const sbNav = document.getElementById('sb-nav');
                            if (sbNav) {
                                sbNav.querySelectorAll('.filter-sidebar-btn').forEach(btn => btn.classList.remove('active'));
                                sbNav.querySelector(`.filter-sidebar-btn[data-tag="${targetTag}"]`)?.classList.add('active');
                            }

                            const currentURL = new URL(window.location.href);
                            currentURL.searchParams.set('category', targetTag.toLowerCase());
                            window.history.pushState({}, '', currentURL);

                            renderFeed(targetTag);
                        }
                    });

                    renderFeed(initialActiveTag);
                    // generateBlogSidebar();
                }
                // Add this to fade in the post container once content is ready
                postEl.classList.remove('loading');
            } catch (err) {
                loader.innerText = `Update error sequence: ${err.message}`;
                console.error(err);

                // ADD THIS: Ensure content is visible even if an error occurs
                postEl.classList.remove('loading');
                postEl.style.display = 'block';

                generateBlogSidebar();
            }
        }
        function preloadAdjacentImages(slug) {
            const currentIndex = BLOG_POSTS.findIndex(edge => edge.node.slug === slug);

            [currentIndex - 1, currentIndex + 1].forEach(index => {
                const post = BLOG_POSTS[index]?.node;

                if (!post?.coverImage?.url) return;

                const img = new Image();
                img.decoding = 'async';
                img.src = post.coverImage.url;
            });
        }
        initBlog();
