import { RuntimeVal } from "./values";
export declare class Instance {
    ClassName: string;
    Name: string;
    SourceFile: string;
    private _parent;
    private _children;
    properties: Map<string, RuntimeVal>;
    private childAddedListeners;
    private childRemovedListeners;
    constructor(className?: string, parent?: Instance | null, sourceFile?: string);
    get Parent(): Instance | null;
    SetParent(newParent: Instance | null): void;
    AddChild(child: Instance): void;
    RemoveChild(child: Instance): void;
    GetChildren(): Instance[];
    FindFirstChild(name: string): Instance | null;
    GetDescendants(): Instance[];
    Destroy(): void;
    Clone(): Instance;
    OnChildAdded(listener: (child: Instance) => void): void;
    OnChildRemoved(listener: (child: Instance) => void): void;
    private fireChildAdded;
    private fireChildRemoved;
    ToString(): string;
    SetProperty(propName: string, val: RuntimeVal): void;
    GetProperty(propName: string): RuntimeVal;
}
