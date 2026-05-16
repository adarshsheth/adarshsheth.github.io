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
			let imgCount = 0;

			// --- FIX PART 1: The Original Image Loop ---
			for (const b of blocks) {
				if (b.type === "image") {
					const match = b.parent.match(/\((https?:\/\/.*?)\)/);
					if (match && match[1]) {
						const dest = path.join(imgDir, `${slug}-${imgCount}.jpg`);
						await download(match[1], dest).catch((e) => console.log(`  Image warning: ${e.message}`));
						b.parent = b.parent.replace(match[1], `media/blog/${slug}-${imgCount}.jpg`);
						imgCount++;
					}
				}
			}

			let rawMd = n2m.toMarkdownString(blocks).parent || "";

			// --- NEW FIX PART 2: The Quote Separator ---
			// Scans for two separate blockquotes separated by empty lines, and injects
			// an invisible div. This explicitly forces 'marked' to close the first
			// box and draw a completely new, separate box for the next.
			rawMd = rawMd.replace(/(^>.*$)\n{2,}(?=>)/gm, "$1\n\n<div style='display:none;'></div>\n\n");

			// --- FIX PART 3: The Link Merger ---
			// Scans the raw Markdown and stitches back together any links with identical URLs
			let prevMd;
			do {
				prevMd = rawMd;
				rawMd = rawMd.replace(/\[([^\]]+)\]\(([^)]+)\)(\s*)\[([^\]]+)\]\(\2\)/g, "[$1$3$4]($2)");
			} while (rawMd !== prevMd);

			// Finally, parse the fully cleaned Markdown into HTML
			// Using { breaks: true } ensures soft-breaks (Shift+Enter) are preserved as <br> tags
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
