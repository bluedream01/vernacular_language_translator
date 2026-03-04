from fastapi import APIRouter, Request
from schemas.user_schema import UserCreate

router = APIRouter()


@router.post("/translate")
async def create_user(user: UserCreate, request: Request):
    db = request.app.mongodb
    
    user_dict = user.dict()

    result = await db.users.insert_one(user_dict)

    return {
        "message": "User created successfully",
        "id": str(result.inserted_id)
    }