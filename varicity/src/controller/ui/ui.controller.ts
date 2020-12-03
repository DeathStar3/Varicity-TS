import { Building3D } from './../../view/common/3Delements/building3D';
import { Color } from '../../model/entities/config.interface';
import { Config } from '../../model/entitiesImplems/config.model';
import { SceneRenderer } from '../../view/sceneRenderer';
import { ConfigController } from './config.controller';
import { DetailsController } from './details.controller';
import { ProjectController } from './project-selector.controller';

export class UIController {

    public static scene: SceneRenderer;
    public static config: Config;

    public static createHeader(): void {

    }

    public static createProjectSelector(keys: string[]): void {
        ProjectController.createProjectSelector(keys);
    }

    public static createConfig(config: Config): void {
        this.config = config;
        ConfigController.createConfigFolder(config);
    }

    public static displayObjectInfo(obj: Building3D): void {
        DetailsController.displayObjectInfo(obj);
    }

    public static createFooter(): void {

    }

    public static changeConfig(arr: string[], value: [string, string] | Color) {
        Config.alterField(this.config, arr, value);
        if (this.scene) {
            this.scene = this.scene.rerender(this.config);
            this.scene.buildScene();
        }
        else {
            console.log("not initialized");
        }
    }
}