import {Scene} from '@babylonjs/core';
import {Building3D} from '../3Delements/building3D';

export interface Link3D {
    scene: Scene;

    src: Building3D;
    dest: Building3D
    type: string;
    percentage: number;

    render(bool: boolean): void;

    // render(config: Config): void;

    display(force?: boolean, show?: boolean): void;
}