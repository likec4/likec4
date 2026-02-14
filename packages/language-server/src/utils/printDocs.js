export const printDocs = (docs) => docs.map(d => '  - ' + d.uri.toString(true)).join('\n');
