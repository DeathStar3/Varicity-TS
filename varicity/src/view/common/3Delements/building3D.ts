import { Element3D } from '../3Dinterfaces/element3D.interface';
import {
    ActionManager, Color3,
    Color4,
    ExecuteCodeAction,
    Mesh,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Vector3
} from '@babylonjs/core';
import { Building } from '../../../model/entities/building.interface';
import { Link3D } from './link3D';

export class Building3D implements Element3D {
    elementModel: Building;
    scene: Scene;

    depth: number;

    center: Vector3;
    top: Vector3;
    bot: Vector3;

    d3Model: Mesh;
    d3ModelOutline: Mesh;

    links: Link3D[] = [];

    padding = 0.2;
    heightScale = 0.3;
    outlineWidth = 0.05;

    constructor(scene: Scene, buildingElement: Building, depth: number) {
        this.scene = scene;
        this.elementModel = buildingElement;
        this.depth = depth;
    }

    showAllLinks() {
        this.links.forEach(l => l.display());
    }

    getWidth(): number {
        return this.elementModel.getWidth() + this.padding; // 2.5 av 2.5 ap
        // return this.elementModel.getWidth();// 2.5 av 2.5 ap
    }

    getLength(): number {
        return this.getWidth();
    }

    getHeight(): number {
        return this.elementModel.getHeight()*this.heightScale;
    }

    getName() {
        return this.elementModel.fullName;
    }

    link(dest: Building3D, type: string) {
        this.links.push(new Link3D(this, dest, type, this.scene));
    }

    build() {
    }

    place(x: number, z: number) {
        let halfHeight = this.getHeight()/2;
        this.center = new Vector3(x, this.depth * 30 + halfHeight, z);
        this.top = this.center.add(new Vector3(0, halfHeight, 0));
        this.bot = this.center.add(new Vector3(0, -halfHeight, 0));
    }

    render(config: any) {
        // Display building
        this.d3Model = MeshBuilder.CreateBox(
            this.elementModel.name,
            {
                height: this.getHeight(),
                width: this.elementModel.getWidth(),
                depth: this.elementModel.getWidth()
            },
            this.scene);
        this.d3Model.setPositionWithLocalVector(this.center);

        this.d3Model.actionManager = new ActionManager(this.scene);
        const out = this.elementModel.toString();
        const links = this.links;
        this.d3Model.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnPointerOverTrigger
                },
                function () {
                    links.forEach(l => l.display());
                    document.getElementById("nodes_details").innerText = out;
                }
            )
        );
        this.d3Model.actionManager.registerAction(
            new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnPointerOutTrigger
                },
                function () {
                    links.forEach(l => l.display());
                }
            )
        );

        // if config -> building -> colors -> outline is defined
        if (config.building.colors.outlines) {
            let outlines = config.building.colors.outlines;
            let done = false;
            for (let o of outlines) {
                for (let type of this.elementModel.types) {
                    if (type == o.name) {
                        this.d3ModelOutline = MeshBuilder.CreateBox(
                            this.elementModel.name,
                            {
                                height: this.getHeight() + this.outlineWidth,
                                width: this.elementModel.getWidth() + this.outlineWidth,
                                depth: this.elementModel.getWidth() + this.outlineWidth,
                                sideOrientation: Mesh.BACKSIDE,
                                updatable: false
                            },
                            this.scene);
                        var outlineMat = new StandardMaterial('outlineMaterial', this.scene);
                        this.d3ModelOutline.material = outlineMat;
                        this.d3ModelOutline.parent = this.d3Model;
                        outlineMat.diffuseColor = Color3.FromHexString(o.color);
                        outlineMat.emissiveColor = Color3.FromHexString(o.color);
                        done = true;
                        break;
                    }
                }
                if (done) break;
            }
        } else {
            this.d3Model.renderOutline = false;
        }

        // if config -> building -> colors -> edges is defined
        if (config.building.colors.edges) {
            this.d3Model.outlineWidth = 0.1;
            this.d3Model.edgesColor = Color4.FromHexString(config.building.colors.edges);
        } else {
            this.d3Model.outlineWidth = 0.1;
            this.d3Model.edgesColor = new Color4(1, 0, 0);
        }

        var mat = new StandardMaterial(this.elementModel.name + "Mat", this.scene);
        if (config.force_color) {
            mat.ambientColor = Color3.FromHexString(config.force_color);
            mat.diffuseColor = Color3.FromHexString(config.force_color);
            mat.emissiveColor = Color3.FromHexString(config.force_color);
            mat.specularColor = Color3.FromHexString(config.force_color);
        } else {
            if (config.building.colors.faces) {
                let faces = config.building.colors.faces;
                let done = false;
                for (let face of faces) {
                    for (let type of this.elementModel.types) {
                        if (type == face.name) {
                            mat.ambientColor = Color3.FromHexString(face.color);
                            mat.diffuseColor = Color3.FromHexString(face.color);
                            mat.emissiveColor = Color3.FromHexString(face.color);
                            mat.specularColor = Color3.FromHexString(face.color);
                            done = true;
                            break;
                        }
                    }
                    if (done) break;
                }
                if (!done) {
                    mat.ambientColor = Color3.FromHexString(config.building.colors.faces[0].color);
                    mat.diffuseColor = Color3.FromHexString(config.building.colors.faces[0].color);
                    mat.emissiveColor = Color3.FromHexString(config.building.colors.faces[0].color);
                    mat.specularColor = Color3.FromHexString(config.building.colors.faces[0].color);
                }
            } else {
                mat.ambientColor = new Color3(1, 0, 0);
                mat.diffuseColor = new Color3(1, 0, 0);
                mat.emissiveColor = new Color3(1, 0, 0);
                mat.specularColor = new Color3(1, 0, 0);
            }
        }
        // if config -> building -> colors -> faces is defined

        this.d3Model.material = mat;

        // Display links to other buildings
        this.links.forEach(l => {
            l.render(config);
        });
    }
}