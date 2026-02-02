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
        version: "1.0.1",
        date: "February 2, 2026",
        sections: [
            {
                title: "New Features",
                items: [
                    "Added Direct Selection Tool for finer control over paths.",
                    "Introduced Dark/Light theme support.",
                ],
            },
            {
                title: "Bug Fixes",
                items: [
                    "Fixed an issue where shapes were created with incorrect sizes.",
                    "Resolved a bug with the Pen tool not finishing paths correctly.",
                    "Improved cursor visibility and sizing.",
                ],
            },
        ],
    },
    {
        version: "1.0.0",
        date: "January 20, 2026",
        sections: [
            {
                title: "Launch",
                items: [
                    "Initial release of the animation editor.",
                    "Basic drawing tools (Pen, Square, Circle).",
                    "Timeline and Layers panel.",
                ],
            },
        ],
    },
];
