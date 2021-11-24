import SymfinderVisitor from "../visitors/SymfinderVisitor";
import { createSourceFile, Node, ScriptTarget, SourceFile } from 'typescript';
import { readFileSync } from 'fs';

export default class Parser{

    sourceFile: SourceFile;
    
    constructor(file: string) {
        this.sourceFile = createSourceFile(file, readFileSync(file, 'utf8'), ScriptTarget.Latest, true);
    }

    async accept(visitor: SymfinderVisitor) {
        for(let node of this.sourceFile.statements) {
            await visitor.visit(node);
            await this.visit(node, visitor);
        }
    }

    async visit(node: Node, visitor: SymfinderVisitor){
        for(let child of node.getChildren()){
            await visitor.visit(child);
            await this.visit(child, visitor);
        }
    }
}