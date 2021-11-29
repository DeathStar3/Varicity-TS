import {Body, Controller, Get, Param, Post, Query} from '@nestjs/common';
import {ConfigService} from '../service/config.service';
import {VaricityConfig} from '../model/config.model';


@Controller()
export class ConfigController {

    constructor(private readonly configService: ConfigService) {
    }

    @Post('/projects/configs')
    saveConfig(@Body() config: VaricityConfig): VaricityConfig {
        console.log("/projects/configs - saveConfig, ", config)
        return this.configService.saveConfig(config);
    }

    @Get('/projects/configs')
    getConfigsOfProject(@Query() query: Record<string, any>): VaricityConfig[] {
        console.log("/projects/configs - getConfigsOfProject", query)
        return this.configService.getConfigsFromProjectName(query['name']);
    }

    // @Get('/projects/configs/names')
    // getConfigsNamesOfProject(@Query() query: Record<string, any>): string[] {
    //     console.log("/projects/configs/names - getConfigsNamesOfProject", query)
    //     return this.configService.loadConfigFilesNames(query['name']);
    // }

    // @Get('/projects/:projectName/configs/:configName')
    // getConfigByNameFromProject(@Param('projectName') projectName: string, @Param('configName') configName: string): VaricityConfig {
    //     console.log("/projects/{" + projectName + "}/configs/{" + configName + "} - getConfigByNameFromProject");
    //     return this.configService.getConfigByNameFromProject(projectName, configName);
    // }

    @Get('/projects/configs/path')
    getConfigByNameFromProject(@Query() query: Record<string, any>): VaricityConfig {
        console.log("/projects/configs/paths/{" + query["configPath"] + "} - getConfigsFromPath");
        return this.configService.getConfigsFromPath(query["configPath"]);
    }

    @Get('/projects/configs/firstOrDefault')
    getFirstOrDefaultConfigProject(@Query() query: Record<string, any>): VaricityConfig {
        console.log("/projects/configs/firstOrDefault - getFirstOrDefaultConfigProject", query)
        return this.configService.getFirstProjectConfigOrDefaultOne(query['name']);
    }

    // @Get('/configs')
    // getConfigsOfUser(@Query() query: Record<string, any>): VaricityConfig[] {
    //     console.log("/configs - getConfigsOfUser", query)
    //     // TODO
    //     return [];
    // }
}
