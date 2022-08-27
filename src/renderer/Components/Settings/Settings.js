import Setting from '../Setting/Setting';
import Header from '../Header/Header';
import Button from '../Button/Button';

import Events from 'renderer/Events/Events';
import { useState, useMemo } from 'react';
import { nanoid } from 'nanoid';
import './settings.css';
/**
 * Component that displays current settings, using the `Setting` component, and
 * allows to modify them. The settings `customCSS` and `firstTime` should not be
 * displayed nor modified, and the new settings should be saved automatically.
 * This component should also allow to reset the settings, reset the library and
 * to go through the tutorial again.
 */
export default function Settings() {

    // Variable that stores current settings
    const [settings, setSettings] = useState({});
    
    useMemo(() => Events.fire('getSettings', setSettings), []);

    function changeSetting(setting, newValue) {
        let newSettings = {...settings};
        newSettings[setting] = newValue;
        setSettings(newSettings)
        Events.fire('setSettings', newSettings);
    }

    const renderedSettings =  [];
    for (const setting in settings) {
        // Custom CSS should not be rendered
        if (setting == 'firstTime') continue;

        const modify = (newValue) => changeSetting(setting, newValue);
        renderedSettings.push(
            <div key={nanoid()}>
                <div className='spacer-24' />
                <Setting settingName={setting} setting={settings[setting]} modify={modify} key={nanoid()}/>
            </div>
        );
    }

    let settingButtons = [
        { onClick: () => Events.fire('resetSettings', setSettings), text: 'Reset Settings' },
        { onClick: () => Events.fire('resetLibrary'), text: 'Reset Library' },
        { onClick: () => Events.fire('displayTutorial'), text: 'Tutorial' }
    ];
    settingButtons = settingButtons.map(button =>
        <Button onClick={button.onClick} type='outline' key={nanoid()}>{button.text}</Button>    
    )

    return (
        <>
            <Header /><div className='header-placeholder' />
            
            <div id='settings'>
                <div className='row justify-content-center'>
                    <div className='col-11'>
                        <div className='spacer-48' />
                        <h1>Settings:</h1>
                        <div className='spacer-24' />
                        {renderedSettings}
                        <div className='spacer-100' />
                        {settingButtons}
                    </div>
                </div>
            </div>
        </>
    )
}