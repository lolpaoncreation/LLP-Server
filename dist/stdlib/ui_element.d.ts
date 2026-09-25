import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
export interface PendingUiUpdate {
    id: string;
    prop: string;
    value: any;
}
export declare class UIElementManager {
    private static instance;
    rootUI: Instance;
    elementsMap: Map<string, Instance>;
    pendingUpdates: PendingUiUpdate[];
    private hasAutoLoaded;
    private constructor();
    static getInstance(): UIElementManager;
    addPendingUpdate(id: string, prop: string, value: any): void;
    getAndClearPendingUpdates(): PendingUiUpdate[];
    autoLoad(baseDir?: string): boolean;
    loadIllpFile(filePath: string): Instance;
    getElement(nameOrId: string): Instance | null;
    setText(nameOrId: string, text: string): boolean;
    getText(nameOrId: string): string;
    setValue(nameOrId: string, val: any): boolean;
    getValue(nameOrId: string): any;
    setVisible(nameOrId: string, visible: boolean): boolean;
    applyBrowserEvent(id: string, event: string, value: any): void;
}
export declare function registerUI(env: Environment): void;
