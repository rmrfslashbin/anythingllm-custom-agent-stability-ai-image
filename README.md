// File: stability-ai-image/README.md

# Stability AI Image Generator

A custom agent skill for AnythingLLM that provides access to Stability AI's image generation services.

## Features

- Text-to-image generation using Stability AI's API
- Support for multiple SD models (defaults to sd3.5-large-turbo)
- Comprehensive error handling and user feedback
- Extensible architecture for future capabilities

## Installation

1. Navigate to your AnythingLLM storage directory's plugins/agent-skills folder
2. Clone this repository:
```bash
git clone https://github.com/yourusername/stability-ai-image.git
```
3. Install dependencies:
```bash
cd stability-ai-image
yarn install
```
4. Configure your Stability AI API key in the AnythingLLM interface

## Usage

The agent can be invoked to generate images from text descriptions. Example prompts:

```
@agent Please generate an image of a sunset over mountains
@agent Create an image of a futuristic city with flying cars
```

## Configuration

The following environment variables are required:
- `STABILITY_API_KEY`: Your Stability AI API key

## Development

### Prerequisites
- Node.js v22.9.0+
- Yarn
- VSCode (recommended)

### Setup Development Environment
```bash
# Clone the repository
git clone https://github.com/yourusername/stability-ai-image.git

# Install dependencies
cd stability-ai-image
yarn install

# Run tests
yarn test

# Run linting
yarn lint
```

### Project Structure
```
stability-ai-image/
├── lib/
│   └── stability-ai-client.js
├── __tests__/
│   └── handler.test.js
├── handler.js
├── plugin.json
├── run.js
└── package.json
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Author

Robert Sigler ([@rmrfslashbin](https://github.com/rmrfslashbin))
