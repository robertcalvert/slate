# Slate

**Slate** is a lightweight, *slightly* opinionated web framework that strikes a balance between convention and flexibility. It provides a solid foundation with clear default patterns—without getting in your way. You get structure where it helps, and freedom where it matters.

## Inspiration

Slate draws inspiration from frameworks like [**Express**](https://expressjs.com/) and [**hapi**](https://hapi.dev/), tools known for their simplicity and flexibility. The aim is to preserve that ethos while offering a bit more structure when it adds value.

## Project Structure

Slate has evolved into a monorepo, though splitting into multiple repositories may be considered later. For now, the focus is on keeping things approachable and easy to manage as a hobby project.

Here is an overview of the current structure:

```
├── frameworks/slate/       # Core web framework
├── plugins/typeorm/        # TypeORM DataProvider plugin
├── plugins/marko/          # Marko ViewProvider plugin
└── app/demo/               # Demo application
```

### `frameworks/slate/` – Core Web Framework

The heart of the project. This is where the framework itself lives.

### `plugins/typeorm/` – TypeORM Plugin

Integrates **[TypeORM](https://typeorm.io/)** as a DataProvider for streamlined ORM and database support.

### `plugins/marko/` – Marko Plugin

Adds **[Marko](https://markojs.com/)** as a ViewProvider, enabling fast, component-based template rendering.

### `app/demo/` – Demo Application

Demonstrates how to build with Slate, highlighting how the core framework works alongside plugins.

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

### Working on Slate or Its Plugins

To make changes to the framework or any plugin:

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
For full details, see the [LICENSE](LICENSE) file.
