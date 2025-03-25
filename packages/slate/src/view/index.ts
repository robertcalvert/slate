// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request } from '../core/request';
import { Response } from '../core/response';

// Interface for view providers, which are responsible for rendering views
// This allows support for new view templating engines to be easily added
export interface ViewProvider<T extends object = object> {
    // The function to handle template rendering
    render(req: Request, res: Response, options: T, path: string, input?: object): void;
}

// Class to handle the view provider and rendering
export class ViewHandler<T extends object = object> {
    // The current view provider, which must be set before rendering
    private provider?: ViewProvider;
    private options?: T;

    // Sets the view provider to be used for rendering
    use<U extends T>(provider: ViewProvider, options: U) {
        this.provider = provider;
        this.options = options;
    }

    // Renders a view using the registered provider
    render(req: Request, res: Response, path: string, input?: object) {
        // Ensure a provider has been registered before attempting to render
        if (!this.provider) throw new Error('No view provider has been registered.');

        this.provider.render(req, res, this.options!, path, input);
    }

}
