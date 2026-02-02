export interface ChangelogEntry {
    version: string;
    date: string;
    sections: {
        title: string;
        items: string[];
    }[];
}

export const changelog: ChangelogEntry[] = [
    {
        version: "0.1.0",
        date: "February 2, 2026",
        sections: [
            {
                title: "What's New",
                items: [
                    "Pen tool with bezier curves for creating custom vector paths",
                    "Canvas with zoom controls (zoom in, zoom out, fit to screen)",
                    "File menu with 'New Project' dialog to create animations",
                    "Dark and light theme toggle based on system preferences",
                    "Transform handles for resizing and moving shapes",
                    "Vector selection and manipulation tools",
                    "Shape tools for drawing rectangles and circles",
                    "Layers panel for organizing your artwork",
                    "Timeline panel for animation control",
                ],
            },
            {
                title: "Bug Fixes",
                items: [
                    "Fixed scroll area component in changelog dialog",
                    "Configured deployment settings for Vercel",
                ],
            },
        ],
    },
];
