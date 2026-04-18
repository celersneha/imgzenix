# ImgZenix

Image Drive is a full-stack app for managing folders and images with user-level isolation and MCP support.

## Live URLs -

imgzenix.vercel.app

## Important Functionality

- User authentication (register/login/logout).
- Folder management:
  - Create folders (root or nested).
  - List folders.
  - Resolve folders by name.
  - Delete folders (including nested content).
- Image management:
  - Upload images.
  - List images by folder.
  - Resolve image by name.
  - Delete image by id or by name.
- Per-user data isolation:
  - All folder/image operations are scoped to the authenticated user.
- API Key management:
  - User can create API keys.
  - User can list and revoke API keys.
  - API keys are used for MCP authentication.

## MCP Setup (Claude Desktop)

This project is currently connected in Claude Desktop using `mcp-remote` (stdio bridge) to the hosted MCP HTTP endpoint.

### 1. Create API Key

1. Open app: https://imgzenix.vercel.app
2. Login.
3. Open API Keys page.
4. Create a key and copy it once.

### 2. Update Claude Desktop Config

Config file location (Windows):

`%APPDATA%\\Claude\\claude_desktop_config.json`

Or go in Claude desktop > file > settings > developer > edit config

Use this server entry:

```json
{
  "mcpServers": {
    "dobby-prod": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://imgzenix.onrender.com/mcp",
        "--transport",
        "http-only",
        "--header",
        "X-API-Key:${DOBBY_API_KEY}"
      ],
      "env": {
        "DOBBY_API_KEY": "PASTE_YOUR_API_KEY"
      }
    }
  }
}
```

Notes:

- Keep `X-API-Key:${DOBBY_API_KEY}` format exactly.
- Do not use `--allow-http` for production HTTPS URL.
- Restart Claude Desktop after saving config.

### 3. Verify Connection

1. Open Claude Desktop.
2. Confirm MCP server loads (no disconnected state).
3. Ask Claude to call MCP tools, for example:
   - "List my folders"
   - "Create a folder named MCP Test"

## MCP Workflow

1. User creates API key from the app.
2. Claude Desktop sends MCP requests to `https://dobby-ads-xqkn.onrender.com/mcp` (via `mcp-remote`).
3. Backend extracts API key from header (`X-API-Key` or `Authorization`).
4. Backend validates key and resolves the corresponding user.
5. MCP tools execute folder/image service methods using that user id.
6. Response is returned to Claude.

Result: a user can access only their own folders/images through MCP.

## Health Checks

- App health: `GET https://dobby-ads-xqkn.onrender.com/`
- MCP health: `GET https://dobby-ads-xqkn.onrender.com/mcp/health`
