const {Client} = require("@notionhq/client");
const {NotionToMarkdown} = require("notion-to-md");
const {marked} = require("marked");
const fs = require("fs");
const path = require("path");
const https = require("https");

// Initialize API
const notion = new Client({auth: process.env.NOTION_API_KEY});
const n2m = new NotionToMarkdown({notionClient: notion});

// Simple image downloader
const download = (url, dest) =>
	new Promise((resolve, reject) => {
		https
			.get(url, (res) => {
				const file = fs.createWriteStream(dest);
				res.pipe(file);
				file.on("finish", () => file.close(resolve));
			})
			.on("error", reject);
	});

async function run() {
	console.log("Starting Notion sync...");

	// Ensure media folder exists
	const imgDir = path.join(__dirname, "media", "blog");
	fs.mkdirSync(imgDir, {recursive: true});

	// Fetch Database
	const db = await notion.databases.query({database_id: process.env.NOTION_DATABASE_ID});
	const edges = [];

	for (const page of db.results) {
		const props = page.properties;
		const slug = props.Slug?.rich_text[0]?.plain_text || page.id;
		console.log(`Processing article: ${slug}`);

		// 1. Download Cover Image
		let coverUrl = null;
		if (page.cover) {
			const rawUrl = page.cover.external?.url || page.cover.file?.url;
			if (rawUrl) {
				const dest = path.join(imgDir, `${slug}-cover.jpg`);
				await download(rawUrl, dest);
				coverUrl = `media/blog/${slug}-cover.jpg`;
			}
		}

		// 2. Parse Markdown & Download Inline Images
		const blocks = await n2m.pageToMarkdown(page.id);
		let imgCount = 0;

		for (const b of blocks) {
			if (b.type === "image") {
				const match = b.parent.match(/\((https?:\/\/.*?)\)/);
				if (match && match[1]) {
					const dest = path.join(imgDir, `${slug}-${imgCount}.jpg`);
					await download(match[1], dest);
					b.parent = b.parent.replace(match[1], `media/blog/${slug}-${imgCount}.jpg`);
					imgCount++;
				}
			}
		}

		// 3. Convert to HTML
		const htmlContent = marked.parse(n2m.toMarkdownString(blocks).parent || "");

		// 4. Format Data
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
	}

	// Save final JSON
	fs.writeFileSync("blog-data.json", JSON.stringify({data: {publication: {posts: {edges: edges}}}}, null, 2));
	console.log("Sync completed successfully!");
}

// Execute with error catching
run().catch((err) => {
	console.error("FATAL ERROR:", err.message);
	process.exit(1);
});
