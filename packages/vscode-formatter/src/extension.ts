'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const editor = vscode.workspace.getConfiguration('editor');
    const indentSize = +editor['identSize'] || editor['tabSize'];
        
    vscode.languages.registerDocumentFormattingEditProvider('likec4', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            let level = 0;
            const edits = [] as vscode.TextEdit[];

            for(let lineIndex = 0; lineIndex < document.lineCount; lineIndex++){
                const line = document.lineAt(lineIndex);

                if(line.isEmptyOrWhitespace){
                    continue;
                }

                if(line.text.trim().endsWith('}')) {
                    level--;
                }

                edits.push(...applyIndent(line, level));
    
                if(line.text.trim().endsWith('{')) {
                    level++;
                }
            }

            return edits;
        }
    });
    
    function applyIndent(line: vscode.TextLine, level: number) {
        const targetIndent = level * indentSize;
        const currentIndent = line.firstNonWhitespaceCharacterIndex;
    
        if (targetIndent !== currentIndent) {
            return [vscode.TextEdit.replace(
                new vscode.Range(line.range.start, new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex)),
                ' '.repeat(targetIndent))];
        }
    
        return [];
    }
}
