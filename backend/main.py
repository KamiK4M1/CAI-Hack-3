from fastapi import FastAPI, HTTPException
import requests
import json

from fastapi.middleware.cors import CORSMiddleware
origins = [
    "http://localhost",  # Replace with your frontend URL
    "http://localhost:3000",  # Example for React development server
    "https://your-frontend-domain.com",  # Add your production frontend domain
]




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of allowed origins
    allow_credentials=True,  # Allow cookies to be sent with requests
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# ตั้งค่า LLM API (ใช้ Llama หรือ OpenAI)
from openai import OpenAI
client = OpenAI(
   api_key='Your-api',
   base_url='https://api.opentyphoon.ai/v1'
)

# ข้อมูลตัวอย่างสำหรับระบบ
EMPLOYEES = [
    {"id": 1, "name": "Alice", "skills": ["cashier", "restocking"], "availability": "9:00-17:00"},
    {"id": 2, "name": "Bob", "skills": ["delivery", "packing"], "availability": "13:00-21:00"},
    {"id": 3, "name": "Charlie", "skills": ["cashier", "delivery"], "availability": "9:00-17:00"},
]

TASKS = [
    {"id": 1, "name": "Manage cashier", "priority": "low"},
    {"id": 2, "name": "Pack delivery orders", "priority": "low"},
    {"id": 3, "name": "Restock shelves", "priority": "low"},
]
FORECAST = [
    {"hour": "07:00", "expected_customers": 99}, 
    {"hour": "08:00", "expected_customers": 15},  
    {"hour": "09:00", "expected_customers": 20},
    {"hour": "10:00", "expected_customers": 35}, 
    {"hour": "11:00", "expected_customers": 50},  
    {"hour": "12:00", "expected_customers": 45},  
    {"hour": "13:00", "expected_customers": 30},
    {"hour": "14:00", "expected_customers": 40},  
    {"hour": "15:00", "expected_customers": 55},  
    {"hour": "16:00", "expected_customers": 50},  
    {"hour": "17:00", "expected_customers": 25},
    {"hour": "18:00", "expected_customers": 20},  
    {"hour": "19:00", "expected_customers": 15}, 
    {"hour": "20:00", "expected_customers": 10},  
    {"hour": "21:00", "expected_customers": 5},  
]


SHIFTS = [
    {"shift": "Morning", "time": "9:00-13:00"},
    {"shift": "Afternoon", "time": "13:00-17:00"},
    {"shift": "Evening", "time": "17:00-21:00"},
]

# ฟังก์ชันเรียก LLM API
def call_llm_agent(prompt, max_tokens=500):
    try:
        chat_completion = client.chat.completions.create(
            model="typhoon-v1.5x-70b-instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM API Error: {str(e)}")

# 1. Forecaster Agent: คาดการณ์เวลาที่ลูกค้ามาเยอะ
@app.get("/forecast_peak_hours")
def forecast_peak_hours():
    prompt = f"""
    Based on the historical customer data {FORECAST}, predict the peak hours for the next 24 hours.
Provide the top 2 peak hours in JSON format, including "hour" and "expected_customers" and i dont want anything more. (dont use python)

Example Output:
[
   "hour": "01:00", "expected_customers": 20 ,
   "hour": "17:00", "expected_customers": 25
]
    """
    peak_hours = call_llm_agent(prompt)
    print(peak_hours)
    # Extract only the JSON array from the response
    import json
    try:
        # Find the starting and ending indices of the JSON array
        start_index = peak_hours.find("[")
        end_index = peak_hours.rfind("]") + 1
        # Slice the string to extract the JSON array
        json_response = peak_hours[start_index:end_index]
        # Parse and validate JSON
        peak_hours_data = json.loads(json_response)
        return {"peak_hours": peak_hours_data}
    except (ValueError, IndexError) as e:
        return {"error": "Invalid response format"}

    
# 2. Task Manager Agent: ปรับ Priority งาน
@app.post("/adjust_priority")
def adjust_task_priority():
    peak_hours = ["11:00", "15:00"]  # ตัวอย่างข้อมูลจาก Forecaster Agent
    for task in TASKS:
        if "cashier" in task["name"].lower() or "delivery" in task["name"].lower():
            task["priority"] = "high" if any(peak in peak_hours for peak in ["11:00", "15:00"]) else "low"
    return {"updated_tasks": TASKS}

# 3. Scheduler Agent: จัดกะพนักงาน
@app.post("/schedule_shifts")
def schedule_shifts():
    prompt = f"""
    can you Create a shift schedule for employees {EMPLOYEES} based on their availability and the shifts {SHIFTS}.
    Assign tasks from {TASKS} based on employee skills (dont use python). and Output in JSON format and make it in this struct.
    left bracket
  "schedule": [
    left bracket
      "shift": "Morning",
      "time": "9:00-13:00",
      "employees": [
        left bracket
          "id": 1,
          "name": "Alice",
          "tasks": [
            left bracket
              "id": 1,
              "name": "Manage cashier",
              "priority": "high"
            right bracket
          ]
        right bracket,
        left bracket
          "id": 3,
          "name": "Charlie",
          "tasks": [
            left bracket
              "id": 1,
              "name": "Manage cashier",
              "priority": "high"
            right bracket
          ]
        right bracket
      ]
    right bracket,
    left bracket
      "shift": "Afternoon",
      "time": "13:00-17:00",
      "employees": [
        left bracket
          "id": 1,
          "name": "Alice",
          "tasks": [
            left bracket
              "id": 3,
              "name": "Restock shelves",
              "priority": "low"
            right bracket
          ]
        right bracket,
        left bracket
          "id": 3,
          "name": "Charlie",
          "tasks": [
            left bracket
              "id": 2,
              "name": "Pack delivery orders",
              "priority": "high"
            right bracket
          ]
        right bracket
      ]
    right bracket,
    left bracket
      "shift": "Evening",
      "time": "17:00-21:00",
      "employees": [
        left bracket
          "id": 2,
          "name": "Bob",
          "tasks": [
            left bracket
              "id": 2,
              "name": "Pack delivery orders",
              "priority": "high"
            right bracket
          ]
        right bracket
      ]
    right bracket
  ]
right bracket
    """
        # Find the starting and ending indices of the JSON array
    schedule = call_llm_agent(prompt)
    start_index = schedule.find("[")
    end_index = schedule.rfind("]") + 1
    # Slice the string to extract the JSON array
    json_response = schedule[start_index:end_index]
    # Parse and validate JSON
    print(schedule)
    schedule = json.loads(json_response)
    
    return {"schedule": schedule}
