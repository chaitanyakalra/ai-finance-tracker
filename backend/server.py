from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json
from google import generativeai as genai

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure Gemini API
gemini_api_key = os.environ.get('GEMINI_API_KEY')
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Expense(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str
    amount: float
    category: str
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ExpenseCreate(BaseModel):
    date: str
    amount: float
    category: str
    description: str

class AIQueryRequest(BaseModel):
    question: str

class MultiAgentRequest(BaseModel):
    question: str
    context: Optional[dict] = None

# Sample data for demo
SAMPLE_EXPENSES = [
    {"id": str(uuid.uuid4()), "date": "2025-10-12", "amount": 1200, "category": "Food", "description": "Groceries"},
    {"id": str(uuid.uuid4()), "date": "2025-10-11", "amount": 500, "category": "Transport", "description": "Uber"},
    {"id": str(uuid.uuid4()), "date": "2025-10-10", "amount": 3500, "category": "Shopping", "description": "Clothes"},
    {"id": str(uuid.uuid4()), "date": "2025-10-09", "amount": 2000, "category": "Entertainment", "description": "Movie night"},
    {"id": str(uuid.uuid4()), "date": "2025-10-08", "amount": 800, "category": "Food", "description": "Restaurant"},
    {"id": str(uuid.uuid4()), "date": "2025-10-07", "amount": 5000, "category": "Bills", "description": "Electricity"},
    {"id": str(uuid.uuid4()), "date": "2025-10-06", "amount": 1500, "category": "Food", "description": "Groceries"},
    {"id": str(uuid.uuid4()), "date": "2025-10-05", "amount": 600, "category": "Transport", "description": "Petrol"}
]

# Initialize sample data
@app.on_event("startup")
async def startup_db():
    # Check if expenses collection is empty
    count = await db.expenses.count_documents({})
    if count == 0:
        # Add sample expenses
        for expense in SAMPLE_EXPENSES:
            expense_doc = expense.copy()
            expense_doc['created_at'] = datetime.now(timezone.utc).isoformat()
            await db.expenses.insert_one(expense_doc)
        logging.info("Sample expenses loaded")

# Routes
@api_router.get("/")
async def root():
    return {"message": "FinanceGuard AI Backend"}

@api_router.post("/expenses", response_model=Expense)
async def create_expense(input: ExpenseCreate):
    expense_dict = input.model_dump()
    expense_obj = Expense(**expense_dict)
    
    doc = expense_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.expenses.insert_one(doc)
    return expense_obj

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    
    for expense in expenses:
        if isinstance(expense.get('created_at'), str):
            expense['created_at'] = datetime.fromisoformat(expense['created_at'])
    
    return expenses

@api_router.get("/expenses/recent")
async def get_recent_expenses():
    expenses = await db.expenses.find({}, {"_id": 0}).sort("date", -1).limit(10).to_list(10)
    return expenses

@api_router.get("/expenses/stats")
async def get_expense_stats():
    expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
    
    total = sum(exp['amount'] for exp in expenses)
    
    # Calculate by category
    by_category = {}
    for exp in expenses:
        cat = exp['category']
        by_category[cat] = by_category.get(cat, 0) + exp['amount']
    
    return {
        "total": total,
        "by_category": by_category,
        "count": len(expenses)
    }

@api_router.post("/ai/chat")
async def ai_chat(request: AIQueryRequest):
    try:
        # Get expenses data
        expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
        
        # Prepare context for AI
        expense_summary = f"Total expenses: {len(expenses)}\n"
        by_category = {}
        for exp in expenses:
            cat = exp['category']
            by_category[cat] = by_category.get(cat, 0) + exp['amount']
        
        expense_summary += "\nSpending by category:\n"
        for cat, amt in by_category.items():
            expense_summary += f"- {cat}: ₹{amt:.2f}\n"
        
        expense_summary += f"\nRecent transactions:\n"
        for exp in expenses[-5:]:
            expense_summary += f"- {exp['date']}: {exp['category']} - ₹{exp['amount']} ({exp['description']})\n"
        
        # Use Gemini API
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        prompt = f"""
You are a personal finance assistant. Based on the following expense data, answer the user's question.

{expense_summary}

User Question: {request.question}

Provide a helpful, concise response with specific insights and recommendations.
"""
        
        response = model.generate_content(prompt)
        
        return {
            "response": response.text,
            "context": expense_summary
        }
    except Exception as e:
        logging.error(f"AI Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/multi-agent")
async def multi_agent_conversation(request: MultiAgentRequest):
    try:
        agents = [
            {
                "name": "Budget Analyst",
                "role": "Analyzes spending patterns and budget implications",
                "emoji": "📊"
            },
            {
                "name": "Investment Advisor",
                "role": "Provides investment and financial planning advice",
                "emoji": "💰"
            },
            {
                "name": "Risk Assessor",
                "role": "Evaluates financial risks and provides warnings",
                "emoji": "🛡️"
            }
        ]
        
        # Get expenses data for context
        expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
        total_expenses = sum(exp['amount'] for exp in expenses)
        
        context_info = f"Current monthly spending: ₹{total_expenses:.2f}"
        
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        responses = []
        
        for agent in agents:
            prompt = f"""
You are the {agent['name']}, a specialist in {agent['role']}.

User's financial context: {context_info}

User's question: {request.question}

Provide your expert analysis from your specialized perspective. Be concise (3-4 sentences max).
Focus on your area of expertise.
"""
            
            response = model.generate_content(prompt)
            
            responses.append({
                "agent": agent['name'],
                "emoji": agent['emoji'],
                "response": response.text
            })
        
        # Generate final summary
        summary_prompt = f"""
Based on these expert opinions:

{chr(10).join([f"{r['agent']}: {r['response']}" for r in responses])}

Provide a brief final recommendation (2-3 sentences) for the user's question: {request.question}
"""
        
        summary_response = model.generate_content(summary_prompt)
        
        return {
            "agents": responses,
            "summary": summary_response.text
        }
    except Exception as e:
        logging.error(f"Multi-agent error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/ai/behavioral-insight")
async def get_behavioral_insight():
    try:
        expenses = await db.expenses.find({}, {"_id": 0}).to_list(1000)
        
        if not expenses:
            return {"insight": "No data available yet", "stats": {}}
        
        # Analyze patterns
        by_category = {}
        for exp in expenses:
            cat = exp['category']
            by_category[cat] = by_category.get(cat, 0) + exp['amount']
        
        total = sum(by_category.values())
        
        # Find top spending category
        top_category = max(by_category.items(), key=lambda x: x[1])
        
        # Use Gemini for insight
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        prompt = f"""
Analyze this spending pattern and provide ONE key behavioral finance insight:

Total spending: ₹{total:.2f}
Spending by category: {json.dumps(by_category, indent=2)}

Provide:
1. A short insight title (max 10 words)
2. A brief explanation (2-3 sentences)
3. One actionable recommendation

Format your response as:
INSIGHT: [title]
EXPLANATION: [explanation]
RECOMMENDATION: [recommendation]
"""
        
        response = model.generate_content(prompt)
        insight_text = response.text
        
        return {
            "insight": insight_text,
            "stats": {
                "total": total,
                "top_category": top_category[0],
                "top_amount": top_category[1],
                "by_category": by_category
            }
        }
    except Exception as e:
        logging.error(f"Behavioral insight error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()