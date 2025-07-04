import { WebContainer } from '@webcontainer/api';
import { useEffect, useState } from 'react';

let webcontainerInstance: WebContainer | null = null;
export const useWebContainer = () => {
    const [webcontainer, setwebcontainer] = useState<WebContainer>();

    async function main() {
        if (!webcontainerInstance) {
            webcontainerInstance = await WebContainer.boot();
        }
        setwebcontainer(webcontainerInstance);
    }

    useEffect(()=>{
        main();
    }, []);

    return webcontainer;
}

export const getWebContainerInstance = () => webcontainerInstance;