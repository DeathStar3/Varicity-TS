import { Link3D } from './../3Dinterfaces/link3D.interface';
import { Config } from './../../../model/entitiesImplems/config.model';
import { Color3, Color4, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from '@babylonjs/core';
import { Building3D } from './building3D';

export class UndergroundRoad3DImplem implements Link3D {
    scene: Scene;

    src: Building3D;
    dest: Building3D
    type: string;

    mesh: Mesh;
    polyhedron: Mesh

    force: boolean = false;

    constructor(src: Building3D, dest: Building3D, type: string, scene: Scene) {
        this.src = src;
        this.dest = dest;
        this.type = type;
        this.scene = scene;
    }

    render(config: Config): void {
        this.mesh = MeshBuilder.CreateBox("box", {
            width: this.src.getWidth() / 2,
            height: this.src.getHeight() * 4,
            depth: this.src.getLength() / 2
        },
            this.scene);

        let midBox: Vector3 = this.src.bot.add(new Vector3(0, - this.src.getHeight() * 2, 0))
        let botBox: Vector3 = midBox.add(new Vector3(0, - this.src.getHeight() * 2, 0));
        this.mesh.setPositionWithLocalVector(midBox);

        let pts: Vector3[] = [];

        // for (let i = 0; i < 100; i++) {
        //     pts.push(
        //         botBox.add(this.dest.bot.scale(i / 100)),
        //         botBox.add(this.dest.bot.scale(i / 100)).add(new Vector3(- this.src.getWidth() / 2, 0, 0)),
        //         botBox.add(this.dest.bot.scale(i / 100)).add(new Vector3(this.src.getWidth() / 2, 0, 0))
        //     );
        // }
        pts.push(
            this.dest.bot,
            botBox.add(new Vector3(- this.src.getWidth() / 2, 0, 0)),
            botBox.add(new Vector3(this.src.getWidth() / 2, 0, 0)));

        this.polyhedron = MeshBuilder.CreateRibbon("ribbon", { pathArray: [pts], closeArray: true, closePath: false }, this.scene);

        // this.polyhedron = MeshBuilder.CreatePolyhedron("polyhedron", {
        //     type: 5,
        //     sizeX: this.src.getWidth() / 2,
        //     sizeZ: this.src.getLength() / 2,
        //     sizeY: 1
        // }, 
        // this.scene);
        // this.polyhedron.setPositionWithLocalVector(botBox);

        this.mesh.visibility = 0; // defaults at hidden
        this.polyhedron.visibility = 0;

        let mat = new StandardMaterial(this.mesh.name + "Mat", this.scene);
        if (config.link.colors) {
            for (let c of config.link.colors) {
                if (c.name == this.type) {
                    mat.ambientColor = Color3.FromHexString(c.color);
                    mat.diffuseColor = Color3.FromHexString(c.color);
                    mat.emissiveColor = Color3.FromHexString(c.color);
                    mat.specularColor = Color3.FromHexString(c.color);
                    mat.backFaceCulling = false;
                    this.mesh.material = mat;
                    this.polyhedron.material = mat;
                    return;
                }
            }
        }
    }
    display(force?: boolean): void {
        if (force != undefined) this.force = force;
        if (!this.force && this.mesh.visibility == 1) {
            this.polyhedron.visibility = 0;
            this.mesh.visibility = 0;
        } else {
            if (force == undefined || this.force) {
                this.mesh.visibility = 1;
                this.polyhedron.visibility = 1;
            }
        }
    }
}