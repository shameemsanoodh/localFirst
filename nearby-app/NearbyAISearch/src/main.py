import os
import json
from strands import Agent, tool
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from model.load import load_model

app = BedrockAgentCoreApp()
log = app.logger

REGION = os.getenv("AWS_REGION", "us-east-1")

# Sample categories from the NearBy app
CATEGORIES = [
    "Food & Beverages",
    "Groceries & Vegetables",
    "Electronics & Appliances",
    "Fashion & Clothing",
    "Health & Medical",
    "Home Services",
    "Automotive",
    "Beauty & Personal Care"
]

@tool
def detect_product_category(query: str) -> dict:
    """
    Analyze a product search query and detect the most relevant category.
    
    Args:
        query: The user's search query (e.g., "fresh tomatoes", "laptop repair")
    
    Returns:
        Dictionary with detected category, confidence score, and keywords
    """
    query_lower = query.lower()
    
    # Simple keyword-based detection (in production, this would use ML)
    category_keywords = {
        "Food & Beverages": ["food", "restaurant", "cafe", "pizza", "burger", "coffee", "tea", "snacks"],
        "Groceries & Vegetables": ["vegetables", "fruits", "grocery", "tomato", "potato", "onion", "milk", "bread"],
        "Electronics & Appliances": ["laptop", "phone", "tv", "computer", "electronics", "appliance", "refrigerator"],
        "Fashion & Clothing": ["clothes", "shirt", "pants", "dress", "shoes", "fashion", "wear"],
        "Health & Medical": ["medicine", "doctor", "hospital", "pharmacy", "health", "medical"],
        "Home Services": ["plumber", "electrician", "repair", "cleaning", "service"],
        "Automotive": ["car", "bike", "vehicle", "automotive", "mechanic", "tire"],
        "Beauty & Personal Care": ["salon", "spa", "beauty", "haircut", "massage", "cosmetics"]
    }
    
    best_match = None
    best_score = 0
    
    for category, keywords in category_keywords.items():
        score = sum(1 for keyword in keywords if keyword in query_lower)
        if score > best_score:
            best_score = score
            best_match = category
    
    confidence = min(best_score / 3.0, 1.0)  # Normalize to 0-1
    
    return {
        "category": best_match or "General",
        "confidence": confidence,
        "query": query,
        "matched_keywords": [kw for kw in category_keywords.get(best_match, []) if kw in query_lower]
    }

@tool
def generate_search_suggestions(query: str, max_suggestions: int = 5) -> list:
    """
    Generate autocomplete suggestions for a search query.
    
    Args:
        query: Partial search query
        max_suggestions: Maximum number of suggestions to return
    
    Returns:
        List of suggested search terms
    """
    # Sample product database (in production, this would query DynamoDB)
    products = [
        "Fresh Tomatoes", "Organic Potatoes", "Green Vegetables",
        "Laptop Repair Service", "Mobile Phone", "LED TV",
        "Pizza Delivery", "Coffee Shop", "Fresh Bread",
        "Plumbing Service", "Electrician", "House Cleaning",
        "Hair Salon", "Beauty Spa", "Massage Therapy"
    ]
    
    query_lower = query.lower()
    suggestions = [p for p in products if query_lower in p.lower()]
    
    return suggestions[:max_suggestions]

@tool
def analyze_product_image(image_description: str) -> dict:
    """
    Analyze a product image description and identify the product.
    
    Args:
        image_description: Description of the image (in production, this would be base64 image)
    
    Returns:
        Dictionary with detected product, category, and confidence
    """
    # In production, this would use Amazon Bedrock's vision capabilities
    # For now, we'll simulate based on description
    
    return {
        "detected_product": f"Product from image: {image_description}",
        "suggested_category": "General",
        "confidence": 0.75,
        "alternative_interpretations": [
            "Could be a similar product",
            "Might be a related item"
        ]
    }

@tool
def generate_followup_questions(query: str, detected_category: str) -> list:
    """
    Generate follow-up questions to clarify ambiguous search queries.
    
    Args:
        query: The user's search query
        detected_category: The detected category
    
    Returns:
        List of follow-up questions
    """
    questions = []
    
    if detected_category == "General" or not detected_category:
        questions.append("What type of product are you looking for?")
        questions.append("Is this for food, electronics, or services?")
    else:
        questions.append(f"Are you looking for {detected_category.lower()}?")
        questions.append("Do you need this delivered or for pickup?")
        questions.append("What's your preferred price range?")
    
    return questions[:3]

@app.entrypoint
async def invoke(payload, context):
    """
    Main entrypoint for the AI Search agent.
    
    Handles:
    - Product search queries
    - Category detection
    - Image-based product identification
    - Search suggestions
    - Follow-up questions for ambiguous queries
    """
    session_id = getattr(context, 'session_id', 'default')
    user_id = payload.get("user_id", 'default-user')
    
    log.info(f"Processing search request for user: {user_id}, session: {session_id}")
    
    # Create agent with specialized system prompt for search
    agent = Agent(
        model=load_model(),
        system_prompt=f"""
You are an AI-powered search assistant for the NearBy local commerce platform.

Your responsibilities:
1. Analyze user search queries to understand their intent
2. Detect the most relevant product category from: {', '.join(CATEGORIES)}
3. Provide autocomplete suggestions as users type
4. Identify products from image descriptions
5. Ask clarifying follow-up questions for ambiguous queries
6. Help users find local merchants and products

Guidelines:
- Be conversational and helpful
- If the query is unclear, ask follow-up questions
- Always provide category suggestions with confidence scores
- For image-based searches, describe what you detect
- Suggest related products when appropriate
- Keep responses concise and actionable

Available tools:
- detect_product_category: Analyze queries and detect categories
- generate_search_suggestions: Provide autocomplete suggestions
- analyze_product_image: Identify products from images
- generate_followup_questions: Ask clarifying questions

Always use tools to provide accurate, data-driven responses.
        """,
        tools=[
            detect_product_category,
            generate_search_suggestions,
            analyze_product_image,
            generate_followup_questions
        ]
    )

    # Get the user's prompt
    user_prompt = payload.get("prompt", "")
    
    # Execute and stream response
    stream = agent.stream_async(user_prompt)

    async for event in stream:
        # Handle text parts of the response
        if "data" in event and isinstance(event["data"], str):
            yield event["data"]
        
        # Handle tool use events
        if "toolUse" in event:
            tool_name = event["toolUse"].get("name", "unknown")
            log.info(f"Tool used: {tool_name}")

if __name__ == "__main__":
    app.run()
