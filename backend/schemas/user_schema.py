from pydantic import BaseModel


class UserCreate(BaseModel):
    given: str
    translate: str