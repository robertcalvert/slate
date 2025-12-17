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
├── frameworks/slate/       # Web framework
├── frameworks/chalk/       # Application framework
|
├── provider/typeorm/       # TypeORM DataProvider
├── provider/marko/         # Marko ViewProvider
|
└── apps/demo/              # Demo application
```

### Frameworks

#### `frameworks/slate/` – Web Framework

**Slate** is the web framework at the heart of the project, handling routing, middleware, and core web functionality. It provides a solid, flexible, and extendible foundation for building higher-level frameworks and applications

#### `frameworks/chalk/` – Application Framework

**Chalk** sits on top of Slate, providing opinionated patterns and tools that make building complete, full-featured applications faster and easier.

### Providers

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
