// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import Path from 'path';

import { Server } from '../server';

import { Request } from '../core/request';
import { Response } from '../core/response';

// Interface for view providers, which are responsible for rendering views
// This allows support for new view templating engines to be easily added
export interface ViewProvider {
    ext: string;   // The file extension of the template files

    // The function to handle template rendering
    render(req: Request, res: Response, path: string, input?: object): void | Promise<void>;
}

// Class to handle the view providers and rendering
export class ViewHandler {
    private readonly server: Server;                        // The server
    private providers = new Map<string, ViewProvider>();    // Array of registered providers

    // Initializes the view handler
    constructor(server: Server) {
        this.server = server;
    }

    // Method to add a provider to the handler
    use(provider: ViewProvider) {
        const ext = provider.ext.startsWith('.') ? provider.ext : `.${provider.ext}`;

        if (this.providers.has(ext)) {
            const message = `ViewProvider for "${ext}" templates is already registered.`;
            this.server.logger.error(message);
            throw new Error(message);
        }

        this.providers.set(ext, provider);
    }

    // Renders a view using the appropriate provider based on the file extension
    // Falls back to the first registered provider if no extension is given
    async render(req: Request, res: Response, path: string, input?: object) {
        const ext = Path.extname(path);
        const provider = ext
            ? this.providers.get(ext)
            : this.providers.values().next().value;

        if (!provider) {
            throw new Error(
                ext
                    ? `No ViewProvider registered for "${ext}" templates.`
                    : 'No ViewProviders have been registered.'
            );
        }

        await provider.render(req, res, path, input);

    }

}
