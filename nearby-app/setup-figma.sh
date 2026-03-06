#!/bin/bash

# NearBy App - Figma Integration Setup Script

echo "🎨 Setting up Figma integration for NearBy App..."
echo ""

# Check if .kiro directory exists
if [ ! -d ".kiro" ]; then
    echo "Creating .kiro directory..."
    mkdir -p .kiro/settings .kiro/steering .kiro/hooks
fi

# Check if MCP config exists
if [ ! -f ".kiro/settings/mcp.json" ]; then
    echo "⚠️  MCP configuration not found!"
    echo "Creating template MCP configuration..."
    
    cat > .kiro/settings/mcp.json << 'EOF'
{
  "mcpServers": {
    "figma": {
      "command": "uvx",
      "args": ["figma-mcp-server"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN_HERE"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
EOF
    
    echo "✅ Created .kiro/settings/mcp.json"
    echo ""
    echo "📝 Next steps:"
    echo "1. Get your Figma Personal Access Token from:"
    echo "   https://www.figma.com/developers/api#access-tokens"
    echo ""
    echo "2. Replace 'YOUR_TOKEN_HERE' in .kiro/settings/mcp.json with your token"
    echo ""
    echo "3. Restart Kiro or reconnect the MCP server"
    echo ""
else
    echo "✅ MCP configuration already exists"
fi

# Check if design system file exists
if [ -f ".kiro/steering/design-system.md" ]; then
    echo "✅ Design system rules already created"
else
    echo "⚠️  Design system rules not found at .kiro/steering/design-system.md"
fi

# Check if hook exists
if [ -f ".kiro/hooks/figma-code-connect.kiro.hook" ]; then
    echo "✅ Figma code connect hook already created"
else
    echo "⚠️  Figma hook not found at .kiro/hooks/figma-code-connect.kiro.hook"
fi

echo ""
echo "📚 Documentation:"
echo "- Read FIGMA_INTEGRATION_GUIDE.md for complete setup instructions"
echo "- Design system rules: .kiro/steering/design-system.md"
echo "- Figma hook: .kiro/hooks/figma-code-connect.kiro.hook"
echo ""
echo "🚀 Ready to integrate Figma!"
echo ""
echo "Example commands:"
echo '  "Generate the Home screen from Figma"'
echo '  "Update CategoryGrid to match Figma design"'
echo '  "Check if components match Figma designs"'
echo ""
