import SymfinderVisitor from "./SymfinderVisitor";
import NeoGraph from "../neograph/NeoGraph";
import {isSourceFile, Program, SourceFile, Symbol, SymbolFlags, TypeChecker} from "typescript";
import {filname_from_filepath} from "../utils/path";
import {EntityAttribut, EntityType, RelationType} from "../neograph/NodeType";
import {Mutex} from "async-mutex";
import path = require("path");

export default class ExportVisitor extends SymfinderVisitor {

    exportMutex = new Mutex();

    constructor(neoGraph: NeoGraph, public program: Program) {
        super(neoGraph);
    }

    async visit(node: SourceFile): Promise<void>;

    /** Visit export node.
     * Create EXPORT link for the node "export { A, B...} from 'path'" or "export * from 'path'"
     * Change the link INTERNAL to EXPORT for the node "export { A, B... }"
     * @param node A source file
     */
    async visit(node: SourceFile): Promise<void> {
        if (!isSourceFile(node)) return;

        // @ts-ignore
        const filePath = path.relative(process.env.PROJECT_PATH, node.fileName).substring(6);
        const fileName = filname_from_filepath(filePath);
        const fileNode = await this.neoGraph.getNodeWithPath(fileName, filePath);
        if (fileNode === undefined) {
            console.log("Cannot find file : '" + filePath + "' in graph...");
            return;
        }

        const checker = this.program.getTypeChecker();
        if (checker.getSymbolAtLocation(node) === undefined) return; // Can happen if the file is empty or its content is only comments

        const exports = checker.getExportsOfModule(checker.getSymbolAtLocation(node)!);
        const exportOriginals = []; //No alias, types and export star
        for (let symbol of exports) {

            if (symbol.flags == SymbolFlags.Alias) {
                const originalSymbol = this.getOriginalSymbol(symbol, checker);
                if (originalSymbol !== undefined)
                    symbol = originalSymbol;
                else
                    continue;
            }

            if(symbol.escapedName === "default")
                continue; // They are many cases and handle them can be long whereas the count is low

            if (symbol.flags == SymbolFlags.ExportStar)
                console.log("OK")

            if (symbol.flags != SymbolFlags.RegularEnum && symbol.flags != SymbolFlags.TypeAlias && symbol.flags != SymbolFlags.ExportStar && symbol.flags != SymbolFlags.ConstEnum)
                exportOriginals.push(symbol);
        }

        const exportExternals = exportOriginals.filter(symbol => this.isPathCorrect(this.getPath(symbol)))
        if (exportExternals.length === 0)
            return;

        for (const exportExternal of exportExternals) {
            if (exportExternal.declarations === undefined) {
                console.log("Bug ?")
                continue;
            }
            const declaration = (<any>exportExternal.declarations[0]);
            let modulePath = this.getPath(checker.getSymbolAtLocation(declaration.propertyName ?? declaration.name)!);
            if(modulePath.endsWith(".d.ts"))
                continue;
            let exportedElementNode = await this.getNode(exportExternal, modulePath);
            if (exportedElementNode !== undefined) {
                if (modulePath === filePath)
                    await this.neoGraph.updateLinkTwoNode(fileNode, exportedElementNode, RelationType.INTERNAL, RelationType.EXPORT);
                else
                    await this.neoGraph.linkTwoNodes(fileNode, exportedElementNode, RelationType.EXPORT);
            } else {
                console.log("Error to link nodes " + filePath + " and " + modulePath + " - cannot get " + exportExternal.escapedName);
            }
        }
    }

    getPath(symbol: Symbol) {
        let name: string = "";
        if (symbol.valueDeclaration !== undefined) {
            name = (symbol.valueDeclaration.parent as SourceFile).fileName;
        } else if ("parent" in symbol && symbol.parent !== undefined) {
            name = (<any>symbol.parent).getEscapedName().toString();
            if (name.startsWith("\"") && name.endsWith("\""))
                name = name.slice(1, -1);
        } else {
            console.log("Can't get the escaped name");
            return "";
        }
        if (name === undefined)
            return "";
        if (!name.endsWith(".ts"))
            name += ".ts";
        if (path.isAbsolute(name))
            // @ts-ignore
            name = path.relative(process.env.PROJECT_PATH, name).substring(6);
        return name;
    }

    getOriginalSymbol(symbol: Symbol, checker: TypeChecker) {
        while (symbol.flags == SymbolFlags.Alias) {
            const alias = checker.getAliasedSymbol(symbol);
            const exportsAlias = alias.exports;
            if (alias.flags != SymbolFlags.TypeAlias && exportsAlias != undefined && exportsAlias.size > 0) {
                exportsAlias.forEach((value, key) => {
                    if (key === "prototype")
                        symbol = (<any>value).parent;
                    else
                        symbol = value;
                })
            } else
                return undefined;
        }
        return symbol;
    }

    isPathCorrect(symbolPath: string) {
        return symbolPath.length > 0;
    }

    async getNode(symbol: Symbol, filePath: string) {
        const name = symbol.getEscapedName().toString()
        if (!filePath.includes("/")) {
            console.log("No path for '" + filePath + "', it is a part of the base library ? A out of scope node '"+name+"' will be created");
            return await this.exportMutex.runExclusive(async () => {
                const node = await this.neoGraph.getOrCreateNode(name, this.symbolFlagsToEntityType(symbol.flags), [EntityAttribut.OUT_OF_SCOPE], []);
                const fileNode = await this.neoGraph.getOrCreateNodeWithPath(name, filePath, EntityType.FILE, [EntityAttribut.OUT_OF_SCOPE], []);
                await this.neoGraph.linkTwoNodes(node, fileNode, RelationType.EXPORT);
                return node;
            });
        } else if (symbol.flags === SymbolFlags.Method)
            return await this.neoGraph.getNodeByClass(name, filePath);
        else
            return this.neoGraph.getNodeWithFile(name, filePath);
    }

    symbolFlagsToEntityType(flags: SymbolFlags) {
        switch (flags) {
            case SymbolFlags.Interface:
                return EntityType.INTERFACE;
            default:
                console.log("Unknown conversion for "+flags)
                return EntityType.CLASS;
        }
    }

}