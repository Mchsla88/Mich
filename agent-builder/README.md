# 🤖 Agent Builder

Visual AI Workflow Creator - Create and execute AI agent workflows with a drag-and-drop interface, inspired by Make.com.

![Agent Builder](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- **Visual Workflow Editor**: Drag-and-drop interface powered by ReactFlow
- **Multiple Node Types**:
  - 🚀 **Start**: Entry point for workflows
  - 🤖 **AI Agent**: Call AI models with custom prompts
  - 🌐 **API Call**: Make HTTP requests to external APIs
  - 🔀 **Conditional**: Branch based on conditions
  - 🔧 **Transform**: Transform data with custom JavaScript
  - 🏁 **Output**: Final workflow output
- **Workflow Execution**: Execute complex workflows with variable interpolation
- **Save/Load**: Persist workflows to backend
- **Real-time Configuration**: Configure nodes through an intuitive panel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd agent-builder
```

2. Install dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

4. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

### Running the Application

#### Option 1: Run everything together (from root)
```bash
npm run dev
```

#### Option 2: Run separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 📖 Usage

### Creating a Workflow

1. **Add Nodes**: Drag node types from the sidebar or click on them
2. **Connect Nodes**: Drag from one node's handle to another
3. **Configure Nodes**: Click on a node to open the configuration panel
4. **Save Workflow**: Click the "Save" button in the toolbar
5. **Execute Workflow**: Click "Run Workflow" to execute your agent flow

### Node Types Explained

#### Start Node
The entry point of your workflow. Every workflow must have exactly one start node.

#### AI Agent Node
Configure:
- **Prompt**: The prompt to send to the AI model
- **Model**: Choose between GPT-3.5 Turbo, GPT-4, or GPT-4 Turbo
- Use `{{variable}}` syntax to interpolate values from previous nodes

#### API Call Node
Configure:
- **API URL**: The endpoint to call
- **Method**: GET, POST, PUT, DELETE, or PATCH
- **Body**: Request body (for POST/PUT/PATCH requests)

#### Conditional Node
Configure:
- **Condition**: JavaScript expression that evaluates to true/false
- Example: `input.value > 10`
- Connect two edges: one labeled "true" and one labeled "false"

#### Transform Node
Configure:
- **Transform Code**: JavaScript code to transform data
- Function receives `input` (current data) and `variables` (all stored values)
- Must return a value
- Example: `return { result: input.value * 2 };`

#### Output Node
The final output of your workflow. Results will be returned here.

## 🏗️ Architecture

```
agent-builder/
├── frontend/          # React + TypeScript + ReactFlow
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── nodes/        # Custom node components
│   │   ├── App.tsx       # Main application
│   │   └── types.ts      # TypeScript types
│   └── package.json
├── backend/           # Node.js + Express
│   ├── src/
│   │   ├── index.ts      # Express server
│   │   ├── executor.ts   # Workflow execution engine
│   │   └── types.ts      # TypeScript types
│   └── package.json
└── package.json       # Root package.json
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
```

## 📡 API Endpoints

- `GET /api/health` - Health check
- `GET /api/workflows` - Get all workflows
- `POST /api/workflows` - Create a new workflow
- `GET /api/workflows/:id` - Get specific workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:id/execute` - Execute workflow

## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
npm run dev
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
npm run build
npm start
```

## 🎯 Roadmap

- [ ] Add more node types (Email, Database, Webhook)
- [ ] Implement real OpenAI API integration
- [ ] Add workflow templates
- [ ] Implement user authentication
- [ ] Add workflow versioning
- [ ] Create marketplace for community workflows
- [ ] Add debugging and step-through execution
- [ ] Implement workflow scheduling

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [ReactFlow](https://reactflow.dev/) - Powerful flow-based programming library
- [Express](https://expressjs.com/) - Fast, unopinionated web framework
- [Vite](https://vitejs.dev/) - Next generation frontend tooling

## 📧 Support

For support, please open an issue in the GitHub repository.

---

Made with ❤️ by the Agent Builder team
