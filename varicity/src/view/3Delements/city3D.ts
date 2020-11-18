import { Link } from './../../model/entities/link.interface';
import { Scene } from '@babylonjs/core';
import { Building3D } from './building3D';
import { District3D } from './district3D';
import { EntitiesList } from './../../model/entitiesList';
export class City3D {

    config: any;
    scene: Scene;

    districts: District3D[] = [];
    buildings: Building3D[] = [];
    links: Link[] = [];

    constructor(config: any, scene: Scene, entities: EntitiesList) {
        this.config = config;
        this.scene = scene;
        this.links = entities.links;
        this.init(entities);
    }

    private init(entities: EntitiesList) {
        let nextX = 0

        entities.districts.forEach(d => {
            let d3elem = new District3D(this.scene, d, 0, nextX - (d.getTotalWidth() / 2), 0);
            this.districts.push(d3elem);
            // d3elem.build();
            // d3elem.render(this.config);
            nextX += d3elem.elementModel.getTotalWidth() + 5; // 10 = padding between districts
        });

        entities.buildings.forEach(b => {
            let d3elem = new Building3D(this.scene, b, 0, nextX - (b.width / 2), 0);
            this.buildings.push(d3elem);
            // d3elem.build();
            // d3elem.render(this.config);
            nextX += d3elem.elementModel.width + 5; // 10 = padding between buildings
        });
    }

    private findSrcLink(name: string): Building3D {
        this.buildings.forEach(b => {
            if(b.getName() == name) return b;
        });
        this.districts.forEach(d => {
            let b = d.get(name);
            if(b != undefined) return b;
        });
        return undefined;
    }

    build() {
        this.districts.forEach(d => {
            d.build();
        });
        this.buildings.forEach(b => {
            b.build();
        });
        this.links.forEach(l => {
            let src = this.findSrcLink(l.source.name);
            let dest = this.findSrcLink(l.target.name);
            let type = l.type;
            if(src != undefined && dest != undefined) {
                src.link(dest, type);
            }
            else {
                console.log("massive error help tasukete kudasai");
            }
        });
    }

    render() {
        this.districts.forEach(d => {
            d.render(this.config);
        });
        this.buildings.forEach(b => {
            b.render(this.config);
        })
    }

}