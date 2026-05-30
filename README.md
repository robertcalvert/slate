# Slate

**Slate** is a lightweight, *slightly* opinionated web framework that strikes a balance between convention and flexibility. It provides a solid foundation with clear default patterns, without getting in your way. You get structure where it helps, and freedom where it matters.

**Chalk**, built on top of Slate, is a *highly* opinionated application framework that provides higher-level patterns and tools to simplify building complete, full-featured applications.

## Inspiration

Slate draws inspiration from frameworks like [**Express**](https://expressjs.com/) and [**hapi**](https://hapi.dev/), tools known for their simplicity and extensibility. The aim is to preserve that ethos while providing just enough structure to simplify development without limiting flexibility.

Building on this foundation, Chalk draws from years of real-world experience, and plenty of lessons learned the hard way.

## Project Structure

The project has evolved into a monorepo, though splitting into multiple repositories may be considered later. For now, the focus is on keeping things approachable and easy to manage as a hobby project.

Here is an overview of the current structure:

```
├── frameworks/
│   ├── slate/                # Web framework
│   └── chalk/                # Application framework
│
├── middleware/
│   └── api-response/         # Structured API response middleware
│
├── providers/
│   ├── typeorm/              # TypeORM DataProvider
│   └── marko/                # Marko ViewProvider
│
└── apps/
    └── demo/                 # Demo application
```

### Frameworks

The project is built around two complementary frameworks that serve different stages of development:

#### `frameworks/slate/` – Web Framework

**Slate** is the web framework at the heart of the project, handling routing, middleware, and core web functionality. It provides a solid, flexible, and extendible foundation for building higher-level frameworks and applications

#### `frameworks/chalk/` – Application Framework

**Chalk** sits on top of Slate, providing higher-level opinionated patterns, conventions, and tools to make building complete, full-featured applications faster and easier.

### Middleware

Slate supports middleware that can extend the request/response pipeline with reusable functionality. Middleware can be applied globally or per-route, and custom middleware can be created to suit your application's needs.

The following middleware is currently available:

#### `middleware/api-response/` – Structured API Responses

Decorates the response object with an `api()` function for returning consistent, structured API responses. This ensures all API endpoints share a uniform response format, making consumption simpler and more predictable.

### Providers

Slate is designed to remain lightweight and agnostic, delegating specific concerns to **Providers**. These are modular integrations that connect Slate with third-party libraries, allowing you to swap in the tools you prefer without altering the core framework.

There are two primary types of providers:

*   **DataProviders**: Handle database interactions and ORM workflows. They abstract away the complexities of data persistence, letting you choose your preferred database layer (e.g. TypeORM, Prisma, Sequelize).
*   **ViewProviders**: Manage server-side rendering and template engines. They bridge the gap between Slate's routing and your chosen view technology (e.g. Marko, Pug, EJS, Handlebars), enabling flexible UI generation.

Currently, the following providers are available:

#### `providers/typeorm/` – TypeORM

Integrates **[TypeORM](https://typeorm.io/)** as a DataProvider, simplifying database access and ORM workflows.

#### `providers/marko/` – Marko

Integrates **[Marko](https://markojs.com/)** as a ViewProvider for fast, component-based rendering.

### Applications

#### `apps/demo/` – Demo Application

A reference implementation that demonstrates how Slate, Chalk, and extensions work together.
It serves as both an example and a testing ground for framework and extension development.

## Getting Started

To get up and running with the Slate framework and demo application:

### Prerequisites

* [Node.js](https://nodejs.org/) version 16.0.0 or higher

### Install Dependencies

1. Clone the repository:

   ```bash
   git clone https://github.com/robertcalvert/slate.git
   cd slate
   ```

2. Install dependencies for all packages:

   ```bash
   npm install
   ```

### Run the Demo Application

1. Start the demo app:

   ```bash
   npm run dev -w demo
   ```

2. Visit `http://localhost:3000` in your browser to view the running application.

## Development

### Working on Slate or Its Extensions

To make changes to the framework or any extension:

1. Navigate to the relevant package:

   ```bash
   cd frameworks/slate
   ```

2. Make your changes and test them locally as needed.

## Contributing

Slate is a personal project, so while contributions are welcome, please understand that responses or reviews may be slower than in larger, more active projects.

To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Make your changes.
4. Submit a pull request with a clear explanation of your work.
5. The changes will be reviewed as soon as possible.

Thank you for your interest in contributing!

## License

This project is under the copyright of the author.
For full details, see the [LICENSE](LICENSE.md) file.
