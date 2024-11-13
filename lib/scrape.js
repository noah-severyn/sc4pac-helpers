// # scrape(-)
import path from 'node:path';
import { JSDOM } from 'jsdom';
import chalk from 'chalk';
import ora from 'ora';

// # parse()
// Parses the main metadata from the main Simtropolis page.
export function parse(url = window.location.href, document = window.document) {

	// Make querying eaqier with jQuery-style $'s.
	const { $, $$ } = wrap(document);

	// The file id is parsed from the url.
	let parsedUrl = new URL(url);
	let [, name] = parsedUrl.pathname
		.replace(/\/$/, '')
		.split('/')
		.at(-1)
		.match(/[\d+]-(.*)/);

	// We'll look up the author by looking for the "Find their other files" text.
	let author = [...$$('ul.ipsList_inline')]
		.find(node => {
			return node.textContent
				.toLowerCase()
				.includes('find their other files');
		})
		.previousElementSibling
		.textContent
		.trim()
		.replace(/^By /, '')
		.trim();
	let group = slugify(author);

	// Find the summary as the h1 title.
	let summary = $('h1 > span').childNodes[0].textContent.trim();

	// Next we'll find the description paragraph.
	let h2 = [...$$('h2')]
		.find(node => {
			return node.textContent.toLowerCase().includes('about this file');
		});
	let description = [...h2.nextElementSibling.querySelectorAll('div > p')]
		.map(p => p.textContent.trim())
		.join('\n');

	// Find the version.
	let version = document.querySelector('.stex-title-version').textContent;

	// Find the modified date.
	const has = text => time => time.parentElement
		?.previousElementSibling
		?.textContent
		.includes(text);
	let modified = (
		[...$$('time')].find(has('Updated')) ||
		[...$$('time')].find(has('Submitted'))
	).getAttribute('datetime');

	// Find the thumbnail images.
	let images = [...$$('ul.cDownloadsCarousel img')]
		.map(img => img.getAttribute('src'));

	return {
		group,
		name,
		summary,
		author,
		version,
		description,
		modified,
		images,
	};

}

// # parseMultipleAssets(main, document)
// Parses a html document that contains the various assets that can be 
// downloaded.
function parseMultipleAssets(main, document) {
	const { $ } = wrap(document);
	let baseId = `${main.group}-${main.name}`;
	let assets = [...wrap($('ul.ipsDataList')).$$('* > li')]
		.map((li, i) => {

			// Extract the actual download url.
			let a = li.querySelector('a');
			let href = a.getAttribute('href');
			let url = new URL(href);
			url.searchParams.delete('confirm');
			url.searchParams.delete('t');
			url.searchParams.delete('csrfKey');

			// Extract the name of the download. From this we'll detect whether 
			// it's a maxisnite or darknite download.
			let name = li.querySelector('h4 span').textContent;
			let filename = path.parse(name).name;
			let suffix = getAssetSuffix(filename, i);
			return {
				assetId: `${baseId}-${suffix}`,
				url: url.href,
				lastModified: main.modified,
			};

		});
	return assets;
}

// # getAssetSuffix(name, index)
// This function intelligently determines the asset suffix. This is mostly 
// useful for detecting maxis nite and dark nite versions.
export function getAssetSuffix(name, index) {
	let src = name.toLowerCase();
	if (/dark\w?ni(te|ght)/.test(src)) return 'darknite';
	if (/maxis\w?ni(te|ght)/.test(src)) return 'maxisnite';
	if (/[_-\w]dn/.test(src)) return 'darknite';
	if (/[_-\w]mn/.test(src)) return 'maxisnite';
	return `part-${index}`;
}

// # wrap(document)
// Returns two jQuery-like functions for easier querying.
function wrap(document) {
	const $ = (...args) => document.querySelector(...args);
	const $$ = (...args) => document.querySelectorAll(...args);
	return { $, $$ };
}

// # slugify(name)
// Converts the name of the author into a slugged version.
function slugify(name) {
	return name.toLowerCase().replaceAll(/\s+/g, '-');
}

// # scrape(url, opts)
// Fetches a url information from Simtropolis and returns the metadata from it.
export default async function scrape(url, opts = {}) {
	let spinner = ora(`Fetching ${chalk.cyan(url)}`).start();
	let html = await fetch(url).then(res => res.text());
	spinner.succeed();
	let { document } = new JSDOM(html).window;
	let props = parse(url, document);

	// If the assets don't need to be parsed, return as is.
	if (opts.assets === false) return;

	// Fetch the headers of the download link as well. That way we can determine 
	// whether there are multiple assets or not.
	let downloadUrl = new URL(url);
	downloadUrl.searchParams.set('do', 'download');
	spinner = ora(`Fetching headers from ${chalk.cyan(downloadUrl)}`).start();
	let head = await fetch(downloadUrl, { method: 'HEAD' });
	spinner.succeed();
	let content = head.headers.get('Content-Type');

	// If the download link is *not* an html file, then there's only a single 
	// asset. Include it that way.
	if (!content.includes('text/html')) {
		props.assets = [{
			assetId: `${props.group}-${props.name}`,
			version: props.version,
			lastModified: props.modified,
			url: downloadUrl.href,
		}];
	} else {

		// If the download link is an html file, then it's a page listing the 
		// various downloads. We'll fetch this page and then extract the data 
		// from it.
		let spinner = ora(`Fetching assets from ${chalk.cyan(downloadUrl)}`);
		spinner.start();
		let html = await fetch(downloadUrl).then(res => res.text());
		spinner.succeed();

		// Parse the html and extract the assets info from it.
		let { document } = new JSDOM(html).window;
		props.assets = parseMultipleAssets(props, document);

	}
	return props;

}