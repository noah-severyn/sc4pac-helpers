// # generate.js
import dedent from 'dedent';

// # generate(metadata)
// Generates a yaml file from the parsed metadata. Note that we'll automatically 
// figure out whether we have to add a darknite variant or not.
export default function generate(metadata) {
  let { info } = metadata;
  let { description } = info;
  description = description.replaceAll(' ', ' ');
  let yaml = dedent`
    group: ${metadata.group}
    name: ${metadata.name}
    version: "${metadata.version}"
    subfolder: ${metadata.subfolder||''}
    info:
      summary: ${info.summary}
      description: |
        ${indent(description, 8)}
      author: ${info.author}
      website: ${info.website}
`;
  if (info.images.length > 0) {
    yaml += '\n  images:\n';
    for (let img of info.images) {
      yaml += `    - ${img}\n`;
    }
  } else {
    yaml += '\n';
  }
  yaml += '\n';

  if (metadata.dependencies) {
    yaml += 'dependencies:\n';
    for (let dep of metadata.dependencies) {
      yaml += `  - ${dep}\n`;
    }
  }

  // Now include the assets. If we've detected a darknite and maxisnite 
  // variant, we'll include them that way.
  const { assets = [] } = metadata;
  if (hasVariantSuffixes(assets)) {
    yaml += 'variants:\n';
    for (let asset of assets) {
      if (asset.assetId.endsWith('-darknite')) {
        yaml += dedent`
          - variant: { nightmode: dark }
            dependencies: ["simfox:day-and-nite-mod"]
            assets:
              - assetId: ${asset.assetId}
        `;
        yaml += '\n';
      } else if (asset.assetId.endsWith('-maxisnite')) {
        yaml += dedent`
          - variant: { nightmode: standard }
            assets:
              - assetId: ${asset.assetId}
        `;
        yaml += '\n';
      } else if (asset.assetId.endsWith('-lhd')) {
        yaml += dedent`
          - variant: { driveside: left }
            assets:
              - assetId: ${asset.assetId}
        `;
        yaml += '\n';
      } else if (asset.assetId.endsWith('-rhd')) {
        yaml += dedent`
          - variant: { driveside: right }
            assets:
              - assetId: ${asset.assetId}
        `;
        yaml += '\n';
      }
    }
  } else {
    yaml += 'assets:\n';
    for (let asset of assets) {
      yaml += `  - assetId: ${asset.assetId}\n`;
    }
  }

  // Now add all assets.
  for (let asset of assets) {
    yaml += '\n';
    yaml += dedent`
      ---
      assetId: ${asset.assetId}
      version: "${metadata.version}"
      lastModified: "${metadata.modified}"
      url: ${asset.url}
    `;
    yaml += '\n';
  }
  return yaml;
}

// # hasVariantSuffixes(assets)
function hasVariantSuffixes(assets) {
  if (assets.length < 2) return false;
  return assets.some(asset => {
    return /-([rl]hd|(dark|maxis)nite)$/.test(asset.assetId);
  });
}

// # indent(str)
function indent(str, n, { trim = true } = {}) {
  let output = dedent(str).split('\n').map(line => {
    return ' '.repeat(n) + line;
  }).join('\n');
  if (trim !== false) output = output.trim();
  return output;
}