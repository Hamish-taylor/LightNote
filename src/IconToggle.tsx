import { useState } from 'react';

function IconToggle({ icon1: Icon1, icon2: Icon2, onClick }) {
    const [active, setActive] = useState(false);

    const toggleIcons = () => {
        setActive(!active);
        if (onClick) {
            onClick();
        }
    };

    return (
        <label className="cursor-pointer" onClick={toggleIcons}>
            <Icon1
                className={`icon1 transition-opacity duration-300 ease-in-out ${active ? 'opacity-0' : 'opacity-100'} absolute`}
            />
            <Icon2
                className={`icon2 transition-opacity duration-300 ease-in-out ${active ? 'opacity-100' : 'opacity-0'} text-centerabsolute`}
            />
        </label>
    );
}

export default IconToggle;
