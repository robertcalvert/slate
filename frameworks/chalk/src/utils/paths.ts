// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

// Base directories
export const appRoot: string = Path.dirname(require.main!.filename);
export const chalkRoot: string = Path.join(__dirname, '..');

// API handlers
export const appApiPath: string = Path.join(appRoot, 'api');
export const chalkApiPath: string = Path.join(chalkRoot, 'api');

// Page handlers
export const appPagesPath: string = Path.join(appRoot, 'pages');
export const chalkPagesPath: string = Path.join(chalkRoot, 'pages');

// Static assets (e.g., CSS, JavaScript)
export const appStaticPath: string = Path.join(appRoot, 'static', 'public');
export const chalkStaticPath: string = Path.join(chalkRoot, 'static', 'public');

// View templates
export const appViewsPath: string = Path.join(appRoot, 'views');
export const chalkViewsPath: string = Path.join(chalkRoot, 'views');

// Entity definitions
export const appEntitiesPath: string = Path.join(appRoot, 'entities/**/*{.ts,.js}');
export const chalkEntitiesPath: string = Path.join(chalkRoot, 'entities/**/*{.ts,.js}');
