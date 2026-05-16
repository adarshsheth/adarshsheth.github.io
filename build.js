const {Client} = require("@notionhq/client");
const {NotionToMarkdown} = require("notion-to-md");
const {marked} = require("marked");
const fs = require("fs");
const path = require("path");
const https = require("https");

const notion = new Client({auth: process.env.NOTION_API_KEY});
const n2m = new NotionToMarkdown({notionClient: notion});

const download = (url, dest) =>
	new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				if (res.statusCode !== 200) return reject(new Error(`Status: ${res.statusCode}`));
				const file = fs.createWriteStream(dest);
				res.pipe(file);
				file.on("finish", () => file.close(resolve));
			})
			.on("error", reject);
	});

async function run() {
	console.log("Starting Notion sync...");

	const imgDir = path.join(__dirname, "media", "blog");
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
					const dest = path.join(imgDir, `${slug}-cover.jpg`);
					await download(rawUrl, dest).catch((e) => console.log(`  Cover warning: ${e.message}`));
					coverUrl = `media/blog/${slug}-cover.jpg`;
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
						const dest = path.join(imgDir, `${slug}-${imgCount}.jpg`);
						await download(match[1], dest).catch((e) => console.log(`  Image warning: ${e.message}`));
						b.parent = b.parent.replace(match[1], `media/blog/${slug}-${imgCount}.jpg`);
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
				// Inject an invisible div between consecutive quotes to force 'marked' to render separate <blockquote> elements
				if (b.type === "quote" && i < blocks.length - 1 && blocks[i + 1].type === "quote") {
					processedBlocks.push({
						type: "html",
						parent: "<div style='display:none;'></div>",
						children: [],
					});
				}
			}

			// Convert the perfectly formatted blocks back into a Markdown string
			let rawMd = n2m.toMarkdownString(processedBlocks).parent || "";

			// --- FIX PART 4: The Link Merger ---
			// Stitches back together split links with identical URLs.
			// Using [ \t]* instead of \s* ensures we ONLY merge links on the same line, preventing massive text duplication across newlines.
			let prevMd;
			do {
				prevMd = rawMd;
				rawMd = rawMd.replace(/\[([^\]]+)\]\(([^)]+)\)([ \t]*)\[([^\]]+)\]\(\2\)/g, "[$1$3$4]($2)");
			} while (rawMd !== prevMd);

			// Parse the fully cleaned Markdown into HTML
			const htmlContent = marked.parse(rawMd, {breaks: true});

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
