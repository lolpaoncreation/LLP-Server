export type ProjectArchitecture = "client-server" | "monolithic";
export interface CreateProjectOptions {
    targetDir: string;
    projectName: string;
    architecture?: ProjectArchitecture;
    isExample?: boolean;
    author?: string;
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
