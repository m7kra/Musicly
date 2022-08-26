import settings from 'electron-settings';
import fs from 'fs';
import { app } from 'electron';

const customCSSPath = app.getPath('userData') + `/css/custom.css`;

/**
 * Class that manages app settings. Settings are represented as an array
 * containing `subSettings`. These, in turn, have a property `type` which
 * determines what the other properties are and what should be displayed in the
 * `Settings` component.
 */
export default class Settings {

    /**
     * Gets app settings. If none are defined, return default settings.
     * @return {Object} settings
     */
    static async get() {
        // Get the stored settings and decide whether to use the default ones
        const definedSettings = await settings.get()
        let result = defaultSettings;
        
        if (Object.keys(definedSettings).length > 1) result = definedSettings;

        // Add custom CSS
        const customCSS = Settings.getCustomCss();
        result.customCSS = customCSS;
        
        return result;
    }

    /**
     * Store the provided `settings`
     * @param {Object} settings 
     */
    static async set(newSettings) {
        // `customCSS` is not saved
        delete newSettings.customCSS;
        await settings.set(newSettings);
    }

    /**
     * Stores the predefined settings.
     */
    static async reset() {
        // firstTime is never saved as true
        const temp = {...defaultSettings};
        temp.firstTime = false;
        await settings.set(temp);
    }

    /**
     * Gets the user-defined CSS, returning `''` if none is defined.
     * @return {string} CSS
     */
    static getCustomCss() {
        if (!fs.existsSync(customCSSPath)) return '';
        else return fs.readFileSync(customCSSPath).toString();
    }
}

const defaultSettings = {
    theme: {
        name: 'Theme',
        type: 'select',
        options: ['light', 'dark'],
        value: 'dark'
    },
    zoomFactor: {
        name: 'Zoom Factor',
        type: 'select',
        options: [0.7, 0.8, 0.9, 1, 1.2, 1.4, 1.6, 1.8],
        value: 1
    },
    customCSS: '',
    firstTime: true
}