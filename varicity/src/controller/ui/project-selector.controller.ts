import { CurrentProjectListener } from "../../configsaver/listener/current-project-listener";
import { EntitiesList } from "../../model/entitiesList";
import { ProjectService } from "../../services/project.service";
import { EvostreetImplem } from "../../view/evostreet/evostreetImplem";
import { ConfigLoader } from "../parser/configLoader";
import { ParsingStrategy } from '../parser/strategies/parsing.strategy.interface';
import { VPVariantsStrategy } from "../parser/strategies/vp_variants.strategy";
import { UIController } from "./ui.controller";
import {Config} from "../../model/entitiesImplems/config.model";

export class ProjectController {

    static el: EntitiesList;
    private static previousParser: ParsingStrategy;
    private static filename: string;

    private static projectListener:CurrentProjectListener=new CurrentProjectListener();

    static createProjectSelector(keys: string[]) {
        let parent = document.getElementById("project_selector");

        parent.addEventListener('change', function(event) {
            const projectName = (event.target as HTMLInputElement).value;
            if(projectName !== undefined){
                ProjectController.loadProject(projectName);
                parent.childNodes[0].nodeValue = "Project selection: " + projectName;
            }
        });

        for (let key of keys) {
            let node = document.createElement("option") as HTMLOptionElement;
            node.value=key
            node.text= key;
            
            parent.appendChild(node);

            // projets en vision evostreet
            node.addEventListener("click", () => {
                console.log("teeest")
                this.previousParser = new VPVariantsStrategy();
                this.filename = key;
                this.reParse();

                const run = async () => {

                    await UIController.reloadConfigAndConfigSelector(this.filename);

                    // TODO find alternative
                    await ProjectService.fetchVisualizationData(this.filename).then(async (response) => {
                        // const config = (await ConfigLoader.loadDataFile(this.filename)).data
                        let config: Config;
                        await ConfigLoader.loadConfig(ConfigLoader.loadDataFile(this.filename)).then((res) => config = res);
                        console.log("config", config)
                        this.el = this.previousParser.parse(response.data, config, this.filename);
                        let inputElement = document.getElementById("comp-level") as HTMLInputElement;
                        UIController.scene = new EvostreetImplem(config, this.el.filterCompLevel(+inputElement.value));
                        UIController.scene.buildScene();
                    })

                    this.projectListener.projectChange(key);
                }
                run().then();

                parent.childNodes[0].nodeValue = "Project selection: " + key;
            });
        }

    }

    public static loadProject(projectName: string){
        this.previousParser = new VPVariantsStrategy();
        this.filename = projectName;
        this.reParse();

        const run = async () => {

            await UIController.reloadConfigAndConfigSelector(this.filename);

            // TODO find alternative
            await ProjectService.fetchVisualizationData(this.filename).then(async (response) => {
                // const config = (await ConfigLoader.loadDataFile(this.filename)).data
                let config: Config;
                await ConfigLoader.loadConfig(ConfigLoader.loadDataFile(this.filename)).then((res) => {config = res});
                this.el = this.previousParser.parse(response.data, config, this.filename);
                let inputElement = document.getElementById("comp-level") as HTMLInputElement;

                // TODO display the correct config option on project startup
                // let parent = document.getElementById("config_selector");

                UIController.scene = new EvostreetImplem(config, this.el.filterCompLevel(+inputElement.value));
                UIController.scene.buildScene();
            })

            this.projectListener.projectChange(projectName);
        }
        run().then();
    }

    public static reParse() {
        if (UIController.scene) {
            UIController.scene.dispose();
        }

        UIController.clearMap();
    }
}
