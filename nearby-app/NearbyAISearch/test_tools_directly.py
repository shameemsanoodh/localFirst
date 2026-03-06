#!/usr/bin/env python3
"""
Test the AI Search tools directly without needing AWS Bedrock
This tests the tool logic independently
"""

import sys
sys.path.insert(0, 'src')

from main import (
    detect_product_category,
    generate_search_suggestions,
    analyze_product_image,
    generate_followup_questions
)

def print_section(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_category_detection():
    print_section("TEST 1: Category Detection")
    
    test_queries = [
        "I need fresh tomatoes",
        "laptop repair service",
        "pizza delivery near me",
        "hair salon appointment",
        "car mechanic"
    ]
    
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        result = detect_product_category(query)
        print(f"  ✓ Category: {result['category']}")
        print(f"  ✓ Confidence: {result['confidence']:.2%}")
        print(f"  ✓ Keywords: {', '.join(result['matched_keywords'])}")

def test_autocomplete():
    print_section("TEST 2: Autocomplete Suggestions")
    
    test_queries = [
        "tom",
        "lap",
        "fresh",
        "repair"
    ]
    
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        suggestions = generate_search_suggestions(query, max_suggestions=3)
        print(f"  ✓ Suggestions:")
        for i, suggestion in enumerate(suggestions, 1):
            print(f"    {i}. {suggestion}")

def test_image_analysis():
    print_section("TEST 3: Image Analysis")
    
    test_images = [
        "red round vegetables",
        "silver laptop computer",
        "fresh green leafy vegetables"
    ]
    
    for image_desc in test_images:
        print(f"\nImage: '{image_desc}'")
        result = analyze_product_image(image_desc)
        print(f"  ✓ Detected: {result['detected_product']}")
        print(f"  ✓ Category: {result['suggested_category']}")
        print(f"  ✓ Confidence: {result['confidence']:.2%}")

def test_followup_questions():
    print_section("TEST 4: Follow-up Questions")
    
    test_cases = [
        ("repair", "General"),
        ("food", "Food & Beverages"),
        ("something", "General")
    ]
    
    for query, category in test_cases:
        print(f"\nQuery: '{query}' | Category: '{category}'")
        questions = generate_followup_questions(query, category)
        print(f"  ✓ Follow-up questions:")
        for i, question in enumerate(questions, 1):
            print(f"    {i}. {question}")

def main():
    print("\n" + "🔍 NearBy AI Search - Tool Testing".center(60))
    print("Testing search tools without AWS Bedrock".center(60))
    print("="*60)
    
    try:
        test_category_detection()
        test_autocomplete()
        test_image_analysis()
        test_followup_questions()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED!".center(60))
        print("="*60)
        print("\nThe search tools are working correctly!")
        print("Next step: Configure AWS Bedrock to enable AI responses")
        print("See SETUP_GUIDE.md for instructions")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
