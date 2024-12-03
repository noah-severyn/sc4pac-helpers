// # tarverse-yaml.js
// Utility function for easily traversing and modifying yaml in bulk.
import path from 'node:path';
import fs from 'node:fs';
import { Glob } from 'glob';
import { Document, parseAllDocuments } from 'yaml';
import stylizeDoc from './stylize-doc.js';

const defaultToStringOptions = {
	lineWidth: 0,
};

// # traverse(patterns, fn)
export default async function traverse(patterns, fn = () => {}, opts = {}) {
	const {
		stylize = true,
		...restOptions
	} = opts;
	const glob = new Glob(patterns, {
		absolute: true,
		nodir: true,
		nocase: true,
		cwd: path.resolve(import.meta.dirname, '../../sc4pac/src/yaml'),
	});
	for await (let file of glob) {
		let contents = String(await fs.promises.readFile(file));
		let docs = [];
		let changed;
		for (let doc of parseAllDocuments(contents)) {
			let raw = contents.slice(doc.range[0], doc.range[1]);
			let json = doc.toJSON();
			let result = await fn(json, doc, raw);
			if (result) {
				if (result instanceof Document) {
					docs.push(result);
				} else {
					docs.push(new Document(result));
				}
				changed = true;
			} else {
				docs.push(doc);
			}
		}
		if (changed) {
			let buffer = docs.map(doc => {
				if (stylize) {
					stylizeDoc(doc);
				}
				return doc.toString({
					...defaultToStringOptions,
					...restOptions,
				});
			}).join('\n');
			await fs.promises.writeFile(file, buffer);
		}
	}
}