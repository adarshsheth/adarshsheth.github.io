const {Client} = require("@notionhq/client");
const {NotionToMarkdown} = require("notion-to-md");
const {marked} = require("marked");
const fs = require("fs");
const path = require("path");
const https = require("https");
const sharp = require("sharp"); // <-- NEW: Added Sharp compressor

const notion = new Client({auth: process.env.NOTION_API_KEY});
const n2m = new NotionToMarkdown({notionClient: notion});

// <-- NEW: Upgraded download function with compression and caching
const downloadAndCompress = (url, dest) =>
	new Promise((resolve, reject) => {
		// CACHING: If the compressed image already exists, skip downloading!
		if (fs.existsSync(dest)) {
			return resolve();
		}

		https
			.get(url, (res) => {
				if (res.statusCode !== 200) return reject(new Error(`Status: ${res.statusCode}`));

				// THE COMPRESSOR: Resizes huge images down to max 1400px wide,
				// and converts them to highly compressed WebP format.
				const compressor = sharp().resize({width: 1400, withoutEnlargement: true}).webp({quality: 80});

				const file = fs.createWriteStream(dest);

				// Pipe the download directly through the compressor and into the file
				res.pipe(compressor).pipe(file);

				file.on("finish", () => file.close(resolve));
				compressor.on("error", reject);
			})
			.on("error", reject);
	});

async function run() {
	console.log("Starting Notion sync...");

	// <-- CHANGED: Updated directory to point to the compressed subfolder
	const imgDir = path.join(__dirname, "media", "blog", "compressed");
	if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, {recursive: true});

	if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
		throw new Error("Missing API Key or Database ID in GitHub Secrets!");
	}

	console.log("Fetching database directly via API...");

	// We use native fetch to completely bypass the SDK bug
	const dbResponse = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
			"Notion-Version": "2022-06-28",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			filter: {
				property: "Published",
				checkbox: {
					equals: true,
				},
			},
		}),
	});

	if (!dbResponse.ok) {
		const errText = await dbResponse.text();
		throw new Error(`Notion API Error: ${dbResponse.status} - ${errText}`);
	}

	const db = await dbResponse.json();
	const edges = [];

	for (const page of db.results) {
		try {
			const props = page.properties;
			const slug = props.Slug?.rich_text[0]?.plain_text || page.id;
			console.log(`Processing article: ${slug}`);

			let coverUrl = null;
			if (page.cover) {
				const rawUrl = page.cover.external?.url || page.cover.file?.url;
				if (rawUrl) {
					// <-- CHANGED: Switched to .webp and updated the URL path to the compressed folder
					const dest = path.join(imgDir, `${slug}-cover.webp`);
					await downloadAndCompress(rawUrl, dest).catch((e) => console.log(`  Cover warning: ${e.message}`));
					coverUrl = `media/blog/compressed/${slug}-cover.webp`;
				}
			}

			const blocks = await n2m.pageToMarkdown(page.id);
			const processedBlocks = [];
			let imgCount = 0;

			// Iterate through the raw AST blocks to safely modify structure
			for (let i = 0; i < blocks.length; i++) {
				const b = blocks[i];

				// --- FIX PART 1: Handle Images ---
				if (b.type === "image") {
					const match = b.parent.match(/\((https?:\/\/.*?)\)/);
					if (match && match[1]) {
						// <-- CHANGED: Switched to .webp and updated the URL path to the compressed folder
						const dest = path.join(imgDir, `${slug}-${imgCount}.webp`);
						await downloadAndCompress(match[1], dest).catch((e) => console.log(`  Image warning: ${e.message}`));
						b.parent = b.parent.replace(match[1], `media/blog/compressed/${slug}-${imgCount}.webp`);
						imgCount++;
					}
				}

				// --- FIX PART 2: Quote Soft-Breaks & Spacing ---
				if (b.type === "quote") {
					// 1. Remove the markdown quote symbol (">") from all lines to get the raw text
					let rawQuoteText = b.parent.replace(/^>\s?/gm, "");

					// 2. Preserve soft newlines by replacing `\n` with explicit `<br>` tags
					// This guarantees they stay on new lines without breaking the blockquote structure
					rawQuoteText = rawQuoteText.replace(/\n/g, "<br>");

					// 3. Re-wrap as a single-line markdown quote
					b.parent = `> ${rawQuoteText}`;
				}

				processedBlocks.push(b);

				// --- FIX PART 3: Separate Back-to-Back Quotes ---
				if (b.type === "quote" && i < blocks.length - 1 && blocks[i + 1].type === "quote") {
					processedBlocks.push({
						type: "html",
						parent: "<div class='quote-spacer' style='display:none;'></div>",
						children: [],
					});
				}
			}

			// Convert the perfectly formatted blocks back into a Markdown string
			let rawMd = n2m.toMarkdownString(processedBlocks).parent || "";

			// --- FIX PART 4: The Link Merger ---
			// Stitches back together split links with identical URLs.
			let prevMd;
			do {
				prevMd = rawMd;
				rawMd = rawMd.replace(/\[([^\]]+)\]\(([^)]+)\)([ \t]*)\[([^\]]+)\]\(\2\)/g, "[$1$3$4]($2)");
			} while (rawMd !== prevMd);

			// Parse the fully cleaned Markdown into standard HTML first
			let htmlContent = marked.parse(rawMd, {breaks: true});

			// --- FIX PART 5: Image Captions ---
			// 1. Strip the <p> tags that 'marked' automatically puts around standalone images
			htmlContent = htmlContent.replace(/<p>\s*(<img[^>]+>)\s*<\/p>/gi, "$1");

			// 2. Find any <img> tag, extract its alt text, and wrap it in a <figure>
			htmlContent = htmlContent.replace(/<img([^>]+)>/gi, (match, attrs) => {
				const altMatch = attrs.match(/alt="([^"]+)"/i);

				// If alt text exists and isn't just empty space, create the caption
				if (altMatch && altMatch[1].trim() !== "") {
					const altText = altMatch[1];
					return `<figure>${match}<figcaption>${altText}</figcaption></figure>`;
				}

				// If no caption, just return the normal image
				return match;
			});

			edges.push({
				node: {
					id: page.id,
					slug: slug,
					title: props.Name?.title[0]?.plain_text || "Untitled",
					brief: props.Brief?.rich_text[0]?.plain_text || "",
					publishedAt: props.Date?.date?.start || page.created_time,
					tags: props.Tags?.multi_select || [],
					coverImage: coverUrl ? {url: coverUrl} : null,
					content: {html: htmlContent},
				},
			});
		} catch (articleError) {
			console.error(`Skipped an article due to error:`, articleError.message);
		}
	}

	fs.writeFileSync("blog-data.json", JSON.stringify({data: {publication: {posts: {edges: edges}}}}, null, 2));
	console.log("Sync completed successfully!");
}

run().catch((err) => {
	console.error("\n=== FATAL ERROR ===");
	console.error(err.message);
	process.exit(1);
});
