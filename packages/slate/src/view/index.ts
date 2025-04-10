// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import Path from 'path';

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
    private providers = new Map<string, ViewProvider>();    // Array of registered providers

    // Method to add a view provider to the handler
    use(provider: ViewProvider) {
        const ext = provider.ext.startsWith('.') ? provider.ext : `.${provider.ext}`;
        this.providers.set(ext, provider);
    }

    // Renders a view using the appropriate provider based on the file extension
    // Falls back to the first registered provider if no extension is given
    async render(req: Request, res: Response, path: string, input?: object) {
        const ext = Path.extname(path);
        const provider = ext ? this.providers.get(ext) : this.providers.values().next().value;

        if (!provider) {
            throw new Error(`No view provider registered for "${ext}" templates.`);
        }

        await provider.render(req, res, path, input);

    }

}
