export type ProjectArchitecture = "client-server" | "monolithic";
export interface CreateProjectOptions {
    targetDir: string;
    projectName: string;
    architecture?: ProjectArchitecture;
    isExample?: boolean;
    author?: string;
    dbUser?: string;
    dbPassword?: string;
}
export interface ProjectInfo {
    name: string;
    architecture: ProjectArchitecture;
    clientEntry?: string;
    serverEntry?: string;
    entry?: string;
    projectKey?: string;
}
/**
 * Lit et analyse le fichier project.config pour déterminer l'architecture du projet.
 */
export declare function getProjectInfo(projectDir: string): ProjectInfo | null;
/**
 * Génère l'arborescence complète d'un projet LLP en fonction de l'architecture choisie.
 */
export declare function createProjectStructure(options: CreateProjectOptions): {
    success: boolean;
    architecture: ProjectArchitecture;
    filesCreated: string[];
    message: string;
};
/**
 * Construit un binaire .dll LLP avec signature magique, en-tête de métadonnées et flags en lecture seule.
 */
export declare function buildLlpDllBinary(libName: string, description: string, exportedSymbols?: string[]): Buffer;
/**
 * Applique strictement l'attribut lecture seule sur un fichier .dll
 */
export declare function setFileReadOnly(filePath: string): void;
/**
 * Supprime les fichiers qui ne sont pas des .dll dans lib/
 */
export declare function cleanNonDllFilesFromLib(libDir: string): number;
/**
 * Ajoute ou copie une librairie .dll dans le dossier lib/ d'un projet et applique le mode lecture seule.
 * Enforce la règle stricte que lib/ ne contient que des fichiers .dll en lecture seule.
 */
export declare function addLibraryToProject(projectDir: string, libSourceOrName: string, customContent?: Buffer | string): {
    success: boolean;
    libFile: string;
    message: string;
};
/**
 * Assure que le dossier lib/ ne contient que des fichiers .dll et qu'ils sont tous en lecture seule.
 */
export declare function enforceLibDirectoryProtection(projectDir: string): {
    totalDlls: number;
    cleaned: number;
};
