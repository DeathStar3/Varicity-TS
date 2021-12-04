import {SubMenuController} from "./sub-menu.controller";
import {UIController} from "../ui.controller";

export class DistrictController {

    public static createMenu() {
        const parent = SubMenuController.getParentContentSubMenu();

        // Set title
        SubMenuController.changeTitleSubMenuElement("Districts");

        const menuPadding = SubMenuController.createMenu("Padding", true, parent);
        const menuFaceColors = SubMenuController.createMenu("Faces Color", true, parent);

        if (UIController.config) {

            // Fetch the attributes
            const padding = UIController.config.district.padding;
            const colors = UIController.config.district.colors;

            // Padding
            SubMenuController.createRange("Padding", padding, 0, 2, 0.1, menuPadding);

            // Face Colors
            // TODO
        }
    }
}
