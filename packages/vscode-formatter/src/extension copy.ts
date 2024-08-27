'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const editor = vscode.workspace.getConfiguration('editor');
    const indentSize = +editor['identSize'] || editor['tabSize'];
    const spaceNormalizer = new SpaceNormalizer();
        
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
                edits.push(...spaceNormalizer.normalizeSpaces(line)
                    .map(({start, end, newText}) => vscode.TextEdit.replace(
                        new vscode.Range(new vscode.Position(line.lineNumber, start), 
                        new vscode.Position(line.lineNumber, end)), 
                        newText)));

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

export class SpaceNormalizer {

    terms = {
        controlSequences: [
            '!=',
            '==',
            '{',
            '}',
            '->',
        ],
        quotes: [
            "'",
            '\''
        ],
        startCommentSequences: [
            '//',
            '/*'
        ],
        endCommentSequences: [
            '*/'
        ],
        spaces: [
            ' ',
            '\t'
        ]
    };

    normalizeSpaces(line: {
        firstNonWhitespaceCharacterIndex: number,
        text: String
    }) {
        const edits = [];
        const state: {
            currentTerm: 'none' | 'control' | 'space' | 'word' | 'singleQuote' | 'doubleQuote', 
            spaceStart: number,
            editingOffset: number
        } = {
            currentTerm: 'none',
            spaceStart: line.firstNonWhitespaceCharacterIndex,
            editingOffset: 0
        };

        for (let i = line.firstNonWhitespaceCharacterIndex; i < line.text.length; i++) {
            const nextTerm = this.getTerm(line.text, i);

            switch (state.currentTerm) {
                case 'none':
                    state.currentTerm = nextTerm;
                    break;

                case 'word':
                    if(nextTerm == 'space') {
                        state.currentTerm = nextTerm;
                        state.spaceStart = i;
                    } else if(nextTerm == 'control') {
                        edits.push({ start: i + state.editingOffset, end: i + state.editingOffset, newText: ' ' });
                        state.currentTerm = nextTerm;
                        state.editingOffset += 1;                        
                    }
                    break;

                case 'control':
                    if(nextTerm == 'space') {
                        state.currentTerm = nextTerm;
                        state.spaceStart = i;
                    } else if(nextTerm == 'word') {
                        edits.push({ start: i + state.editingOffset, end: i + state.editingOffset, newText: ' ' });
                        
                        state.currentTerm = nextTerm;
                        state.editingOffset += 1;                        
                    }
                    break;

                case 'space':
                    if(nextTerm == 'control' || nextTerm == 'word') {
                        edits.push({ start: state.spaceStart + state.editingOffset, end: i + state.editingOffset, newText: ' ' });

                        state.currentTerm = nextTerm;
                        state.editingOffset += state.spaceStart - i + 1;
                    }

            }
        }

        return edits;
    }

    getTerm(text: String, index: number): 'none' | 'control' | 'space' | 'word' | 'doubleQuote' | 'singleQuote' {
        if (text[index] == '"') {
            return 'doubleQuote';
        } else if (text[index] == '\'') {
            return 'singleQuote';
        } else if (this.terms.spaces.includes(text[index]!)) {
            return 'space';
        } else if (this.terms.controlSequences.includes(text.slice(index, index + 1)) 
            || this.terms.controlSequences.includes(text.slice(index, index + 2))) {
            return 'control';
        }

        return 'word';
    }
}